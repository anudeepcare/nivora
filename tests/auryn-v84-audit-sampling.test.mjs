import test from 'node:test';
import assert from 'node:assert/strict';

let sampling;
try { sampling=await import('../.engine-test/auryn/v84/audit-sampling.js'); } catch {}

function synthetic(){
  const rows=[];
  for(const prefix of ['A','B','C','D','E','F','G','H','I','J']){
    for(let i=0;i<20;i++)rows.push({symbol:`${prefix}${String(i).padStart(2,'0')}`,market_cap_m:100000-(rows.length*100)});
  }
  return rows;
}

test('500-style audit sampling is deterministic and broadly distributed instead of alphabetically concentrated',()=>{
  assert.ok(sampling,'V8.4 audit sampling module must exist');
  const a=sampling.selectDiversifiedAuditUniverse(synthetic(),50);
  const b=sampling.selectDiversifiedAuditUniverse(synthetic(),50);
  assert.deepEqual(a,b);
  assert.equal(a.length,50);
  assert.equal(new Set(a).size,50);
  const prefixes=new Set(a.map(x=>x[0]));
  assert.ok(prefixes.size>=8,`expected broad prefix coverage, got ${[...prefixes].join(',')}`);
});

import fs from 'node:fs';
test('audit universe endpoint uses diversified selector and paginates fallback universe instead of taking an alphabetical prefix',()=>{
  const src=fs.readFileSync('app/api/audit/universe/route.ts','utf8');
  assert.match(src,/selectDiversifiedAuditUniverse/);
  assert.match(src,/\.range\(/);
  assert.doesNotMatch(src,/\.order\(["']symbol["'],\{ascending:true\}\)\s*\.limit\(rawLimit\)/);
});
