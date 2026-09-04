
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("V64 investor cockpit is mobile-first and removes unavailable zero-score UX",()=>{
 const s=fs.readFileSync(new URL("../components/InvestorDecisionHero.tsx",import.meta.url),"utf8");
 assert.match(s,/DECISION NOW/);
 assert.match(s,/CONFIRMATION/);
 assert.match(s,/INVALIDATION/);
 assert.match(s,/MODEL EVIDENCE/);
 assert.doesNotMatch(s,/UNAVAILABLE\s*·\s*0\/100/);
});
test("V64 calibration page does not show repeated empty zero metrics as evidence",()=>{
 const s=fs.readFileSync(new URL("../app/calibration/page.tsx",import.meta.url),"utf8");
 assert.match(s,/No measured result yet|Collecting evidence/);
});
test("V64 CSS contains one-column mobile cockpit breakpoint",()=>{
 const s=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");
 assert.match(s,/v65DecisionGrid/);assert.match(s,/@media\(max-width:600px\)/);
});
