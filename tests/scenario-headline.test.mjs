import test from "node:test";
import assert from "node:assert/strict";
import { scenarioHeadline } from "../lib/scenario-headline.ts";
import { universe } from "./helpers/market-universe.mjs";

const market = universe(8);
const pick = (kind) => market.find((m) => m.kind === kind).research;
test("supplied analyst range leads; otherwise consensus with a historical bear and bull; otherwise named history", () => {
  const full = scenarioHeadline(pick("analyst-full"));
  assert.equal(full.source, "analyst");
  assert.ok(full.bear < full.base && full.base < full.bull);
  const r = pick("large-cap"), plain = scenarioHeadline({ ...r, evidence: undefined });
  assert.equal(plain.source, "history");
  assert.ok(plain.bear < plain.base && plain.base < plain.bull);
  const mid = (plain.base + plain.bull) / 2;
  const h = scenarioHeadline({ ...r, evidence: { ...r.evidence, consensus: { target: mid } } });
  assert.equal(h.source, "analyst-history");
  assert.equal(h.base, mid);
  assert.equal(h.bear, plain.bear);
  assert.equal(h.bull, plain.bull);
  assert.ok(h.bear < r.quote.price * 1.02, "bear is a real downside from today's price");
  // A consensus outside the range is never forced into an unordered set.
  assert.equal(scenarioHeadline({ ...r, evidence: { ...r.evidence, consensus: { target: plain.bull * 3 } } }).source, "history");
  const hist = scenarioHeadline({ ...pick("large-cap"), evidence: undefined });
  assert.equal(hist.source, "history");
  assert.match(hist.detail, /Not fair value or a forecast/);
  assert.match(hist.detail, /one year in five/);
});
test("every market shape yields ordered positive cases or nothing; never a base pinned to today's price", () => {
  for (const { kind, research } of market) {
    const h = scenarioHeadline(research);
    if (!h) continue;
    assert.ok(h.bear > 0 && h.bear <= h.base && h.base <= h.bull && Number.isFinite(h.bull), kind);
    assert.ok(h.eyebrow && h.detail.length > 40, kind);
  }
  assert.equal(scenarioHeadline(pick("crypto")), null);
});
import { extremeRevenueModel, scenarioCases } from "../lib/scenario-cases.ts";
import { aurynDecision } from "../lib/auryn-decision.ts";
import { stockPillars } from "../lib/stock-pillars.ts";
test("a trailing revenue multiple carried onto a much larger forecast is withheld, as on the live CIFR page", () => {
  const model = (multiple, target, basis = "revenue") => ({ available: true, basis, cases: [{}, { multiple, target }, {}] });
  assert.equal(extremeRevenueModel(model(54.4, 83.58), 6.81), true);
  assert.equal(extremeRevenueModel(model(8, 30), 6.81), true);
  assert.equal(extremeRevenueModel(model(8, 12), 6.81), false);
  assert.equal(extremeRevenueModel(model(54.4, 83.58, "earnings"), 6.81), false);
});
test("every panel reads the same single set of cases", () => {
  for (const { kind, research } of market) {
    const d = aurynDecision(research, { now: Date.parse(research.retrievedAt) });
    const c = scenarioCases(research, d), p = stockPillars(research, d);
    if (!p) { assert.equal(c, null, kind); continue; }
    assert.deepEqual(p.cases && [p.cases.bear, p.cases.base, p.cases.bull], c && [c.bear, c.base, c.bull], kind);
    if (c) assert.ok(c.bear <= c.base && c.base <= c.bull, kind);
  }
});

import { expectedRange, EXPECTED_RANGE } from "../lib/scenario-calibration.ts";
test("expected range scales with the stock's own volatility and stays within sane bounds", () => {
  const mk = (vol) => { let p = 100, seed = 3; const out = []; for (let i = 0; i < 400; i++) { seed = (seed * 16807) % 2147483647; const u = seed / 2147483647, v = ((seed * 48271) % 2147483647) / 2147483647; p *= Math.exp(vol * Math.sqrt(-2 * Math.log(u || 1e-9)) * Math.cos(2 * Math.PI * v)); const d = new Date(Date.UTC(2025, 0, 1 + i)); out.push({ time: d.toISOString().slice(0, 10), open: p, high: p, low: p, close: p, volume: 1 }); } return out; };
  const asOf = "2026-06-01T00:00:00Z";
  const calm = expectedRange(mk(0.012), asOf, 252, "crypto"), wild = expectedRange(mk(0.045), asOf, 252, "crypto");
  assert.ok(calm.available && wild.available);
  assert.ok(calm.bear > -25 && calm.bull < 35, JSON.stringify(calm));
  assert.ok(wild.bear > -60 && wild.bear < -35 && wild.bull < 160, JSON.stringify(wild));
  assert.ok(Math.abs(Math.log(1 + calm.bull / 100) + Math.log(1 + calm.bear / 100)) < 1e-9, "symmetric in log terms");
  assert.equal(expectedRange(mk(0.02).slice(0, 80), asOf, 252, "crypto").available, false);
  assert.ok(EXPECTED_RANGE.z[252] > EXPECTED_RANGE.z[63]);
  const violent = expectedRange(mk(0.12), asOf, 252, "crypto");
  assert.equal(violent.available, false);
  assert.match(violent.reason, /too violently/);
});
