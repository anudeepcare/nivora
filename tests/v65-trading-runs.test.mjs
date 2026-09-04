import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("paper runner records explicit run lifecycle",()=>{
 const s=fs.readFileSync("app/api/trading-lab/run-paper/route.ts","utf8");
 assert.match(s,/nivora_v65_trading_runs/);assert.match(s,/started_at/);assert.match(s,/finished_at/);assert.match(s,/results/);
});
test("status and UI expose recent automatic cycles",()=>{
 const s=fs.readFileSync("app/api/trading-lab/status/route.ts","utf8");const p=fs.readFileSync("app/trading-lab/page.tsx","utf8");
 assert.match(s,/recentRuns/);assert.match(p,/RECENT AUTOMATIC CYCLES/);
});
