import test from "node:test";
import assert from "node:assert/strict";
import { headerBusinessMetrics } from "../lib/company-header.ts";
const p = {
  end: "2026-06-30",
  start: "2025-07-01",
  basis: "GAAP",
  currency: "USD",
  revenue: 120,
  fcf: 24,
  margin: 12,
  netIncome: 10,
  equity: 50,
};
const prior = { ...p, end: "2025-06-30", revenue: 100, equity: 30 };
test("header separates growth and cash generation with their financial date", () => {
  const x = headerBusinessMetrics(p, prior, false, "2026-11-05");
  assert.ok(Math.abs(x[0].value - 20) < 1e-9);
  assert.equal(x[1].value, 20);
  assert.equal(x[1].date, p.end);
});
test("financial businesses use supplied equity, never generic cash margin", () => {
  const x = headerBusinessMetrics(p, prior, true, "2026-11-05");
  assert.equal(x[1].label, "Return on average equity");
  assert.equal(x[1].value, 25);
  assert.equal(
    headerBusinessMetrics({ ...p, equity: null }, prior, true, "2026-11-05")
      .length,
    1,
  );
});
test("future periods and incompatible comparisons are withheld", () => {
  assert.deepEqual(headerBusinessMetrics(p, prior, false, "2026-01-01"), []);
  assert.equal(
    headerBusinessMetrics(
      p,
      { ...prior, currency: "EUR" },
      false,
      "2026-11-05",
    ).some((x) => x.label === "Revenue growth"),
    false,
  );
});
test("header uses the shared business classification for missing profiles and insurer variants", async () => {
  const { headerBusinessFamily } = await import("../lib/company-header.ts");
  assert.equal(
    headerBusinessFamily({
      company: { symbol: "JPM", assetType: "stock" },
      evidence: {},
    }),
    "financial",
  );
  assert.equal(
    headerBusinessFamily({
      company: { symbol: "UNKNOWN", assetType: "stock" },
      evidence: { profile: { industry: "Health Care Plans" } },
    }),
    "insurance",
  );
});

test("expanded header includes operating and net margin only when supported and finite", () => {
  const rows = headerBusinessMetrics(p, prior, false, "2026-11-05");
  assert.equal(rows.find((x) => x.label === "Operating margin").value, 12);
  assert.ok(
    Math.abs(rows.find((x) => x.label === "Net margin").value - 100 / 12) <
      1e-9,
  );
  const extreme = headerBusinessMetrics(
    { ...p, revenue: Number.MAX_VALUE },
    { ...prior, revenue: Number.MIN_VALUE },
    false,
    "2026-11-05",
  );
  assert.ok(extreme.every((x) => Number.isFinite(x.value)));
});
