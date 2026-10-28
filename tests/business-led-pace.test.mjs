import test from "node:test";
import assert from "node:assert/strict";
import { assessDecision, aurynDecision } from "../lib/auryn-decision.ts";
import { demoData } from "./fixtures/demo.ts";
import { pacePresentation } from "../lib/pace-presentation.ts";

const supported = {
  ownsPosition: false,
  financialsUsable: true,
  priceUsable: true,
  business: "strong",
  value: "fair",
  extended: false,
  distress: false,
  deterioration: false,
  insolvency: false,
  confirmedPace: 2,
};
test("confirmed Pace supports gradual buying after business checks across valuation sensitivities", () => {
  for (const confirmedPace of [2, 3, 4]) {
    for (const value of ["attractive", "fair", "expensive", "unassessed"]) {
      for (const ownsPosition of [false, true]) {
        assert.deepEqual(
          assessDecision({ ...supported, confirmedPace, value, ownsPosition }),
          { action: ownsPosition ? "Add" : "Buy", code: "accumulation" },
        );
      }
    }
  }
});
test("a lower share price does not turn a weak or unqualified business into a Buy", () => {
  for (const business of ["weak", "developing", "missing"]) {
    assert.deepEqual(
      assessDecision({
        ...supported,
        business,
        confirmedPace: 4,
        value: "attractive",
      }),
      { action: "Review", code: "business" },
    );
  }
});
test("funded growth can accumulate without forcing a profitable-company valuation", () => {
  assert.deepEqual(
    assessDecision({
      ...supported,
      business: "developing",
      growthEligible: true,
      value: "unassessed",
    }),
    { action: "Buy", code: "accumulation" },
  );
});
test("P0 pauses a supported business even when valuation is unavailable", () => {
  for (const ownsPosition of [false, true]) {
    assert.deepEqual(
      assessDecision({
        ...supported,
        confirmedPace: 0,
        value: "unassessed",
        ownsPosition,
      }),
      { action: ownsPosition ? "Hold" : "Wait", code: "pace" },
    );
  }
});
test("risk overrides P4 and identifies a different action for holdings", () => {
  for (const [risk, code, holding] of [
    ["insolvency", "insolvency", "Sell"],
    ["distress", "funding", "Reduce"],
    ["deterioration", "deterioration", "Reduce"],
  ]) {
    for (const ownsPosition of [false, true]) {
      assert.deepEqual(
        assessDecision({
          ...supported,
          [risk]: true,
          confirmedPace: 4,
          ownsPosition,
        }),
        { action: ownsPosition ? holding : "Avoid", code },
      );
    }
  }
});
test("missing essential inputs mean Review rather than a negative business verdict", () => {
  for (const [input, code] of [
    ["priceUsable", "price"],
    ["financialsUsable", "financials"],
  ]) {
    assert.deepEqual(assessDecision({ ...supported, [input]: false }), {
      action: "Review",
      code,
    });
  }
});
test("short-term momentum does not rewrite a confirmed accumulation decision", () => {
  assert.deepEqual(assessDecision({ ...supported, extended: true }), {
    action: "Buy",
    code: "accumulation",
  });
});
test("unavailable or malformed Pace is never fabricated into an accumulation instruction", () => {
  for (const confirmedPace of [undefined, null, NaN, Infinity, -1, 5, 2.5]) {
    const result = assessDecision({ ...supported, confirmedPace });
    assert.equal(result.action, "Review");
    assert.notEqual(result.code, "accumulation");
  }
});
function withPace(price = 60) {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = r.history.map((row) => {
    const close =
      row.time >= "2026-10-01" ? 60 : row.time >= "2026-09-01" ? 85 : 100;
    return {
      ...row,
      close,
      open: close,
      high: close * 1.01,
      low: close * 0.99,
    };
  });
  r.quote = { ...r.quote, price, stale: false, asOf: r.retrievedAt };
  return r;
}
test("a small daily price change leaves confirmed Pace and the business decision stable", () => {
  const decisions = [149.99, 150, 150.01].map((price) => {
    const r = withPace(price);
    return aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  });
  assert.equal(decisions[0].brief.accumulation.multiplier, 2);
  assert.equal(decisions[0].brief.accumulation.forming.multiplier, 4);
  for (const d of decisions) {
    assert.equal(d.action, "Buy");
    assert.equal(d.explanation.code, "accumulation");
    assert.match(d.headline, /initial accumulation/i);
    assert.ok(d.risks.some((r) => /model|valuation/i.test(r)));
    assert.doesNotMatch(d.changeConditions[0], /entry at/i);
    assert.equal(
      d.brief.accumulation.multiplier,
      decisions[0].brief.accumulation.multiplier,
    );
  }
});
test("Pace explains the budget boundary and Review without calling the business bad", () => {
  assert.match(pacePresentation("Buy", 4).detail, /budget|limit/i);
  assert.match(pacePresentation("Review", 4).detail, /review|assessment/i);
  assert.equal(pacePresentation("Review", 4).effectiveCode, null);
});
test("Review names missing business evidence instead of sending users to an unrelated valuation check", () => {
  for (const [metric, expected] of [
    ["revenue", /missing.*comparable revenue growth/i],
    ["operatingIncome", /missing.*operating profit/i],
  ]) {
    const r = withPace();
    r.facts = r.facts.filter((f) => f.metric !== metric);
    const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
    assert.equal(d.action, "Review");
    assert.equal(d.explanation.code, "business");
    assert.match(d.explanation.detail, expected);
    assert.match(d.changeConditions[0], expected);
  }
});
