import test from "node:test";import assert from "node:assert/strict";
import {extractShadowDecision,assertShadowDecisionReady} from "../.engine-test/auryn/v991/shadow-mapping.js";
import {isValidationEligibleSymbol,buildStratifiedUniverse} from "../.engine-test/auryn/v991/universe.js";

test("maps the actual canonical research projection",()=>{
 const x=extractShadowDecision({snapshotId:"AAPL-v935-x",research:{state:"READY",action:"START_SMALL",ownerAction:"HOLD",longTermAction:"ATTRACTIVE",decisionScore:72,evidenceCompleteness:83,setupState:"BREAKOUT_WATCH",fingerprint:"fp"}});
 assert.deepEqual(x,{newMoney:"START_SMALL",owner:"HOLD",longTerm:"ATTRACTIVE",decisionScore:72,evidenceCompleteness:83,setupState:"BREAKOUT_WATCH",evidenceFingerprint:"fp"});
});
test("fails closed when canonical CIO decision is absent",()=>{
 assert.throws(()=>assertShadowDecisionReady({snapshotId:"X",research:{state:"ANALYSIS_REQUIRED",action:null}}),/CANONICAL_DECISION_NOT_READY/);
});
test("validation universe excludes derivative-like symbols",()=>{
 for(const s of ["AAC.WT","AAC.UN","BRK/WS","FOO.RT","XYZ^A"])assert.equal(isValidationEligibleSymbol(s),false,s);
 for(const s of ["AAPL","MSFT","BRK.B","GOOGL","IREN"])assert.equal(isValidationEligibleSymbol(s),true,s);
});
test("stratified universe is not alphabetical and preserves category breadth",()=>{
 const rows=[
  {symbol:"AAPL",sector:"Technology"},{symbol:"MSFT",sector:"Technology"},{symbol:"JPM",sector:"Financials"},
  {symbol:"XOM",sector:"Energy"},{symbol:"LLY",sector:"Healthcare"},{symbol:"WMT",sector:"Consumer Staples"},
  {symbol:"NEE",sector:"Utilities"},{symbol:"PLD",sector:"Real Estate"},{symbol:"CAT",sector:"Industrials"},
  {symbol:"AACG",sector:"Other"},{symbol:"AACB",sector:"Other"}
 ];
 const u=buildStratifiedUniverse(rows,9);
 assert.equal(u.length,9);assert.ok(u.includes("JPM"));assert.ok(u.includes("XOM"));assert.ok(u.includes("LLY"));assert.notDeepEqual(u,[...u].sort());
});
