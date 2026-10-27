import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDecision,
  annualizedReturn,
  aurynDecision,
  cashFlowValuation,
} from "../lib/auryn-decision.ts";
import { demoData } from "./fixtures/demo.ts";

const good = {
  ownsPosition: false,
  priceUsable: true,
  financialsUsable: true,
  business: "strong",
  value: "attractive",
  extended: false,
  distress: false,
  deterioration: false,
  insolvency: false,
};
test("a supported entry is Buy, or Add only when already owned", () => {
  assert.equal(evaluateDecision(good), "Buy");
  assert.equal(evaluateDecision({ ...good, ownsPosition: true }), "Add");
});
test("owning a stock with missing critical evidence does not manufacture Hold", () => {
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: true, financialsUsable: false }),
    "Wait",
  );
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: true, value: "unassessed" }),
    "Wait",
  );
});
test("Hold requires supported operations and a price assessment", () => {
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: true, value: "fair" }),
    "Hold",
  );
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: false, value: "fair" }),
    "Wait",
  );
});
test("material deterioration changes action without averaging away financing risk", () => {
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: true, distress: true }),
    "Reduce",
  );
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: false, distress: true }),
    "Avoid",
  );
  assert.equal(
    evaluateDecision({ ...good, ownsPosition: true, insolvency: true }),
    "Sell",
  );
});
test("equal total returns have different annualized returns at different horizons", () => {
  assert.ok(Math.abs(annualizedReturn(120, 100, 1) - 20) < 1e-10);
  assert.ok(Math.abs(annualizedReturn(120, 100, 3) - 6.265856918) < 1e-7);
  assert.equal(annualizedReturn(120, 0, 3), null);
  assert.equal(annualizedReturn(120, 100, 0), null);
});
test("cash flow valuation has no dependence on current price or analyst coverage", () => {
  const x = { cashPerShare: 5, growth: 5, dilution: 1 };
  const v = cashFlowValuation(x);
  assert.ok(v && v.bear < v.base && v.base < v.bull);
  assert.equal(cashFlowValuation({ ...x, cashPerShare: -5 }), null);
});
test("annual dilution is charged through all forecast years and terminal cash flow", () => {
  const v = cashFlowValuation({ cashPerShare: 5, growth: 10, dilution: 10 });
  assert.ok(
    v.base > 31 && v.base < 31.1,
    `ongoing dilution base value ${v.base}`,
  );
});
test("infrastructure and frontier businesses never inherit generic cash-flow valuation", () => {
  for (const symbol of ["IREN", "ASTS"]) {
    const r = structuredClone(demoData.research.MSFT);
    r.company.symbol = symbol;
    r.evidence = undefined;
    r.history = [];
    r.quote = { ...r.quote, price: 50, asOf: r.retrievedAt, stale: false };
    const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
    assert.equal(d.valuation, null);
    assert.notEqual(d.action, "Buy");
    assert.ok(d.reasons.length);
  }
});
test("share-count age advances with the current price observation", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = [];
  r.quote = {
    ...r.quote,
    price: 50,
    asOf: "2027-05-01T16:00:00Z",
    stale: false,
    session: "Last available quote",
  };
  const d = aurynDecision(r, { now: Date.parse("2027-05-01T16:01:00Z") });
  assert.equal(d.valuation, null);
  assert.notEqual(d.action, "Buy");
});
test("an expired price cannot stay actionable when a PWA reopens", () => {
  const r = structuredClone(demoData.research.MSFT);
  const d = aurynDecision(r, {
    now: Date.parse("2026-11-30T18:00:00Z"),
    ownsPosition: true,
  });
  assert.equal(d.action, "Wait");
  assert.equal(d.status, "paused");
  assert.match(d.headline, /price/i);
  assert.ok(d.reasons.length > 0);
});
test("missing optional analyst estimates preserves financial and Pace evidence", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  assert.ok(d.reasons.some((x) => /cash|revenue|margin/i.test(x)));
  assert.ok(d.valuation && d.valuation.basis === "cash-flow");
  assert.notEqual(d.business, "missing");
});
test("price-only instruments keep price research without fabricated corporate verdicts", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.company.assetType = "crypto";
  r.company.symbol = "BTC/USD";
  r.facts = [];
  r.evidence = undefined;
  const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  assert.equal(d.action, "Wait");
  assert.equal(d.valuation, null);
  assert.ok(d.reference);
  assert.match(d.headline, /price/i);
});
test("conflicting financial observations pause the decision while preserving other facts", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = [];
  r.quote = {
    ...r.quote,
    price: 50,
    asOf: r.retrievedAt,
    stale: false,
    session: "Regular session",
  };
  const source = r.facts
    .filter((f) => f.metric === "operatingCashFlow" && f.scope === "annual")
    .at(-1);
  r.facts.push({ ...source, id: "zzz-conflict", value: -source.value });
  const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  assert.equal(d.action, "Wait");
  assert.equal(d.status, "paused");
  assert.match(d.headline, /conflict|disagree/i);
  assert.ok(d.reasons.some((x) => /Revenue/.test(x)));
});
test("lower prices preserve a supported earnings entry when business inputs do not change", () => {
  const r = structuredClone(demoData.research.MSFT);
  // Two annual periods support the business screen, but not the three-year cash-flow model.
  r.facts = r.facts.filter(
    (f) => f.scope !== "annual" || f.end >= "2025-01-01",
  );
  r.history = [];
  r.quote = {
    ...r.quote,
    asOf: r.retrievedAt,
    stale: false,
    session: "Last available quote",
  };
  r.evidence = {
    updatedAt: "2026-10-16",
    reportingCurrency: "USD",
    profile: { sector: "Technology", industry: "Software" },
    multiples: { ForwardPE: 20 },
    estimates: [
      {
        date: "2029-06-30",
        period: "FY2029",
        frequency: "annual",
        currency: "USD",
        eps: 12,
        epsLow: 10,
        epsHigh: 14,
        analysts: 15,
      },
    ],
  };
  for (const price of [160, 150, 100]) {
    const d = aurynDecision(
      { ...r, quote: { ...r.quote, price } },
      { now: Date.parse(r.retrievedAt) },
    );
    assert.equal(d.valuation.basis, "earnings");
    assert.equal(d.action, "Buy", `price ${price}`);
  }
});
