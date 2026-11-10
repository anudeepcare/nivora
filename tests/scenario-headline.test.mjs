import test from "node:test";
import assert from "node:assert/strict";
import { scenarioHeadline } from "../lib/scenario-headline.ts";
import { universe } from "./helpers/market-universe.mjs";

const market = universe(8);
const pick = (kind) => market.find((m) => m.kind === kind).research;
test("supplied analyst range leads; otherwise consensus scaled by revenue forecasts; otherwise named history", () => {
  const full = scenarioHeadline(pick("analyst-full"));
  assert.equal(full.source, "analyst");
  assert.ok(full.bear < full.base && full.base < full.bull);
  const r = pick("analyst-consensus-only"), px = r.quote.price, end = "2027-12-31";
  const withRevenue = { ...r, company: { ...r.company, sector: "Technology" }, evidence: { ...r.evidence, profile: { sector: "Technology", industry: "Software" }, consensus: { target: px * 2 }, estimates: [{ date: end, period: "FY2027", frequency: "annual", currency: "USD", revenueLow: 80, revenue: 100, revenueHigh: 130 }] } };
  const h = scenarioHeadline(withRevenue);
  assert.equal(h.source, "analyst-revenue");
  assert.ok(Math.abs(h.base - px * 2) < 1e-9 && Math.abs(h.bear - px * 1.6) < 1e-9 && Math.abs(h.bull - px * 2.6) < 1e-9);
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
