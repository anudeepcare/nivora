import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function load(file,cache=new Map()){
 const full=path.resolve(file);if(cache.has(full))return cache.get(full).exports;
 const mod={exports:{}};cache.set(full,mod);
 const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',js)(id=>{
  if(id==='lightweight-charts')return {};
  if(id.endsWith('.css'))return {};
  if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(full),id);return load([base,base+'.ts',base+'.tsx'].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile()),cache);}
  return require(id);
 },mod,mod.exports);return mod.exports;
}
const calc=load('lib/research-structure.ts');
const WEEK=604800000;
const date=index=>new Date(Date.parse('2025-01-06')+index*WEEK).toISOString().slice(0,10);
const bar=(index,close)=>({time:date(index),open:close,high:close+10,low:close-10,close,volume:100});
const swing=[bar(0,110),bar(1,150),bar(2,190)];
const options={asOf:date(4),mode:'manual',startDate:date(0),endDate:date(2),direction:'UP'};
const markerBars=[130,120,100,130,160,190,170,140,120,150,160,80].map((price,index)=>bar(index,price));
markerBars[9].low=125; // The reclaim week actually trades through the 132.02 threshold.

test('F01: every level exposes decimal and percentage, including the two anchor endpoints',()=>{
 const model=calc.buildResearchStructure(swing,options);
 assert.deepEqual(model.levels.map(x=>x.ratio),[0,.236,.382,.5,.618,.786,1,1.272,1.618]);
 for(const level of model.levels){assert.ok(level.label.includes(level.ratio.toFixed(3)));assert.match(level.label,/%/);}
 assert.equal(model.levels.find(x=>x.ratio===0).price,200);
 assert.equal(model.levels.find(x=>x.ratio===1).price,100);
 assert.equal(model.levels.find(x=>x.ratio===1).kind,'ENDPOINT');
 assert.match(model.levels.find(x=>x.ratio===.5).label,/convention/i);
});

test('F02: custom 0.686 is opt-in, labeled custom, and computed from the selected anchors',()=>{
 assert.equal(calc.buildResearchStructure(swing,options).levels.some(x=>x.ratio===.686),false);
 const level=calc.buildResearchStructure(swing,{...options,custom686:true}).levels.find(x=>x.ratio===.686);
 assert.ok(level,'selected custom retracement must be available');
 assert.equal(level.custom,true);assert.match(level.label,/0\.686.*68\.6%.*custom/i);
 assert.ok(Math.abs(level.price-131.4)<1e-9);
});

test('F03: choosing a personal swing preserves a separate reproducible automatic study',()=>{
 assert.equal(typeof calc.buildResearchStructureStudies,'function');
 const automatic=calc.buildResearchStructure(markerBars,{asOf:date(10)});
 const studies=calc.buildResearchStructureStudies(markerBars,{asOf:date(10),mode:'manual',startDate:date(0),endDate:date(5),direction:'UP'});
 assert.deepEqual(studies.automatic,automatic);
 assert.equal(studies.personal.anchors.start.time,date(0));
 assert.equal(studies.automatic.anchors.start.time,date(2));
 assert.equal(studies.personal.anchors.confirmedAt,null);
});

test('F06: reclaim marker is first known after the signal week closes, using anchors already known at its start',()=>{
 assert.equal(typeof calc.buildResearchSetupMarkers,'function');
 const before=calc.buildResearchSetupMarkers(calc.buildResearchStructure(markerBars,{asOf:date(9)}));
 const observed=calc.buildResearchSetupMarkers(calc.buildResearchStructure(markerBars,{asOf:date(10)}));
 assert.deepEqual(before,[]);assert.equal(observed.length,1);
 const marker=observed[0];
 assert.equal(marker.signalWeek,date(9));assert.equal(marker.firstKnownAt,date(10));
 assert.equal(marker.anchors.confirmedAt,date(8));
 assert.ok(Math.abs(marker.reclaimPrice-132.02)<1e-9);
 assert.equal(marker.invalidationPrice,90);assert.equal(marker.invalidatedAt,null);
 assert.equal(marker.ruleVersion,'auryn-weekly-reclaim-v1');
 assert.ok(marker.conditions.every(x=>typeof x==='string'&&x.length>10));
});

test('F06: future bars and personal settings cannot backdate, rewrite or manufacture historical signals',()=>{
 assert.equal(typeof calc.buildResearchSetupMarkers,'function');
 const atSignal=calc.buildResearchSetupMarkers(calc.buildResearchStructure(markerBars,{asOf:date(10)}));
 const withFuture=calc.buildResearchSetupMarkers(calc.buildResearchStructure([...markerBars,bar(12,500)],{asOf:date(10),mode:'manual',startDate:date(0),endDate:date(5),custom686:true,scale:'log'}));
 assert.deepEqual(withFuture,atSignal);
 const later=calc.buildResearchSetupMarkers(calc.buildResearchStructure(markerBars,{asOf:date(12)}));
 assert.equal(later[0].id,atSignal[0].id);assert.equal(later[0].firstKnownAt,atSignal[0].firstKnownAt);
 assert.equal(later[0].reclaimPrice,atSignal[0].reclaimPrice);assert.equal(later[0].invalidatedAt,date(12));
 assert.match(later[0].invalidation,/completed weekly close below/i);
});

test('F06: a missing week cannot serve as the adjacent close required by a reclaim marker',()=>{
 assert.equal(typeof calc.buildResearchSetupMarkers,'function');
 const markers=calc.buildResearchSetupMarkers(calc.buildResearchStructure(markerBars.filter((_,index)=>index!==8),{asOf:date(10)}));
 assert.deepEqual(markers,[]);
});

test('weekly controls expose opt-in custom level, completed-bar status and independent research boundary',()=>{
 const Component=load('components/research/WeeklyStructure.tsx').default;
 const html=renderToStaticMarkup(React.createElement(Component,{symbol:'TEST',bars:markerBars,asOf:date(10)}));
 for(const term of ['Custom 0.686','Automatic study','AURYN weekly reclaim','First known','Latest plotted bar','15-minute','hourly','Action levels'])assert.ok(html.includes(term),term);
 assert.match(html,/business.*valuation/i);
 assert.match(html,/0\.236/);assert.match(html,/23\.6%/);
});

test('F05: missing intraday studies explain absence without inventing ratings or action levels',()=>{
 const Component=load('components/market/MarketTimeframeTape.tsx').default;
 const html=renderToStaticMarkup(React.createElement(Component,{marketIntelligence:{snapshotId:'s1',confirmed:{'1D':{rating:'BUY'}},coverage:{missing:['15M','1H'],reasons:{'15M':'Provider access unavailable for this interval.'}}}}));
 assert.match(html,/15M/);assert.match(html,/Provider access unavailable/);assert.match(html,/1H/);
 assert.match(html,/40 completed/);assert.match(html,/Unavailable/);
 assert.match(html,/Technical ratings.*investment instruction/i);
});
