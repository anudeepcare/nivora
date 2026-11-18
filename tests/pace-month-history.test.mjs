import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../lib/pace-month-history.ts').catch(()=>({}));
const signal=(month,level)=>({month,date:month+'-28',multiplier:level,close:100+level,reason:'Reported history',policyVersion:'monthly-v6'});
test('previous12calendar months use actual historical levels and retain gaps, never forming',()=>{
 assert.equal(typeof module.paceMonthHistory,'function');
 const rows=module.paceMonthHistory([signal('2025-12',0),signal('2026-10',4),signal('2026-11',3)],'2026-11-17T20:00:00Z');
 assert.equal(rows.length,12);assert.equal(rows[0].month,'2025-11');assert.equal(rows.at(-1).month,'2026-10');
 assert.equal(rows[0].reading,null);assert.equal(rows[1].reading.multiplier,0);assert.equal(rows.at(-1).reading.multiplier,4);
 assert.equal(rows.at(-1).reading.policyVersion,'monthly-v6');
 assert.ok(!rows.some(r=>r.month==='2026-11'));
});
test('invalid levels, prices, mismatched dates and conflicting duplicates remain unavailable',()=>{
 assert.equal(typeof module.paceMonthHistory,'function');
 const rows=module.paceMonthHistory([signal('2026-01',9),{...signal('2026-02',2),close:NaN},{...signal('2026-03',2),date:'2026-04-28'},signal('2026-04',2),signal('2026-04',3)],'2026-11-17');
 assert.ok(rows.every(r=>r.reading===null));assert.deepEqual(module.paceMonthHistory([],'invalid'),[]);
});
test('history view exposes genuine dated levels, gaps and keyboard native inspection with shared colours',async()=>{
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');const ts=(await import('typescript')).default;const fs=await import('node:fs');const jsx=await import('react/jsx-runtime');
 const colours=(await import('../lib/pace-chart-levels.ts')).paceChartColours;
 let selected=null;
 let suppliedHistory=[signal('2025-12',0),signal('2026-10',4)];
 const react={...React,useMemo:f=>f(),useState:()=>[selected,v=>selected=v]};
 const code=ts.transpileModule(fs.readFileSync('components/PaceMonthHistory.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>{
  if(name==='react')return react;if(name==='react/jsx-runtime')return jsx;
  if(name==='@/lib/accumulation-policy-v7')return {researchAccumulation:()=>({history:suppliedHistory})};
  if(name==='@/lib/pace-month-history')return module;if(name==='@/lib/pace-chart-levels')return {paceChartColours:colours};
  if(name==='@/lib/pace-presentation')return {PACE_LEVELS:['Paused','Watch zone','Initial zone','Deeper zone','Deep zone']};
  if(name==='@/lib/format')return {dateLabel:v=>v,amount:(v,c)=>`${c} ${v}`};
  if(name.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};throw Error(name);
 },mod,mod.exports);
 const render=()=>mod.exports.default({research:{history:[],retrievedAt:'2026-11-17',company:{assetType:'stock',currency:'USD'}}});
 let tree=render();let html=renderToStaticMarkup(tree);
 assert.equal((html.match(/<button/g)||[]).length,12);assert.match(html,/2 of 12/);assert.match(html,/monthly-v6/);assert.match(html,/USD 104/);assert.match(html,/--zone:#ac68e5/);
 const all=(n)=>!n||typeof n!=='object'?[]:[n,...React.Children.toArray(n.props?.children).flatMap(all)];
 all(tree).find(n=>n.type==='button'&&n.props['aria-label'].includes('Dec 25')).props.onClick();
 html=renderToStaticMarkup(render());assert.match(html,/P0/);assert.match(html,/Completed 2025-12-28/);assert.match(html,/USD 100/);
 all(render()).find(n=>n.type==='button'&&n.props['aria-label'].includes('Nov 25')).props.onClick();assert.match(renderToStaticMarkup(render()),/Missing history is not a P0/);
 suppliedHistory=[];html=renderToStaticMarkup(render());assert.doesNotMatch(html,/<button/);assert.match(html,/No eligible completed monthly readings/);
});
