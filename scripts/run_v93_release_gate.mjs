import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const requireData=process.argv.includes('--require-data');
const replay=process.env.AURYN_V92_REPLAY_BUNDLE||'';
const base=process.env.AURYN_V93_BASE_OBSERVATIONS||'';
const manifest=process.env.AURYN_V93_OBSERVATION_MANIFEST||'';
const outputRoot=path.resolve(process.env.AURYN_V93_GATE_OUTPUT_DIR||'.v93-gate');
const npmBin=process.platform==='win32'?'npm.cmd':'npm';
const gates=[];
function runNpm(name,args=[],env={}){
  const r=spawnSync(npmBin,['run',name,...(args.length?['--',...args]:[])],{stdio:'inherit',env:{...process.env,...env}});
  const pass=r.status===0;
  gates.push({name,status:pass?'PASS':'BLOCKED',exitCode:r.status});
  return pass;
}
let ok=true;
ok=runNpm('test:v93-core')&&ok;
ok=runNpm('test')&&ok;
ok=runNpm('audit:v8-reality')&&ok;
ok=runNpm('audit:v65')&&ok;
const haveData=Boolean(replay&&base&&manifest);
if(haveData){
  const required=process.env.AURYN_V92_REQUIRED_FAMILIES||'FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS';
  ok=runNpm('audit:v92-data',[`--input=${replay}`,'--require-decision-grade',`--min-symbol-coverage=${process.env.AURYN_V92_MIN_SYMBOL_COVERAGE||95}`,`--min-years=${process.env.AURYN_V92_MIN_YEARS||5}`,`--required-families=${required}`,`--max-session-gap-pct=${process.env.AURYN_V92_MAX_SESSION_GAP_PCT||1}`])&&ok;
  fs.rmSync(outputRoot,{recursive:true,force:true});
  const run1=path.join(outputRoot,'run-1'),run2=path.join(outputRoot,'run-2');
  ok=runNpm('research:v93',[`--base=${base}`,`--manifest=${manifest}`,`--output-dir=${run1}`])&&ok;
  ok=runNpm('research:v93',[`--base=${base}`,`--manifest=${manifest}`,`--output-dir=${run2}`])&&ok;
  ok=runNpm('audit:v93-report',[`--report=${path.join(run1,'auryn-v93-tournament-report.json')}`,`--run-manifest=${path.join(run1,'auryn-v93-run-manifest.json')}`,`--second-run-manifest=${path.join(run2,'auryn-v93-run-manifest.json')}`])&&ok;
}else{
  gates.push({name:'V9.3 real-data tournament',status:requireData?'BLOCKED':'NOT_PROVIDED',exitCode:requireData?2:0});
  if(requireData)ok=false;
}
console.log('\nAURYN V9.3 RELEASE GATE');
for(const g of gates)console.log(`${g.name.padEnd(28)} ${g.status}`);
const releaseState=ok&&haveData?'PASS':ok?'CODE_READY_DATA_BLOCKED':'BLOCKED';
console.log(`RELEASE STATUS: ${releaseState}`);
if(!haveData)console.log('DATA STATUS: NOT_PROVIDED — set AURYN_V92_REPLAY_BUNDLE, AURYN_V93_BASE_OBSERVATIONS and AURYN_V93_OBSERVATION_MANIFEST; then run npm run gate:v93 -- --require-data.');
if(!ok)process.exitCode=1;
