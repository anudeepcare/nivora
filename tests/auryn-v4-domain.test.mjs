import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const domainPath=new URL("../lib/auryn/v4/domain.ts",import.meta.url);

test("V4 primary actions are decisive and contain no WAIT state",()=>{
  const s=fs.readFileSync(domainPath,"utf8");
  assert.match(s,/"STRONG_BUY"/);
  assert.match(s,/"BUY"/);
  assert.match(s,/"HOLD"/);
  assert.match(s,/"REDUCE"/);
  assert.match(s,/"SELL"/);
  assert.match(s,/"INSUFFICIENT_EVIDENCE"/);
  assert.doesNotMatch(s,/WAIT_FOR_CONFIRMATION/);
});

test("V4 confidence is not named or typed as profit probability",()=>{
  const s=fs.readFileSync(domainPath,"utf8");
  assert.match(s,/interface DecisionConfidence/);
  assert.doesNotMatch(s,/profitProbability|winProbability/);
});
