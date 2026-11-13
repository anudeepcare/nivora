import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assessDecision, aurynDecision } from "../lib/auryn-decision.ts";
import { pacePresentation } from "../lib/pace-presentation.ts";
import { PaceInstrument } from "./helpers/integrated-ui.mjs";
import { demoData } from "./fixtures/demo.ts";

const base = {
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
test("descriptive loss and cash-after-capex cohorts cannot manufacture an Avoid or Reduce verdict", () => {
  for (const business of ["developing", "weak", "missing"])
    for (const ownsPosition of [false, true]) {
      assert.deepEqual(
        assessDecision({
          ...base,
          business,
          ownsPosition,
          record: { business: "fail", uptrend: false, deepFall: true },
        }),
        { action: "Review", code: "business" },
      );
    }
});
test("qualified P2-P4 entries survive a deep drawdown while actual funding risks still block them", () => {
  for (const confirmedPace of [2, 3, 4])
    for (const ownsPosition of [false, true]) {
      for (const business of ["pass", "mixed", "fail"]) {
        const input = {
          ...base,
          confirmedPace,
          ownsPosition,
          record: { business, uptrend: false, deepFall: true },
        };
        assert.deepEqual(assessDecision(input), {
          action: ownsPosition ? "Add" : "Buy",
          code: "accumulation",
        });
        for (const risk of ["distress", "deterioration", "insolvency"]) {
          assert.equal(
            assessDecision({ ...input, [risk]: true }).action,
            ownsPosition
              ? risk === "insolvency"
                ? "Sell"
                : "Reduce"
              : "Avoid",
          );
        }
      }
    }
});
test("positive cohort trend cannot turn P1 into an undisclosed Buy or Add", () => {
  for (const ownsPosition of [false, true])
    assert.deepEqual(
      assessDecision({
        ...base,
        ownsPosition,
        confirmedPace: 1,
        record: { business: "pass", uptrend: true, deepFall: false },
      }),
      { action: ownsPosition ? "Hold" : "Watch", code: "zone" },
    );
});
test("actionable P2-P4 headlines preserve Buy versus Add including the deepest zone", () => {
  for (const action of ["Buy", "Add"])
    for (const level of [2, 3, 4]) {
      assert.match(
        pacePresentation(action, level).actionLabel,
        new RegExp("^" + action + "\\b"),
      );
    }
});
test("the visible headline explains a forming deeper zone that is not yet eligible", () => {
  const research = demoData.research.MSFT;
  const now = Date.parse(research.retrievedAt);
  const baseDecision = aurynDecision(research, { now });
  const decision = {
    ...baseDecision,
    action: "Watch",
    actionLabel: "Watch",
    pace: {
      ...baseDecision.pace,
      level: 2,
      eligibleLevel: 1,
      historicalLevel: 1,
      awaitingClose: true,
      provisional: true,
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(PaceInstrument, { research, decision, now }),
  );
  const beforeDetail = html.split("<details")[0];
  assert.match(beforeDetail, /P2 is provisional/);
  assert.match(beforeDetail, /uses P1/);
});
