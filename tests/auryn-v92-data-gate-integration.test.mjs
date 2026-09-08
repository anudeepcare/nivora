import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const bar=(symbol,date,close)=>({symbol,date,open:close-.5,high:close+1,low:close-1,close,volume:1000,adjusted:true});
const canonical=()=>({
 meta:{datasetId:'gate-fixture',version:'1',source:'TEST',benchmarkSymbol:'SPY',adjustedPrices:true,pointInTimeUniverse:true,includesDelisted:true,delistingReturnsHandled:true},
 securities:[{symbol:'AAA'},{symbol:'OLD',activeTo:'2024-01-03',delistedDate:'2024-01-03',delistingReturnPct:-20}],
 dailyBars:[bar('AAA','2024-01-02',100),bar('AAA','2024-01-03',101),bar('OLD','2024-01-02',10),bar('OLD','2024-01-03',9)],
 benchmarkBars:[bar('SPY','2024-01-02',400),bar('SPY','2024-01-03',401)],
 facts:[{symbol:'AAA',metric:'revenue',value:1000,periodEnd:'2023-12-31',availableAt:'2024-01-02'}],
 events:[
  {symbol:'AAA',metric:'earnings_eps_actual',value:1.2,availableAt:'2024-01-02'},
  {symbol:'AAA',metric:'eps_revision_breadth',value:.2,availableAt:'2024-01-02'},
  {symbol:'AAA',metric:'sector_relative_strength',value:1.1,availableAt:'2024-01-02'},
  {symbol:'__MACRO__',metric:'fed_funds_rate',value:5.25,availableAt:'2024-01-02'}
 ],
 universeSnapshots:[{date:'2024-01-01',symbols:['AAA','OLD']}],
 corporateActions:[{symbol:'AAA',type:'DIVIDEND',date:'2024-01-03',ratio:null,amount:.25,availableAt:'2024-01-03',source:'TEST'}],
 adapterCoverage:{FUNDAMENTALS:['AAA','OLD'],EARNINGS:['AAA','OLD'],REVISION:['AAA','OLD'],SECTOR:['AAA','OLD'],MACRO:['__MACRO__'],CORPORATE_ACTIONS:['AAA','OLD']}
});
const run=bundle=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auryn-v92-gate-')),input=path.join(dir,'bundle.json');fs.writeFileSync(input,JSON.stringify(bundle));
 const script=new URL('../scripts/run_v92_data_audit.mjs',import.meta.url);
 return spawnSync(process.execPath,[script.pathname,`--input=${input}`,'--require-decision-grade','--min-symbol-coverage=100','--min-years=1','--required-families=FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS','--max-session-gap-pct=0'],{encoding:'utf8'});
};

test('V9.2 canonical data gate passes only when every required family and integrity condition is present',()=>{
 const good=run(canonical());assert.equal(good.status,0,`canonical gate should pass: ${good.stderr}\n${good.stdout}`);const report=JSON.parse(good.stdout);assert.equal(report.status,'PASS');assert.equal(report.coverage.corporateActionCorruptionCount,0);assert.equal(report.coverage.sessionGapCount,0);assert.equal(report.gate.failures.length,0);
 const bad=canonical();bad.events=bad.events.filter(x=>x.symbol!=='__MACRO__');delete bad.adapterCoverage.MACRO;
 const blocked=run(bad);assert.notEqual(blocked.status,0,'missing canonical family must block V9.2');const blockedReport=JSON.parse(blocked.stdout);assert.ok(blockedReport.gate.failures.some(x=>/MACRO/.test(x)));
});
