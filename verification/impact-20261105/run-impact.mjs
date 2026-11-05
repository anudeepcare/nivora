import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{cwd:process.cwd(),env:{...process.env,AURYN_ENABLE_PREVIEW:'true'},stdio:['ignore','ignore','pipe']});
server.stderr.on('data',x=>process.stderr.write(x));
try{let ready=false;for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:3100');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error('Local preview did not start');await import('./verify-impact.mjs');}finally{server.kill('SIGTERM')}
