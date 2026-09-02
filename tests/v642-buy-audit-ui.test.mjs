
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("investor engine passes real archetype/factor/reality evidence into Today calibration",()=>{
 const s=fs.readFileSync(new URL("../lib/nivora-investor.ts",import.meta.url),"utf8");
 assert.match(s,/archetype:kind/);
 assert.match(s,/stabilizationState:decisionReality\.stabilization\.state/);
 assert.match(s,/marketModelDisagreement:decisionReality\.marketModelDisagreement\.level/);
 assert.match(s,/factors:\{financial:/);
});
test("decision cockpit exposes buy path or exact closest blocker",()=>{
 const s=fs.readFileSync(new URL("../components/InvestorDecisionHero.tsx",import.meta.url),"utf8");
 assert.match(s,/BUY PATH|CLOSEST BUY PATH/);
 assert.match(s,/buyAudit/);
});
test("V64.2 includes a universe-level decision audit script",()=>{
 const s=fs.readFileSync(new URL("../scripts/audit_decision_distribution.mjs",import.meta.url),"utf8");
 assert.match(s,/auditDecisionDistribution/);
 assert.match(s,/dominant blockers/i);
});
