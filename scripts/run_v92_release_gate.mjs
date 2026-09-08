import {spawnSync} from 'node:child_process';
const requireData=process.argv.includes('--require-data');
const realBundle=process.env.AURYN_V92_REPLAY_BUNDLE||'';
const gates=[];const npmBin=process.platform==='win32'?'npm.cmd':'npm';
function runNpm(name,args=[],env={}){const r=spawnSync(npmBin,['run',name,...(args.length?['--',...args]:[])],{stdio:'inherit',env:{...process.env,...env}});const pass=r.status===0;gates.push({name,status:pass?'PASS':'BLOCKED',exitCode:r.status});return pass;}
let ok=true;ok=runNpm('test:v92-core')&&ok;ok=runNpm('test')&&ok;ok=runNpm('audit:v8-reality')&&ok;ok=runNpm('audit:v65')&&ok;
if(realBundle){
 const required=process.env.AURYN_V92_REQUIRED_FAMILIES||'FUNDAMENTALS,EARNINGS,REVISION,SECTOR,MACRO,CORPORATE_ACTIONS';
 const args=[`--input=${realBundle}`,'--require-decision-grade',`--min-symbol-coverage=${process.env.AURYN_V92_MIN_SYMBOL_COVERAGE||95}`,`--min-years=${process.env.AURYN_V92_MIN_YEARS||5}`,`--required-families=${required}`,`--max-session-gap-pct=${process.env.AURYN_V92_MAX_SESSION_GAP_PCT||1}`];
 ok=runNpm('audit:v92-data',args)&&ok;
}else{gates.push({name:'audit:v92-data',status:requireData?'BLOCKED':'NOT_PROVIDED',exitCode:requireData?2:0});if(requireData)ok=false;}
console.log('\nAURYN V9.2 RELEASE GATE');for(const g of gates)console.log(`${g.name.padEnd(24)} ${g.status}`);console.log(`RELEASE STATUS: ${ok?'PASS':'BLOCKED'}`);if(!realBundle)console.log('RESEARCH DATA STATUS: NOT_PROVIDED — set AURYN_V92_REPLAY_BUNDLE and use --require-data before V9.3.');if(!ok)process.exitCode=1;
