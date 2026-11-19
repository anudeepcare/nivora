import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('Pace chart and decision use the same canonical monthly engine',()=>{
 for(const path of ['components/AccumulationDesk.tsx','lib/analysis.ts','lib/pace-history-insights.ts']) assert.match(read(path),/accumulation-policy-v7/);
});
test('Pace threshold lines explicitly use corresponding candle legend colors',()=>{
 const s=read('lib/pace-chart-levels.ts');
 assert.match(read('components/AccumulationDesk.tsx'), /paceChartLevels\(chosen.forming, confirmed\)/);
 for(const n of [2,3,4]) assert.match(s,new RegExp(`label: "P${n} zone", price: signal.buy${n}, color: colours\\[${n}\\]`));
 assert.doesNotMatch(s,/className="candidate-levels"/);
});
test('historical caption uses actual returned policy version, never hardcoded v5',()=>{
 assert.match(read('components/PaceHistoryInsights.tsx'),/data.version/);
 assert.doesNotMatch(read('components/PaceHistoryInsights.tsx'),/Monthly v5/);
});
test('forming v7 never inherits legacy confirmed price bands',async()=>{
 const {researchAccumulation}=await import('../lib/accumulation-policy-v7.ts');
 const {paceChartLevels}=await import('../lib/pace-chart-levels.ts');
 const bars=JSON.parse(read('tests/fixtures/pace-v6-bars.json'))[0].bars.sort((a,b)=>a.time.localeCompare(b.time));
 const policy=researchAccumulation([...bars,{...bars.at(-1),time:'2026-11-11'}],'2026-11-12T04:00:00Z');
 assert.equal(policy.confirmed.policyVersion,'monthly-v5');
 assert.ok(policy.confirmed.buy2>0);
 assert.equal(policy.forming.policyVersion,'monthly-v7');
 assert.deepEqual(paceChartLevels(policy.forming,policy.confirmed),[]);
 assert.ok(paceChartLevels(null,policy.confirmed).length>0);
});
test('Pace exposes settled chart close separately from latest quoted price',()=>{
 const source=read('components/AccumulationDesk.tsx');
 assert.match(source,/Settled chart close/);
 assert.match(source,/Latest quoted price/);
 assert.match(source,/monthly.at\(-1\)\?\.close/);
 assert.match(source,/r.quote.asOf/);
 assert.match(source,/not used to overwrite settled chart history/);
});
