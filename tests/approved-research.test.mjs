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
test("scenario values use matching quote currency and positive current prices", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.quote.price = null;
  assert.equal(approvedResearch(r).cases.length, 0);
  r.quote.price = 100;
  r.quote.currency = "EUR";
  r.company.currency = "USD";
  assert.equal(approvedResearch(r).cases.length, 0);
});
test("historical scenarios preserve their exact horizon and settled-close reference", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.facts = [];
  r.evidence = undefined;
  r.quote.asOf = "2020-01-01T00:00:00Z";
  r.quote.price = 100;
  const m = approvedResearch(r);
  assert.equal(m.scenarioHorizon, 63);
  assert.equal(m.scenarioReferenceBasis, "settled-close");
  assert.equal(m.scenarioReference, m.edge.brief.priceRisk.reference);
  assert.equal(
    m.cases[0].change,
    (m.cases[0].target / m.scenarioReference - 1) * 100,
  );
});
