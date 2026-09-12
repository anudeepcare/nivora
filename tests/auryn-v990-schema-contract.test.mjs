import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("supabase/migrations/20260912090000_auryn_v99_validation_lab.sql","utf8");
for(const name of ["auryn_validation_runs","auryn_validation_jobs","auryn_validation_universe","auryn_shadow_snapshots","auryn_shadow_outcomes","auryn_model_registry","auryn_model_health","auryn_provider_rate_buckets"])test(`schema contains ${name}`,()=>assert.match(s,new RegExp(`create table if not exists public\\.${name}`,"i")));
test("schema enforces immutable snapshot identity and atomic rate acquisition",()=>{assert.match(s,/unique\s*\(model_version,\s*symbol,\s*evaluation_date,\s*run_kind\)/i);assert.match(s,/create or replace function public\.auryn_acquire_provider_tokens/i)});
