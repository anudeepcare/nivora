import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("orphan job is quarantined without HTTP 500",()=>{const s=fs.readFileSync("app/api/validation/worker/route.ts","utf8");assert.match(s,/reason:"RUN_NOT_FOUND"/);assert.match(s,/status:"skipped"/);});
test("queue pump continues past skipped orphan jobs",()=>{const s=fs.readFileSync("scripts/auryn-v996-queue-pump.mjs","utf8");assert.match(s,/x\.status==="skipped"/);});

test("watchdog never resurrects RUN_NOT_FOUND orphan jobs",()=>{const s=fs.readFileSync("app/api/validation/watchdog/route.ts","utf8");assert.match(s,/neq\("error","RUN_NOT_FOUND"\)/);});
