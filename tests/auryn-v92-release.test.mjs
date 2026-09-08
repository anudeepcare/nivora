import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const release=()=>{try{return fs.readFileSync(new URL('../AURYN_V9_2_RELEASE.md',import.meta.url),'utf8')}catch{return ''}};
const read=n=>{try{return fs.readFileSync(new URL(`../scripts/${n}`,import.meta.url),'utf8')}catch{return ''}};

test('V9.2 release documents point-in-time data gate and no automatic production promotion',()=>{
 const s=release();assert.match(s,/Historical Data Backfill/i);assert.match(s,/point-in-time/i);assert.match(s,/survivorship/i);assert.match(s,/no automatic|production weights/i);
});

test('V9.2 master gate reports PASS or BLOCKED and optionally audits a real replay bundle',()=>{
 const s=read('run_v92_release_gate.mjs');assert.match(s,/RELEASE STATUS/);assert.match(s,/AURYN_V92_REPLAY_BUNDLE/);assert.match(s,/BLOCKED/);assert.match(s,/PASS/);
});

test('V9.2 master gate invokes the compiled audit:v92-data command for real datasets',()=>{
 const s=read('run_v92_release_gate.mjs');
 assert.match(s,/audit:v92-data/,'real-data gate must use the package audit command so .engine-test is rebuilt after cleanup audits');
});
