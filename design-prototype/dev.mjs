import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const args=process.argv.slice(2).filter(x=>x!=='--strictPort').map(x=>x==='--host'?'--hostname':x);
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev',...args],{stdio:'inherit',env:process.env});
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>child.kill(s));
child.on('exit',c=>process.exit(c??1));
