import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const td=(symbol,base)=>({meta:{symbol,interval:'1day',currency:'USD',exchange:'NASDAQ',exchange_timezone:'America/New_York',type:'Common Stock'},values:[
 {datetime:'2024-01-03',open:String(base+1),high:String(base+2),low:String(base),close:String(base+1.5),volume:'1200'},
 {datetime:'2024-01-02',open:String(base),high:String(base+1),low:String(base-1),close:String(base+.5),volume:'1000'}
]});

test('V9.2 normalizer assembles corporate actions, earnings, revisions, sector and macro families into one replay bundle',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auryn-v92-normalize-'));
 const input=path.join(dir,'raw.json'),output=path.join(dir,'replay.json');
 fs.writeFileSync(input,JSON.stringify({
  datasetId:'integration',benchmarkSymbol:'SPY',securities:[{symbol:'AAA',sector:'Technology'}],
  twelveData:{AAA:td('AAA',100),SPY:td('SPY',400)},
  twelveDataSplits:{AAA:{splits:[]}},
  twelveDataDividends:{AAA:{dividends:[{ex_date:'2024-01-03',amount:.25}]}},
  twelveDataEarnings:{AAA:{earnings:[{date:'2024-01-03',eps_estimate:1,eps_actual:1.2,difference:.2,surprise_prc:20}]}},
  researchEvents:[
   {symbol:'AAA',metric:'eps_revision_breadth',value:.3,availableAt:'2024-01-02'},
   {symbol:'AAA',metric:'sector_relative_strength',value:1.1,availableAt:'2024-01-02'}
  ],
  fredVintages:[{seriesId:'FEDFUNDS',metric:'fed_funds_rate',payload:{observations:[{date:'2023-12-01',realtime_start:'2024-01-01',value:'5.33'}]}}]
 }));
 const script=new URL('../scripts/run_v92_normalize.mjs',import.meta.url);
 const r=spawnSync(process.execPath,[script.pathname,`--input=${input}`,`--output=${output}`],{encoding:'utf8'});
 assert.equal(r.status,0,`normalizer failed: ${r.stderr}\n${r.stdout}`);
 const replay=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(replay.corporateActions.length,1);
 assert.ok(replay.events.some(x=>x.metric==='earnings_eps_actual'));
 assert.ok(replay.events.some(x=>x.metric==='surprise_streak'));
 assert.ok(replay.events.some(x=>x.metric==='eps_revision_breadth'));
 assert.ok(replay.events.some(x=>x.metric==='sector_relative_strength'));
 assert.ok(replay.events.some(x=>x.symbol==='__MACRO__'&&x.metric==='fed_funds_rate'));
 assert.deepEqual(replay.adapterCoverage.CORPORATE_ACTIONS,['AAA']);
 assert.deepEqual(replay.adapterCoverage.EARNINGS,['AAA']);
 assert.deepEqual(replay.adapterCoverage.REVISION,['AAA']);
 assert.deepEqual(replay.adapterCoverage.SECTOR,['AAA']);
 assert.deepEqual(replay.adapterCoverage.MACRO,['__MACRO__']);
});
