
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("Trading Lab status includes live real-market decision distribution",()=>{
 const s=fs.readFileSync(new URL("../app/api/trading-lab/status/route.ts",import.meta.url),"utf8");
 assert.match(s,/decisionAudit/);assert.match(s,/dominantBlockers/);assert.match(s,/closestToBuy/);
});
test("Trading Lab visibly shows BUY count and dominant real-market blocker",()=>{
 const s=fs.readFileSync(new URL("../app/trading-lab/page.tsx",import.meta.url),"utf8");
 assert.match(s,/REAL-MARKET DECISION AUDIT/);assert.match(s,/BUY SIGNALS/);assert.match(s,/DOMINANT BLOCKER/);assert.match(s,/CLOSEST TO BUY/);
});
