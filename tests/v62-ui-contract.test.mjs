
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("stock cockpit exposes next-action, valuation sanity, ranked risks and calibration evidence",()=>{
 const s=fs.readFileSync(new URL("../components/InvestorDecisionHero.tsx",import.meta.url),"utf8");
 assert.match(s,/WHAT CHANGES THE ACTION/);
 assert.match(s,/VALUATION SANITY/);
 assert.match(s,/RANKED RISKS/);
 assert.match(s,/CALIBRATION EVIDENCE/);
});
