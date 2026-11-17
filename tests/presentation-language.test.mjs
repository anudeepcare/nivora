import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
test('customer copy does not expose retired contribution terminology',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):/\.tsx?$/.test(x.name)?[path.join(dir,x.name)]:[]);
 for(const file of [...walk('components'),...walk('app'),'lib/access-policy.ts','lib/legal-content.ts','lib/owner-handbook-content.ts']) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\bDCA\b|DCAOptimizer|DCA Optimizer/,file);
});
