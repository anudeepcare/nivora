import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {researchAccumulation} from '../lib/accumulation-policy-v6.ts';
import {paceFeatures,classifyPace} from '../lib/pace-classifier.ts';
const base=process.argv[2],out=process.argv[3];
const original=JSON.parse(fs.readFileSync(`${base}/comparison.json`));
const saved=JSON.parse(fs.readFileSync('verification/pace-performance-20261108/technical-feature-expanded.json'));
const expected=new Map(saved.rows.map(r=>[r.symbol,r]));
const golden=new Map(JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-golden.json')).map(r=>[r.symbol,r]));
const rows=[];const start=performance.now();
for(const r of original.rows.filter(r=>r.status==='compared')){
 const raw=JSON.parse(fs.readFileSync(`${base}/raw/${r.symbol}.json`));
 const bars=raw.raw.trim().split('\n').slice(1).map(line=>{const [time,open,high,low,close,volume]=line.split(';');return {time,open:+open,high:+high,low:+low,close:+close,volume:+volume};}).filter(b=>b.time<='2026-11-06').sort((a,b)=>a.time.localeCompare(b.time));
 const f=paceFeatures(bars,r.formulaInputs.z,r.formulaInputs.deviation/100);
 assert.ok(f,`features ${r.symbol}`);
 const g=golden.get(r.symbol);
 const delta=Math.max(...f.map((v,i)=>Math.abs(v-g.features[i])));
 assert.ok(delta<1e-8,`feature parity ${r.symbol}: ${delta}`);
 assert.equal(classifyPace(f),g.expected,`classifier ${r.symbol}`);
 const result=researchAccumulation(bars,original.asOf);
 const signal=result.forming??result.confirmed;
 const actual=signal?.multiplier===0?(signal.trimTier==='strong'?'STRONG_TRIM':'LIGHT_TRIM'):String(signal?.multiplier);
 rows.push({symbol:r.symbol,split:expected.get(r.symbol).split,reference:r.dcaZone,expected:expected.get(r.symbol).candidate,actual,match:actual===r.dcaZone,version:result.version,boundary:signal?.conditionalBoundary??null});
}
const reserved=rows.filter(r=>r.split==='reserved'),deep=reserved.filter(r=>['2','3','4'].includes(r.reference));
const parity=rows.filter(r=>r.actual!==r.expected);
const report={engine:'monthly-v6',enabledInApp:true,scope:'Actual shared TypeScript engine; saved explored snapshot, not independent return accuracy.',total:rows.length,parityMismatches:parity,elapsedMs:performance.now()-start,reserved:{n:reserved.length,matches:reserved.filter(r=>r.match).length},deeper:{n:deep.length,matches:deep.filter(r=>r.match).length},rows};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined},null,2));assert.equal(parity.length,0,'app parity');
