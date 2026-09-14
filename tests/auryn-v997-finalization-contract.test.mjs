import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("watchdog never finalizes validation runs",()=>{const s=fs.readFileSync("app/api/validation/watchdog/route.ts","utf8");assert.doesNotMatch(s,/auryn_validation_runs"\)\.update/);});
test("strict finalizer can inspect multiple RUNNING runs",()=>{const s=fs.readFileSync("app/api/validation/finalize/route.ts","utf8");assert.match(s,/limit\(20\)/);assert.match(s,/for\(const run of runs\|\|\[\]\)/);});
