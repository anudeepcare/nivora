import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8"),c=fs.readFileSync("app/auryn-premium.css","utf8"),n=fs.readFileSync("lib/auryn/v99925/investment-narrative.ts","utf8");
test("one visible decision hero only",()=>{assert.equal((v.match(/AURYN CIO/g)||[]).length,0);assert.ok(!v.includes('className="v99929Cio"'));assert.ok(v.includes("v99932CallDecision"));});
test("AURYN Call contains canonical actions sizing and decision controls",()=>{for(const x of ["NEW MONEY","OWNER","LONG TERM","POSITION SIZE","Why this decision","What changes it","SETUP INVALIDATION"])assert.ok(v.includes(x),x);});
test("valuation is compact adaptive snapshot",()=>{for(const x of ["VALUATION SNAPSHOT","AVAILABLE NOW","STILL NEEDED","v99932ValuationSnapshot"])assert.ok(v.includes(x),x);assert.ok(c.includes(".v99932ValuationSnapshot"));});
test("long term semantics distinguish horizons",()=>{for(const x of ["WEEKLY PRICE STRUCTURE","ACTIVE WEEKLY SUPPORT","DEEP CYCLE SUPPORT","LONG-TERM STRUCTURAL FAILURE","HOLD ABOVE","FUTURE RECLAIM"])assert.ok(v.includes(x),x);assert.ok(v.includes("regimeTruth.extensionsAllowed"));});
test("volume participation is not called accumulation",()=>{assert.ok(v.includes("Volume participation"));assert.ok(v.includes("Accumulation / Distribution"));});
test("what matters now prioritizes active entry over deep cycle",()=>{assert.ok(n.includes("activeEntry"));assert.ok(n.includes("deepCycleSupport"));});
test("valuation/execution row is compact",()=>{assert.match(c,/v99932CoreDecisionRow/);assert.match(c,/min-height:0/);});
