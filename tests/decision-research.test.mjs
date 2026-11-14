import test from "node:test";
import assert from "node:assert/strict";
import {
  fadeDcf,
  solveDcfGrowth,
  solveDcfReturn,
  anchorScore,
  researchDecision,
} from "../lib/decision-research.ts";
import { demoData } from "./fixtures/demo.ts";
test("cash-flow sensitivity has a hand-checkable constant-growth perpetuity and solves back to its assumptions", () => {
  const p = { cashFlow: 4, growth: 0, terminal: 0, discount: 10 };
  assert.ok(Math.abs(fadeDcf(p) - 40) < 1e-8);
  const p2 = { cashFlow: 4, growth: 12, terminal: 2.5, discount: 10 };
  const v = fadeDcf(p2);
  assert.ok(Math.abs(solveDcfGrowth(p2, v) - 12) < 1e-7);
  assert.ok(Math.abs(solveDcfReturn(p2, v) - 10) < 1e-7);
  assert.equal(fadeDcf({ ...p, discount: 0 }), null);
  assert.equal(solveDcfGrowth(p2, 1e12), null);
});
test("scores interpolate anchors, handle missing evidence and do not silently zero it", () => {
  assert.equal(
    anchorScore(null, [
      [0, 0],
      [10, 10],
    ]),
    null,
  );
  assert.equal(
    anchorScore(5, [
      [0, 0],
      [10, 10],
    ]),
    5,
  );
  const r = researchDecision({
    ...demoData.research.MSFT,
    facts: [],
    evidence: undefined,
  });
  assert.equal(r.overall, null);
  assert.equal(r.lenses.find((x) => x.id === "moat").score, null);
  assert.ok(r.gaps.length);
});
test("cash-flow scenarios respect economic monotonicity and invalid assumptions", () => {
  const p = { cashFlow: 4, growth: 12, terminal: 2, discount: 10 },
    v = fadeDcf(p);
  assert.ok(fadeDcf({ ...p, growth: 16 }) > v);
  assert.ok(fadeDcf({ ...p, discount: 12 }) < v);
  assert.ok(Math.abs(fadeDcf({ ...p, cashFlow: 8 }) - 2 * v) < 1e-8);
  for (const patch of [
    { cashFlow: -1 },
    { cashFlow: NaN },
    { discount: 2 },
    { terminal: -1 },
    { growth: 101 },
  ])
    assert.equal(fadeDcf({ ...p, ...patch }), null);
});
test("research preferences reject malformed saved settings", async () => {
  const { sanitizeResearchPreferences } = await import(
    "../lib/research-preferences.ts"
  );
  assert.deepEqual(
    sanitizeResearchPreferences({
      style: "Strong buy",
      detail: "invalid",
      horizon: "day",
    }),
    { style: "Balanced", detail: "essential", horizon: "long" },
  );
  assert.deepEqual(
    sanitizeResearchPreferences({
      style: "Quality",
      detail: "advanced",
      horizon: "swing",
    }),
    { style: "Quality", detail: "advanced", horizon: "swing" },
  );
});

test("next-report snapshot excludes reported, invalid and stale calendar observations", () => {
  const r = {
    ...structuredClone(demoData.research.MSFT),
    retrievedAt: "2026-11-08T12:00:00Z",
    evidence: {
      updatedAt: "2026-11-08",
      earnings: [
        { date: "2026-11-08", actual: 1 },
        { date: "2026-11-31", actual: null },
        { date: "2026-11-12", actual: null },
      ],
    },
  };
  assert.equal(researchDecision(r).nextReport, "2026-11-12");
  assert.equal(
    researchDecision({
      ...r,
      evidence: { ...r.evidence, updatedAt: "2026-01-01" },
    }).nextReport,
    null,
  );
});

test("the unscored ownership target follows selected provider without changing scores or model outputs", () => {
  const base = structuredClone(demoData.research.MSFT);
  base.retrievedAt = base.priceObservedAt = "2026-11-14T00:00:00Z";
  base.evidence = {
    ...(base.evidence ?? {}),
    source: "EODHD",
    updatedAt: "2026-11-13",
    consensus: { target: 40 },
  };
  const before = researchDecision(base);
  const target = {
    symbol: base.company.symbol,
    currency: "USD",
    source: "SentiSense",
    sourceField: "consensus.targetMean",
    timestampBasis: "dataset-refresh",
    updatedAt: "2026-11-13T23:37:41Z",
    low: 23,
    target: 56.6874,
    high: 139,
    analysts: 19,
  };
  const next = researchDecision({ ...base, analystTargets: target });
  const metric = next.lenses
    .find((x) => x.id === "sentiment")
    .metrics.find((x) => x.id === "target");
  assert.equal(metric.value, 56.6874);
  assert.equal(metric.score, null);
  assert.match(metric.reason, /SentiSense/);
  assert.match(metric.reason, /2026-11-13/);
  assert.equal(next.overall, before.overall);
  assert.deepEqual(
    next.lenses.map((x) => x.score),
    before.lenses.map((x) => x.score),
  );
  assert.deepEqual(
    { ...next, lenses: undefined },
    { ...before, lenses: undefined },
  );
  const fallback = researchDecision({
    ...base,
    analystTargets: { ...target, updatedAt: "2020-01-01T00:00:00Z" },
  })
    .lenses.find((x) => x.id === "sentiment")
    .metrics.find((x) => x.id === "target");
  assert.equal(fallback.value, 40);
  assert.match(fallback.reason, /EODHD/);
});
