import test from "node:test";
import assert from "node:assert/strict";
import { assessDecision, aurynDecision } from "../lib/auryn-decision.ts";
import { pacePresentation } from "../lib/pace-presentation.ts";
import { demoData } from "./fixtures/demo.ts";

const base = {
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
test("healthy businesses outside accumulation zones do not become Buy even at attractive model values", () => {
  for (const value of ["attractive", "fair", "expensive", "unassessed"]) {
    assert.deepEqual(assessDecision({ ...base, value, confirmedPace: 1 }), {
      action: "Watch",
      code: "zone",
    });
    assert.deepEqual(
      assessDecision({ ...base, value, confirmedPace: 1, ownsPosition: true }),
      { action: "Hold", code: "zone" },
    );
    assert.equal(
      assessDecision({ ...base, value, confirmedPace: 0 }).action,
      "Wait",
    );
  }
});
test("eligible zones produce distinct actions without promising purchase multiples", () => {
  for (const [level, entry, holding] of [
    [2, "Buy small", "Add small"],
    [3, "Buy gradually", "Add gradually"],
    [4, "Accumulate", "Accumulate"],
  ]) {
    assert.equal(
      assessDecision({ ...base, confirmedPace: level }).action,
      "Buy",
    );
    for (const [action, label] of [
      ["Buy", entry],
      ["Add", holding],
    ]) {
      const p = pacePresentation(action, level);
      assert.equal(p.actionLabel, label);
      assert.doesNotMatch(p.detail, /×|times your|fourfold/);
      assert.match(p.detail, /budget|limit/);
    }
  }
  assert.doesNotMatch(pacePresentation("Hold", 1).detail, /P0/);
});
test("a completed P2 and forming P4 keep their independent identities through decisions", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.history = r.history.map((row) => {
    const close =
      row.time >= "2026-10-01" ? 60 : row.time >= "2026-09-01" ? 85 : 100;
    return { ...row, open: close, high: close, low: close, close };
  });
  assert.deepEqual(
    [...new Set(r.history.map((r) => r.close))].sort((a, b) => a - b),
    [60, 85, 100],
  );
  const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
  assert.equal(d.brief.accumulation.multiplier, 2);
  assert.equal(d.brief.accumulation.forming.multiplier, 4);
  assert.equal(d.actionLabel, "Buy small");
});
test("P4 cannot bypass any business risk or essential data check", () => {
  for (const level of [0, 1, 2, 3, 4]) {
    for (const risk of ["distress", "deterioration", "insolvency"])
      assert.equal(
        assessDecision({ ...base, confirmedPace: level, [risk]: true }).action,
        "Avoid",
      );
    assert.equal(
      assessDecision({ ...base, confirmedPace: level, financialsUsable: false })
        .action,
      "Review",
    );
  }
});
