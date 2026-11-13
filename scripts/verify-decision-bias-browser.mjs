// Offline synthetic integration QA. Never deploy this temporary preview route.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {demoData} from '../tests/fixtures/demo.ts';
import {aurynDecision} from '../lib/auryn-decision.ts';
import {evidenceOdds} from '../lib/evidence-odds.ts';
const {chromium}=await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
const directory='app/preview/decision-bias-qa',out='verification/decision-bias-20261113/browser';
const port=Number(process.env.AURYN_QA_PORT||3194),base=`http://127.0.0.1:${port}`;
const cases={};
for(const state of ['qualified-p2','qualified-p4','funded-review','short-runway','forming-p2']) {
 const demo=structuredClone(demoData),r=demo.research.MSFT;
 r.company.name=`SYNTHETIC QA ${state} (not Microsoft data)`;
 r.historySource='Synthetic QA only, not market data';
 for(const b of r.history){const factor=b.time >= (state==='forming-p2'?'2026-10-01':'2026-08-01') ? (state==='qualified-p4'?.4:.8) : b.time==='2026-05-15'?1.6:1;for(const k of ['open','high','low','close'])b[k]*=factor;}
 r.quote.price=r.history.at(-1).close;
 if(['funded-review','short-runway'].includes(state)) {
  r.facts=r.facts.filter(f=>f.scope==='annual');
  for(const f of r.facts){if(f.metric==='operatingIncome')f.value=-Math.abs(f.value)*.2;if(f.metric==='operatingCashFlow')f.value=-10e9;if(f.metric==='capex')f.value=10e9;}
  const anchor=r.facts.find(f=>f.end==='2026-06-30');
  for(const [metric,value] of Object.entries({cash:state==='short-runway'?5e9:50e9,debt:0,equity:100e9}))r.facts.push({...anchor,id:`qa-${metric}`,metric,value,scope:'instant',start:null});
 }
 const d=aurynDecision(r,{now:Date.parse(r.retrievedAt)});
 const expected=state==='qualified-p2'?'Buy small':state==='qualified-p4'?'Buy within limits':state==='forming-p2'?'Watch':state==='short-runway'?'Avoid':'Review business';
 assert.equal(d.actionLabel,expected,JSON.stringify({state,actual:d.actionLabel,funding:d.fundingAssessment}));
 if(state.startsWith('qualified')) {assert.ok(evidenceOdds(r,{operatingMargin:45.2,fcf:1,revenueGrowth:12,dilution:0}).offHigh>=30);assert.ok(d.pace.eligibleLevel>=2);}
 cases[state]={demo,expected,holding: d.actionLabels?.holding,pace:d.pace,actions:d.actions};
}
await fs.mkdir(out,{recursive:true});
await fs.writeFile(`${out}/engine-fixtures.json`,JSON.stringify(Object.fromEntries(Object.entries(cases).map(([state,{expected,pace,actions}])=>[state,{expected,pace,actions}])),null,2));
try {await fs.access(directory);throw Error('Refusing to overwrite existing QA route');} catch(e){if(e.code!=='ENOENT')throw e;}
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(`${directory}/data.json`,JSON.stringify(cases));
await fs.writeFile(`${directory}/page.tsx`,`import {headers} from 'next/headers'; import {notFound} from 'next/navigation'; import Product from '@/components/Product'; import {allowedPreview} from '@/lib/presentation/preview'; import data from './data.json'; import type {Research,Workspace} from '@/lib/types'; export const dynamic='force-dynamic'; export default async function Page({searchParams}:{searchParams:Promise<{state?:string}>}) {if(process.env.NODE_ENV==='production'||!allowedPreview((await headers()).get('host')||'',process.env.AURYN_ENABLE_PREVIEW))notFound(); const state=(await searchParams).state||'qualified-p2'; const item=data[state as keyof typeof data]; if(!item)notFound();return <><div style={{padding:12,background:'#233e39',color:'#fff'}}>Synthetic QA preview · {state} · not real company evidence or investment advice</div><Product route={['research','MSFT']} demo={item.demo as unknown as {research:Record<string,Research>;workspace:Workspace}}/></>;}`);
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,AURYN_ENABLE_PREVIEW:'true',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let serverLog='',browser;server.stdout.on('data',b=>serverLog+=b);server.stderr.on('data',b=>serverLog+=b);const report=[];
try {
 for(let i=0;i<120;i++){try{if((await fetch(base)).ok)break;}catch{}if(i===119)throw Error('Server startup timeout');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.AURYN_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const width of [1440,390,320])for(const [state,item] of Object.entries(cases)){
  const context=await browser.newContext({viewport:{width,height:width>900?1050:900}});
  await context.addInitScript(()=>{localStorage.setItem('auryn-product-theme','light');localStorage.setItem('auryn-product-motion','reduce');});
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/preview/decision-bias-qa?state=${state}`,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'For a new purchase',exact:true}).click();
  await page.getByRole('heading',{name:item.expected,exact:true}).waitFor();
  const instrument=page.locator('[aria-label="Current AURYN price zone"]');
  const entryText=await instrument.innerText();
  if(state==='forming-p2'){assert.match(entryText,/P2 is provisional/);assert.match(entryText,/uses P1/);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${state} ${width}: overflow`);
  await page.screenshot({path:`${out}/${state}-${width}-entry.png`,fullPage:true});
  await page.getByRole('button',{name:'For your holding',exact:true}).click();
  const holding=state==='qualified-p2'?'Add small':state==='qualified-p4'?'Add within limits':state==='forming-p2'?'Hold':state==='short-runway'?'Reduce':'Review business';
  await page.getByRole('heading',{name:holding,exact:true}).waitFor();
  await page.screenshot({path:`${out}/${state}-${width}-holding.png`,fullPage:true});
  await page.getByRole('button',{name:'For a new purchase',exact:true}).click();
  await page.getByRole('heading',{name:item.expected,exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  report.push({state,width,expected:item.expected,holding,entryText,pace:item.pace,actions:item.actions,errors});console.log('PASS',state,width,item.expected,holding);await context.close();
 }
 await fs.writeFile(`${out}/browser-report.json`,JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await fs.rm(directory,{recursive:true,force:true});await fs.writeFile(`${out}/browser-server.log`,serverLog);}
