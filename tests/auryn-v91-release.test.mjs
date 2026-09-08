import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.existsSync(new URL(p,import.meta.url))?fs.readFileSync(new URL(p,import.meta.url),'utf8'):'';
const release=read('../AURYN_V9_1_RELEASE.md');
const contract=read('../docs/V9_1_HISTORICAL_REPLAY_CONTRACT.md');
const readme=read('../README.md');
const pkg=JSON.parse(read('../package.json'));

test('V9.1 release documentation states the point-in-time and production-safety contract',()=>{
 assert.match(release,/V9\.1/i);
 assert.match(release,/point-in-time/i);
 assert.match(release,/survivorship/i);
 assert.match(release,/corporate action|adjusted/i);
 assert.match(release,/does not|no production|production.*unchanged/i);
 assert.match(contract,/availableAt/);
 assert.match(contract,/delist/i);
 assert.match(contract,/JSONL/i);
 assert.match(contract,/46,464|46464/);
});

test('V9.1 README documents the base-observation -> shard -> tournament workflow',()=>{
 assert.match(readme,/observations:v91/);
 assert.match(readme,/materialize:v91/);
 assert.match(readme,/research:v9/);
 assert.match(readme,/base observation/i);
 assert.match(readme,/candidate shard/i);
});

test('V9.1 full engine test command includes V9.1 gates',()=>{
 assert.match(pkg.scripts['test:engine'],/auryn-v91-quality/);
 assert.match(pkg.scripts['test:engine'],/auryn-v91-factory/);
 assert.match(pkg.scripts['test:engine'],/auryn-v91-materialize/);
 assert.match(pkg.scripts['test:engine'],/auryn-v91-release/);
});
