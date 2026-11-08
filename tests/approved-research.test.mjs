import test from "node:test";
import assert from "node:assert/strict";
import { approvedResearch, balanceView } from "../lib/approved-research.ts";
import { demoData } from "./fixtures/demo.ts";
import { researchEdge } from "../lib/edge-research.ts";
test("approved presentation preserves the evidence policy and confirmed Pace", () => {
  const r = demoData.research.MSFT,
    m = approvedResearch(r);
  assert.equal(m.edge.pace, researchEdge(r).pace);
  assert.ok(m.factors.length);
  assert.ok(m.metrics.every((x) => Number.isFinite(x.value)));
  assert.equal(new Set(m.factors.map((x) => x.id)).size, m.factors.length);
});
test("adjusting the scale cannot manufacture a buy verdict or alter Pace", () => {
  const m = approvedResearch(demoData.research.MSFT);
  const before = JSON.stringify(m);
  const b = balanceView(
    m.factors,
    m.factors.map((x) => x.id),
  );
  assert.deepEqual(b, { buy: 0, wait: 0, buyCount: 0, waitCount: 0, angle: 0 });
  assert.equal(JSON.stringify(m), before);
  const only = m.factors.filter((x) => x.side === "wait").map((x) => x.id);
  assert.ok(balanceView(m.factors, only).angle <= 0);
});
test("reason counts are distinct from importance totals and follow excluded factors", () => {
  const factors = [
    { id: "cash", side: "buy", weight: 3 },
    { id: "growth", side: "buy", weight: 2 },
    { id: "margin", side: "buy", weight: 2 },
    { id: "value", side: "buy", weight: 3 },
    { id: "risk", side: "wait", weight: 2 },
  ];
  assert.equal(balanceView(factors).buyCount, 4);
  assert.equal(balanceView(factors).waitCount, 1);
  assert.equal(balanceView(factors).buy, 10);
  assert.equal(balanceView(factors, ["cash", "risk"]).buyCount, 3);
  assert.equal(balanceView(factors, ["cash", "risk"]).waitCount, 0);
});
test("partial and crypto evidence retain actual prices without invented business metrics", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.facts = [];
  r.evidence = undefined;
  r.history = [];
  r.company.assetType = "crypto";
  const m = approvedResearch(r);
  assert.equal(m.edge.pace, null);
  assert.equal(m.metrics.length, 0);
  assert.ok(!m.factors.some((x) => /cash flow|revenue|margin/i.test(x.text)));
  assert.ok(m.cases.every((x) => Number.isFinite(x.target)));
});
test("scenario values use the decision engine reference and matching currency", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.quote.price = null;
  const model = approvedResearch(r);
  assert.equal(model.scenarioReference, model.decision.reference?.price ?? null);
  r.quote.price = 100;
  r.quote.currency = "EUR";
  r.company.currency = "USD";
  assert.equal(approvedResearch(r).cases.length, 0);
});
test("historical price percentiles never substitute for valuation scenarios", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.facts = []; r.evidence = undefined;
  const m = approvedResearch(r);
  assert.equal(m.scenarioKind, null);
  assert.equal(m.cases.length, 0);
  assert.equal(m.scenarioHorizon, null);
});
test("overview cases exactly match the selected decision valuation", () => {
  const r = structuredClone(demoData.research.MSFT);
  const m = approvedResearch(r);
  assert.ok(m.decision.valuation);
  const v=m.decision.valuation;
  assert.deepEqual(m.cases.map(c=>c.target),[v.bear,v.base,v.bull]);
  assert.equal(m.scenarioKind,v.basis);
  assert.equal(m.scenarioEnd,v.end);
});

test("quote-only moves change the gap, not the selected cash-flow values",()=>{
 const r=structuredClone(demoData.research.MSFT);
 r.history=[];
 r.quote={...r.quote,asOf:r.retrievedAt,stale:false,session:'Last available quote'};
 const values=[100,110].map(price=>approvedResearch({...r,quote:{...r.quote,price}}));
 assert.equal(values[0].scenarioKind,'cash-flow');
 assert.deepEqual(values[0].cases.map(c=>c.target),values[1].cases.map(c=>c.target));
 assert.notEqual(values[0].cases[1].change,values[1].cases[1].change);
});
