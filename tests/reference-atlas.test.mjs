import test from "node:test";
import assert from "node:assert/strict";
import { referenceAtlas, atlasHorizonLabel } from "../lib/reference-atlas.ts";
import { demoData } from "./fixtures/demo.ts";
import { researchBrief } from "../lib/research-brief.ts";
const source = demoData.research.MSFT;
test("Atlas exposes six evidence orbits without synthetic scores", () => {
  const m = referenceAtlas(source);
  assert.deepEqual(
    m.signals.map((x) => x.label),
    ["Business", "Value", "Momentum", "Catalysts", "Ownership", "Risk"],
  );
  assert.ok(m.signals.every((x) => x.score === null));
  const b = researchBrief(source);
  assert.equal(m.brief.business.title, b.business.title);
  assert.equal(m.signals[0].value, b.businessNumbers.revenueGrowth);
  assert.equal(m.signals[2].value, b.timing.rsi);
});
test("missing evidence remains unavailable instead of borrowing prototype figures", () => {
  const empty = {
    ...source,
    history: [],
    facts: [],
    filings: [],
    evidence: undefined,
    snapshot: undefined,
    quote: { ...source.quote, price: null, asOf: null, stale: true },
  };
  const m = referenceAtlas(empty);
  assert.equal(m.signals[0].value, null);
  assert.equal(m.signals[2].value, null);
  assert.equal(m.signals[3].value, null);
  assert.equal(m.signals[4].value, null);
  assert.equal(m.pace, null);
  assert.deepEqual(m.cases, []);
});
test("scenario cases retain model horizon and source values, not a hardcoded five years", () => {
  const m = referenceAtlas(source),
    b = researchBrief(source);
  if (b.scenarioEligible && b.scenario) {
    assert.equal(m.horizon, b.scenario.years);
    assert.deepEqual(
      m.cases.map((x) => x.value),
      [b.scenario.low, b.scenario.base, b.scenario.high],
    );
  } else assert.deepEqual(m.cases, []);
});
test("Catalysts uses next scheduled event rather than count of past reports", () => {
  const r = {
    ...source,
    retrievedAt: "2026-11-17T12:00:00Z",
    evidence: {
      ...source.evidence,
      updatedAt: "2026-11-16",
      earnings: [
        { date: "2026-09-01", actual: 1 },
        { date: "2026-12-10", actual: null },
        { date: "2026-11-25", actual: null },
      ],
      holders: [{ name: "Fund", date: "2026-10-01", percent: 3 }],
    },
  };
  const m = referenceAtlas(r);
  assert.equal(m.signals[3].value, null);
  assert.equal(m.signals[3].valueLabel, "2026-11-25");
  assert.match(m.signals[3].detail, /scheduled/);
  assert.equal(m.signals[4].value, null);
  assert.equal(m.signals[4].valueLabel, "Not established");
});

test("Atlas horizon rounds presentation without changing modeled duration", () => {
 assert.equal(atlasHorizonLabel(1.6157771480404086), "1.6 years");
 assert.equal(atlasHorizonLabel(2), "2 years");
 for (const missing of [null, undefined, NaN, Infinity, 0, -1]) assert.equal(atlasHorizonLabel(missing), "");
});
