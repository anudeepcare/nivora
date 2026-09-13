import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("queue pump permits ten sequential workers with six second spacing",()=>{const s=fs.readFileSync("scripts/auryn-v996-queue-pump.mjs","utf8");assert.match(s,/Math\.min\(10,/);assert.match(s,/6000/);});
test("GitHub queue runs every ten minutes with burst ten",()=>{const s=fs.readFileSync(".github/workflows/auryn-v996-validation-queue.yml","utf8");assert.match(s,/\*\/10 \* \* \* \*/);assert.match(s,/AURYN_QUEUE_BURST: "10"/);});
test("Vercel remains cron free",()=>assert.deepEqual(JSON.parse(fs.readFileSync("vercel.json","utf8")),{}));
