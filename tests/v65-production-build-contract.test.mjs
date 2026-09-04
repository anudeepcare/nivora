
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("calibration maturity route gives Twelve Data bars an explicit type",()=>{
 const s=fs.readFileSync("app/api/calibration/mature/route.ts","utf8");
 assert.match(s,/type DailyBar=/);
 assert.match(s,/async function series\([^)]*\):Promise<DailyBar\[\]>/);
 assert.match(s,/const path=stock\.filter\(\(x:DailyBar\)=>/);
});

test("investment hero does not present BULLISH and generic WAIT as the primary decision pair",()=>{
 const s=fs.readFileSync("components/InvestorDecisionHero.tsx","utf8");
 assert.match(s,/PRIMARY DECISION/);
 assert.match(s,/LONG-TERM/);
 assert.match(s,/TODAY/);
 assert.doesNotMatch(s,/DECISION NOW · NEW MONEY/);
});
