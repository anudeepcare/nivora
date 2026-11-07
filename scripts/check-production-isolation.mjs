import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]);}
let traces=0;
for(const file of files('.next/server/app').filter(x=>x.endsWith('.nft.json'))){
 traces++;
 const bundled=JSON.parse(fs.readFileSync(file,'utf8')).files;
 assert.deepEqual(bundled.filter(x=>/tests\/fixtures\/|components\/v2\/DesignPreview\.tsx/.test(x)),[],file+' ships development-only source');
}
assert.ok(traces>0,'Build before checking production isolation');
console.log(`Production file traces checked: ${traces}; development fixture source excluded.`);
