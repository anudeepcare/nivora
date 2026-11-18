import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyGrowth, journeyPlot } from '../lib/pace-evidence-journey.ts';
const point=(date,value,currency='USD',basis='GAAP')=>({date,value,currency,basis});
test('growth requires annual comparable positive baseline, never assumes currency',()=>{
 assert.equal(journeyGrowth([point('2025-12-31',100),point('2026-12-31',120)]),20);
 assert.equal(journeyGrowth([point('2025-12-31',-2),point('2026-12-31',2)]),null);
 assert.equal(journeyGrowth([point('2025-12-31',100),point('2026-12-31',120,'CAD')]),null);
 assert.equal(journeyGrowth([point('2025-12-31',100),point('2026-12-31',120,'USD','adjusted')]),null);
 assert.equal(journeyGrowth([point('2025-12-31',100,null),point('2026-12-31',120,null)]),null);
});
test('plot retains gaps and never fabricates missing values',()=>{
 const p=journeyPlot([point('2024-12-31',0),point('2025-12-31',null),point('2026-12-31',-10)]);
 assert.equal(p.dots.length,2); assert.equal(p.segments.length,2);
 assert.ok(p.dots.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
 assert.equal(journeyPlot([]).dots.length,0);
});
test('evidence chart renders accessible dated facts separately from estimates and clear missing states',async()=>{
 const fs=await import('node:fs'),ts=(await import('typescript')).default,React=await import('react'),jsx=await import('react/jsx-runtime'),{renderToStaticMarkup}=await import('react-dom/server');
 const format=await import('../lib/format.ts'),logic=await import('../lib/pace-evidence-journey.ts'),display=await import('../lib/evidence-display.ts');
 const source=ts.transpileModule(fs.readFileSync('components/PaceEvidenceJourney.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',source)(name=>{
 if(name==='react')return React;if(name==='react/jsx-runtime')return jsx;
 if(name==='@/lib/engine')return {financialPeriods:f=>f};
 if(name==='@/lib/evidence-display')return {...display,upcomingEstimates:r=>r.evidence?.estimates??[]};
 if(name==='@/lib/pace-evidence-journey')return logic;if(name==='@/lib/format')return format;
 if(name.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,k)=>String(k)})};throw Error(name);
 },mod,mod.exports);
 const r={company:{symbol:'TEST',assetType:'stock'},retrievedAt:'2026-11-17',facts:[{end:'2024-12-31',revenue:100,currency:'USD',basis:'GAAP',filed:'2025-02-01',sourceUrl:'https://example.com/filing'},{end:'2025-12-31',revenue:120,currency:'USD',basis:'GAAP',filed:'2026-02-01',sourceUrl:'https://example.com/latest'}],evidence:{estimates:[{date:'2026-12-31',revenue:140,currency:'USD',revenueLow:130,revenueHigh:150,analysts:4}]}};
 const render=r=>renderToStaticMarkup(React.createElement(mod.exports.default,{research:r}));const html=render(r);
 assert.equal((html.match(/<svg/g)||[]).length,2);assert.match(html,/Chart scale/);assert.match(html,/Date extent/);assert.match(html,/PAST → CURRENT/);assert.match(html,/FORWARD · ANALYST ESTIMATES/);
 assert.match(html,/role="button" tabindex="0"/);assert.match(html,/Inspect period/);assert.match(html,/Supplied range/);assert.match(html,/accounting bases/);assert.match(html,/No revision trend is inferred/);assert.match(html,/Read reported source/);
 const missing=render({...r,facts:[],evidence:{estimates:[]}});assert.doesNotMatch(missing,/<svg|NaN|Infinity/);assert.match(missing,/No projection is drawn/);
});
test('sparse annual dates break paths and elapsed time determines spacing',()=>{
 const p=journeyPlot([point('2023-12-31',10),point('2025-12-31',20),point('2026-12-31',30)]);
 assert.deepEqual(p.segments.map(s=>s.length),[1,2]);
 assert.ok(p.dots[1].x>240,'two-year gap must occupy more width than one-year gap');
 const invalid=journeyPlot([point('2023-12-31',10),point('2023-12-31',20),point('2022-12-31',30),point('not-a-date',40)]);
 assert.equal(invalid.dots.length,1);
});
test('unknown currency never produces plotted numeric estimates',()=>{
 assert.equal(journeyPlot([point('2025-12-31',100,null),point('2026-12-31',200,null)]).dots.length,0);
});

test('chart exposes the actual numeric domain and date extents used by its coordinates',()=>{
 const p=journeyPlot([point('2023-12-31',-5),point('2024-12-31',null),point('2025-12-31',15)]);
 assert.deepEqual(p.domain,{low:-5,high:15,start:'2023-12-31',end:'2025-12-31'});
 assert.deepEqual(journeyPlot([point('2025-12-31',0)]).domain,{low:0,high:1,start:'2025-12-31',end:'2025-12-31'});
});
