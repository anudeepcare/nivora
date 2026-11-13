import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {researchAccumulation as current} from '../lib/accumulation-policy-v7.ts';
const bars=JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-bars.json'))[0].bars.sort((a,b)=>a.time.localeCompare(b.time));
const extended=[...bars,{...bars.at(-1),time:'2026-11-11'}];
for(const name of ['Accumulation','AccumulationDesk']) test(`${name} uses the same current monthly policy as Research`,async()=>{
 const source=fs.readFileSync(`components/${name}.tsx`,'utf8');
 const policy=source.match(/from "@\/lib\/(accumulation-policy-v\d+)"/)[1];
 const {researchAccumulation}=await import(`../lib/${policy}.ts`);
 assert.deepEqual(researchAccumulation(extended,'2026-11-12T04:00:00Z'),current(extended,'2026-11-12T04:00:00Z'));
});
