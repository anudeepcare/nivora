import test from "node:test";
import assert from "node:assert/strict";
import { businessIndicatorPeriods } from "../lib/business-indicator-overview.ts";
const period = (end, overrides = {}) => ({
  end,
  start: end.slice(0, 4) + "-01-01",
  currency: "USD",
  basis: "annual",
  filed: "2026-02-01",
  sourceUrl: "https://example.test/filing",
  revenue: 100,
  operatingIncome: 20,
  fcf: -10,
  weightedShares: 50,
  ...overrides,
});
test("business wall shows measured growth/margins/dilution with source period metadata", () => {
  const rows = businessIndicatorPeriods([
    period("2024-12-31"),
    period("2025-12-31", {
      revenue: 120,
      operatingIncome: 0,
      fcf: 12,
      weightedShares: 55,
    }),
  ]);
  assert.ok(Math.abs(rows[0].points[1].value - 20) < 1e-9);
  assert.equal(rows[1].points[1].value, 0);
  assert.equal(rows[2].points[0].value, -10);
  assert.equal(rows[2].points[1].value, 10);
  assert.ok(Math.abs(rows[3].points[1].value - 10) < 1e-9);
  assert.equal(rows[0].points[1].currency, "USD");
  assert.equal(rows[0].points[1].sourceUrl, "https://example.test/filing");
});
test("currency, basis and period gaps cannot produce misleading annual changes", () => {
  for (const p of [
    period("2025-12-31", { currency: "EUR" }),
    period("2025-12-31", { basis: "different" }),
    period("2026-12-31"),
  ]) {
    const rows = businessIndicatorPeriods([period("2024-12-31"), p]);
    assert.equal(rows[0].points[1].value, null);
    assert.equal(rows[3].points[1].value, null);
  }
  const rows = businessIndicatorPeriods([
    period("2024-12-31", { revenue: 0, weightedShares: 0 }),
    period("2025-12-31", { revenue: null, operatingIncome: null, fcf: null }),
  ]);
  assert.ok(rows.every((r) => r.points[1].value === null));
});
