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
  const mid = (plain.bear + plain.bull) / 2;
  const h = scenarioHeadline({ ...r, evidence: { ...r.evidence, consensus: { target: mid } } });
  assert.equal(h.source, "analyst-history");
  assert.equal(h.base, mid);
  assert.equal(h.bear, plain.bear);
  assert.equal(h.bull, plain.bull);
  // A consensus outside the historical range is never forced into an unordered set.
  assert.equal(scenarioHeadline({ ...r, evidence: { ...r.evidence, consensus: { target: plain.bull * 3 } } }).source, "history");
  const hist = scenarioHeadline({ ...pick("large-cap"), evidence: undefined });
  assert.equal(hist.source, "history");
  assert.match(hist.detail, /Not fair value or a forecast/);
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
