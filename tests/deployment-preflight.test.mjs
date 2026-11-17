import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const script = new URL('../scripts/deployment-preflight.mjs', import.meta.url);
const run = (env={}) => spawnSync(process.execPath,[script.pathname],{env,encoding:'utf8'});
test('preflight fails with named missing configuration, without network or secret output',()=>{
 const r=run(); assert.equal(r.status,1); assert.match(r.stdout,/SENTISENSE_API_KEY/); assert.match(r.stdout,/AURYN_OWNER_USER_ID/);
});
test('configured presence is not live acceptance and secrets are never printed',()=>{
 const r=run({NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'secret-service',AURYN_OWNER_USER_ID:'owner-id',EODHD_API_KEY:'secret-market',SENTISENSE_API_TOKEN:'secret-research'});
 assert.equal(r.status,0); assert.match(r.stdout,/not verified/); assert.doesNotMatch(r.stdout,/secret-service|secret-market|secret-research/);
});
test('public credential exposure is rejected without revealing its value',()=>{
 const r=run({NEXT_PUBLIC_SENTISENSE_API_KEY:'never-output-this'}); assert.equal(r.status,1); assert.match(r.stdout,/NEXT_PUBLIC_SENTISENSE_API_KEY/); assert.doesNotMatch(r.stdout,/never-output-this/);
});
