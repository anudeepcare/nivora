import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const factory=fs.readFileSync(new URL('../scripts/run_v91_observation_factory.mjs',import.meta.url),'utf8');
const shard=fs.readFileSync(new URL('../scripts/run_v91_materialize_shard.mjs',import.meta.url),'utf8');
const tournament=fs.readFileSync(new URL('../scripts/run_v9_feature_tournament.mjs',import.meta.url),'utf8');

test('V9.1 exposes factory and deterministic shard CLI commands',()=>{
 assert.match(pkg.scripts['observations:v91']||'',/run_v91_observation_factory/);
 assert.match(pkg.scripts['materialize:v91']||'',/run_v91_materialize_shard/);
 assert.match(pkg.scripts['test:v91-core']||'',/auryn-v91/);
 assert.match(factory,/--input|inputPath/);
 assert.match(factory,/jsonl/i);
 assert.match(shard,/candidate-start|candidateStart/);
 assert.match(shard,/candidate-limit|candidateLimit/);
});

test('V9 tournament runner accepts JSONL feature observations as well as JSON arrays',()=>{
 assert.match(tournament,/jsonl|split\(\/\\r\?\\n\//i);
});

test('V9.1 research scripts do not import production CIO or broker mutation paths',()=>{
 for(const [name,src] of [['factory',factory],['shard',shard]]){
  assert.doesNotMatch(src,/(?:from\s+|import\()[\"'][^\"']*(?:production-registry|v5\/cio|nivora-broker|run-paper)/i,`${name} must remain research-only`);
 }
});
