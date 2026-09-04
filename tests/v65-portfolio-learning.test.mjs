import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("portfolio learning job samples real portfolio equities and freezes decisions",()=>{
 const s=fs.readFileSync("app/api/portfolio/learn/route.ts","utf8");
 assert.match(s,/portfolio_positions/);assert.match(s,/asset_type/);assert.match(s,/buildInvestorDecision/);assert.match(s,/freezeDecision/);assert.match(s,/nivora_v59_decision_snapshots/);assert.match(s,/TRADING_LAB_CRON_SECRET|CRON_SECRET/);
});
test("portfolio learning is scheduled and does not mutate weights",()=>{
 const s=fs.readFileSync(".github/workflows/nivora-portfolio-learning.yml","utf8");
 assert.match(s,/schedule:/);assert.match(s,/api\/portfolio\/learn/);
 const r=fs.readFileSync("app/api/portfolio/learn/route.ts","utf8");
 assert.doesNotMatch(r,/weights[^\n]{0,80}update|update[^\n]{0,80}weights/i);
});
