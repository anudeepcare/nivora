import {spawnSync} from 'node:child_process';
const run=(cmd,args)=>{console.log(`\n[v9.3.4.3] ${cmd} ${args.join(' ')}`);const r=spawnSync(cmd,args,{stdio:'inherit',shell:false,env:process.env});if(r.status!==0)process.exit(r.status??1)};
run('npm',['run','test:v9343']);
run('npm',['run','test:v9342']);
run('npm',['run','test:v9341']);
run('npm',['run','test:v934-core']);
run('npm',['run','test:v931-core']);
run('npm',['run','audit:v931-reliability']);
run('npm',['run','test:v92-core']);
run('npm',['run','test:v93-core']);
run('npm',['run','audit:v8-reality']);
run('npm',['run','audit:v65']);
const requireLive=String(process.env.AURYN_REQUIRE_LIVE||'')==='1';
const base=String(process.env.AURYN_BASE_URL||'').trim();
const liveLimit=String(process.env.AURYN_V934_LIVE_LIMIT||'30');
if(base){run('npm',['run','audit:v934-live','--',`--limit=${liveLimit}`]);console.log('\nAURYN V9.3.4.3 RELEASE GATE: PASS · CODE + REAL-WORLD AUDIT');}
else if(requireLive){console.error('\nAURYN V9.3.4.3 RELEASE GATE: BLOCKED · AURYN_BASE_URL is required for real-world validation.');process.exit(2);}
else console.log('\nAURYN V9.3.4.3 CODE GATE: PASS · CODE_READY_LIVE_VALIDATION_REQUIRED');
