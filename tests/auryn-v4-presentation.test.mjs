import test from "node:test";
import assert from "node:assert/strict";

const mod=()=>import("../.engine-test/auryn/v4/presentation.js");

test("V4 actions render as clear human decisions",async()=>{
  const {formatInvestmentAction}=await mod();
  assert.equal(formatInvestmentAction("STRONG_BUY"),"STRONG BUY");
  assert.equal(formatInvestmentAction("BUY"),"BUY");
  assert.equal(formatInvestmentAction("HOLD"),"HOLD");
  assert.equal(formatInvestmentAction("REDUCE"),"REDUCE");
  assert.equal(formatInvestmentAction("SELL"),"SELL");
  assert.equal(formatInvestmentAction("INSUFFICIENT_EVIDENCE"),"INSUFFICIENT EVIDENCE");
});

test("V4 reason codes become decision-first plain English",async()=>{
  const {explainReasonCode}=await mod();
  assert.match(explainReasonCode("LONG_TERM_THESIS_STRONG"),/long-term thesis/i);
  assert.match(explainReasonCode("TECHNICAL_WEAKNESS_LIMITS_TIMING"),/technical/i);
  assert.match(explainReasonCode("VALUATION_CAPS_NEW_RISK"),/valuation/i);
  assert.match(explainReasonCode("THESIS_BROKEN"),/thesis/i);
  assert.match(explainReasonCode("CRITICAL_EVIDENCE_MISSING"),/evidence/i);
});

test("owner guidance stays decisive and consistent with V4 action",async()=>{
  const {ownerGuidance}=await mod();
  assert.equal(ownerGuidance("STRONG_BUY"),"HOLD / ADD");
  assert.equal(ownerGuidance("BUY"),"HOLD / ADD");
  assert.equal(ownerGuidance("HOLD"),"HOLD");
  assert.equal(ownerGuidance("REDUCE"),"REDUCE");
  assert.equal(ownerGuidance("SELL"),"SELL / EXIT");
  assert.equal(ownerGuidance("INSUFFICIENT_EVIDENCE"),"HOLD / VERIFY");
});
