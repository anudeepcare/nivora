import test from "node:test";
import assert from "node:assert/strict";
import {
  aurynDecision,
  assessDecision,
  evaluateDecision,
} from "../lib/auryn-decision.ts";
import { demoData } from "./fixtures/demo.ts";

function company(price = 50) {
  const r = structuredClone(demoData.research.MSFT);
  r.history = [];
  r.evidence = undefined;
  r.quote = { ...r.quote, price, asOf: r.retrievedAt, stale: false };
  return r;
}
const assess = (r, ownsPosition = false) =>
  aurynDecision(r, { now: Date.parse(r.retrievedAt), ownsPosition });
test("the entry threshold includes the bear limit and qualifies at its exact boundary", () => {
  const initial = assess(company());
  assert.equal(
    initial.valuation.entryPrice,
    Math.min(initial.valuation.base * 0.8, initial.valuation.bear / 0.65),
  );
  assert.equal(assess(company(initial.valuation.entryPrice)).action, "Buy");
  assert.equal(
    assess(company(initial.valuation.entryPrice + 0.01)).action,
    "Review",
  );
});
test("every decision reason follows the same gate as its action", () => {
  const good = {
    ownsPosition: false,
    financialsUsable: true,
    priceUsable: true,
    business: "strong",
    value: "attractive",
    extended: false,
    distress: false,
    deterioration: false,
    insolvency: false,
  };
  const cases = [
    [{}, "entry", "Buy", "Add"],
    [{ financialsUsable: false }, "financials", "Review", "Review"],
    [{ priceUsable: false }, "price", "Review", "Review"],
    [{ value: "unassessed" }, "history", "Review", "Review"],
    [{ value: "expensive" }, "history", "Review", "Review"],
    [{ business: "weak" }, "business", "Review", "Review"],
    [{ confirmedPace: 0 }, "pace", "Wait", "Hold"],
    [{ extended: true }, "history", "Review", "Review"],
    [{ distress: true }, "funding", "Avoid", "Reduce"],
    [{ deterioration: true }, "deterioration", "Avoid", "Reduce"],
    [{ insolvency: true }, "insolvency", "Avoid", "Sell"],
  ];
  for (const [patch, code, entry, holding] of cases) {
    for (const ownsPosition of [false, true]) {
      const input = { ...good, ...patch, ownsPosition };
      assert.deepEqual(assessDecision(input), {
        code,
        action: ownsPosition ? holding : entry,
      });
      assert.equal(evaluateDecision(input), assessDecision(input).action);
    }
  }
});
function marketAnchoredEstimates(r) {
  r.evidence = {
    updatedAt: "2026-10-16",
    reportingCurrency: "USD",
    profile: { sector: "Technology", industry: "Software" },
    multiples: { ForwardPE: r.quote.price / 10 },
    estimates: [
      {
        date: "2027-09-30",
        period: "FY2027",
        frequency: "annual",
        currency: "USD",
        eps: 10,
        epsLow: 9,
        epsHigh: 11,
        analysts: 15,
      },
    ],
  };
}
test("market-anchored EPS coverage cannot replace an eligible independent cash-flow model", () => {
  for (const price of [50, 80, 150, 500]) {
    const r = company(price),
      independent = assess(r);
    marketAnchoredEstimates(r);
    const covered = assess(r);
    assert.equal(covered.valuation.basis, "cash-flow");
    assert.equal(covered.valuation.base, independent.valuation.base);
    assert.equal(covered.action, independent.action);
  }
});
test("conflicting outstanding shares preserve the EPS fallback without an order-dependent Buy", () => {
  const r = company(150);
  marketAnchoredEstimates(r);
  const share = r.facts
    .filter((f) => f.metric === "shares" && f.scope === "instant")
    .sort((a, b) => b.end.localeCompare(a.end))[0];
  const conflict = {
    ...share,
    id: "conflicting-outstanding-shares",
    value: share.value / 10,
  };
  for (const facts of [
    [conflict, ...r.facts],
    [...r.facts, conflict],
  ]) {
    const d = assess({ ...r, facts });
    assert.equal(d.valuation.basis, "earnings");
    assert.equal(d.valuation.base, 150);
    assert.equal(d.action, "Review");
    const noEps = assess({ ...r, facts, evidence: undefined });
    assert.equal(noEps.valuation, null);
    assert.equal(noEps.action, "Review");
  }
});
test("without confirmed Pace the independent valuation screen can support entry or require Review", () => {
  const low = assess(company(50)),
    high = assess(company(500));
  assert.deepEqual(low.actions, { entry: "Buy", holding: "Add" });
  assert.deepEqual(high.actions, { entry: "Review", holding: "Review" });
  assert.equal(low.explanation.code, "entry");
  assert.equal(high.explanation.code, "history");
  assert.match(high.explanation.detail, /confirmed Pace.*not available/);
  assert.equal(low.valuation.base, high.valuation.base);
});
test("an unassessed value is explicitly different from a failed price condition", () => {
  const r = company();
  r.company.symbol = "IREN";
  const d = assess(r);
  assert.equal(d.action, "Review");
  assert.equal(d.explanation.code, "history");
  assert.match(d.explanation.label, /incomplete/i);
  assert.doesNotMatch(d.explanation.detail, /expensive|overvalued/i);
});
test("stale prices and conflicting reports explain the correct pause", () => {
  const stale = company();
  stale.quote.asOf = "2020-01-01";
  assert.equal(assess(stale).explanation.code, "price");
  const conflict = company();
  const f = conflict.facts
    .filter((f) => f.metric === "operatingCashFlow" && f.scope === "annual")
    .at(-1);
  conflict.facts.push({ ...f, id: "conflicting-cash", value: -f.value });
  const d = assess(conflict);
  assert.equal(d.explanation.code, "financials");
  assert.match(d.explanation.detail, /conflict|disagree/i);
});
