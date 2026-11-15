// Local built-app smoke checks only. No credentials, account actions or provider calls.
// This checks HTTP responses, not visual layout or client interaction.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const port=Number(process.env.AURYN_QA_PORT || 3198);
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
  env:{PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'},
  stdio:['ignore','pipe','pipe'],
});
let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
const results=[];
try {
  for(let i=0;i<60;i++) {
    if(server.exitCode!==null) throw Error(`Preview exited: ${log}`);
    try {const response=await fetch(base,{signal:AbortSignal.timeout(1000)});if(response.status===200)break;} catch{}
    if(i===59) throw Error(`Local built server did not become ready: ${log}`);
    await new Promise(r=>setTimeout(r,250));
  }
  const routes=['/','/sample','/about','/pace','/portfolio-check','/track-record','/pricing','/contact','/login','/reset-password','/terms','/privacy','/risk','/methodology','/reliability','/help','/changelog','/overview','/research','/research/MSFT','/portfolio','/watchlist','/settings','/plans','/compare','/alerts','/research-lab','/trading','/discover','/monthly-plan','/owner'];
  for(const route of routes){
    const response=await fetch(base+route,{signal:AbortSignal.timeout(15000),redirect:'manual'});
    const body=await response.text();
    assert.equal(response.status,200,`${route}: ${response.status}`);
    assert.ok(body.includes('AURYN'),`${route}: expected brand document`);
    results.push({route,status:response.status,html:true});
  }
  for(const route of ['/preview/research/MSFT','/not-a-route']){
    const response=await fetch(base+route,{signal:AbortSignal.timeout(15000),redirect:'manual'});
    assert.equal(response.status,404,`${route}: should not be publicly available`);
    results.push({route,status:response.status,expectedNotFound:true});
  }
  const output={passed:true,mode:'local production build; no configured credentials; HTTP only, not browser UI',routes:results};
  const directory='verification/brand-navigation-20261115';fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(`${directory}/route-smoke.json`,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output,null,2));
} finally {server.kill('SIGTERM');}
