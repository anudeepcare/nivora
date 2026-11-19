import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scenarioResearchInput } from "../lib/scenario-reference.ts";
import { selectPriceReference } from "../lib/price-reference.ts";
import { researchBrief } from "../lib/research-brief.ts";
import { researchOutlook } from "../lib/outlook.ts";
import { targetsEstimates } from "../lib/targets-estimates.ts";
import { demoData } from "./fixtures/demo.ts";
test("Atlas and selected scenario use identical admissible price/date/currency model inputs", () => {
  for (const source of Object.values(demoData.research)) {
    for (const r of [
      source,
      { ...source, quote: { ...source.quote, price: 1e8, stale: true } },
    ]) {
      const reference = selectPriceReference(
        r,
        Date.parse(r.priceObservedAt ?? r.retrievedAt),
      );
      const input = scenarioResearchInput(r);
      if (reference) {
        assert.equal(input.quote.price, reference.price);
        assert.equal(input.quote.asOf, reference.asOf);
        assert.equal(input.quote.currency, reference.currency);
      }
      assert.deepEqual(targetsEstimates(r).forecast, researchOutlook(input));
      const expected = researchOutlook(input),
        brief = researchBrief(r);
      assert.equal(
        brief.scenarioEligible,
        expected.available && expected.basis === "earnings",
      );
      if (expected.available)
        assert.deepEqual(
          [brief.scenario.low, brief.scenario.base, brief.scenario.high],
          expected.cases.map((x) => x.target),
        );
    }
  }
  assert.match(
    fs.readFileSync("components/SelectedValuation.tsx", "utf8"),
    /scenarioResearchInput\(r\)/,
  );
});
test("missing price evidence is not manufactured by model input normalization", () => {
  const r = {
    ...demoData.research.MSFT,
    history: [],
    quote: {
      ...demoData.research.MSFT.quote,
      price: null,
      asOf: null,
      stale: true,
    },
  };
  assert.equal(scenarioResearchInput(r), r);
});
