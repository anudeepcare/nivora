import {spawnSync} from 'node:child_process';
const run=(cmd,args)=>{console.log(`\n[v9.3.5] ${cmd} ${args.join(' ')}`);const r=spawnSync(cmd,args,{stdio:'inherit',shell:false,env:process.env});if(r.status!==0)process.exit(r.status??1)};
run('npm',['run','test:v935']);run('npm',['run','test:v9343']);run('npm',['run','test:v9342']);run('npm',['run','test:v9341']);run('npm',['run','test:v934-core']);run('npm',['run','test:v931-core']);run('npm',['run','audit:v931-reliability']);
const base=String(process.env.AURYN_BASE_URL||'').trim();if(base){run('npm',['run','audit:v935-live','--','--limit=30']);console.log('\nAURYN V9.3.5 RELEASE GATE: PASS · CODE + LIVE CANONICAL AUDIT')}else console.log('\nAURYN V9.3.5 CODE GATE: PASS · CODE_READY_LIVE_VALIDATION_REQUIRED');
