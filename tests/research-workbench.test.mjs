import test from "node:test";
import assert from "node:assert/strict";
import * as w from "../lib/research-workbench.ts";
const period = (end, revenue, margin = 10) => ({
  end,
  start: end.slice(0, 4) + "-01-01",
  currency: "USD",
  revenue,
  margin,
  fcf: 10,
  netIncome: 5,
  operatingIncome: 10,
  operatingCashFlow: 15,
  capex: 5,
  filed: end,
  basis: "Provider",
  sourceUrl: "",
});
test("financial trend keeps dates, missing values and reporting currency explicit", () => {
  const rows = w.trendPoints([
    period("2024-12-31", 100),
    period("2025-12-31", null),
  ]);
  assert.equal(rows[0].revenue, 100);
  assert.equal(rows[1].revenue, null);
  assert.equal(rows[1].date, "2025-12-31");
});
test("peer comparability rejects different currency, stale periods and nonpositive denominators", () => {
  assert.equal(
    w.comparablePeriods(period("2025-12-31", 100), {
      ...period("2025-09-30", 100),
      start: "2024-10-01",
    }),
    true,
  );
  assert.equal(
    w.comparablePeriods(period("2025-12-31", 100), {
      ...period("2025-12-31", 100),
      currency: "EUR",
    }),
    false,
  );
  assert.equal(
    w.comparablePeriods(period("2025-12-31", 100), period("2023-12-31", 100)),
    false,
  );
  assert.equal(w.safeChange(20, 0), null);
  assert.equal(w.safeChange(20, -5), null);
  assert.equal(w.safeChange(120, 100), 20);
});
test("CSV escapes quotes commas newlines and formula-looking labels", () => {
  const out = w.csvRows([
    ["Name", "Value"],
    ['=HYPERLINK("bad")', 1],
    ["A,B\nC", null],
  ]);
  assert(out.includes("'="));
  assert(out.includes('"A,B\nC"'));
  assert(!out.includes("null"));
});
test("earnings surprises use absolute estimate denominator and never divide by zero", () => {
  assert.equal(w.earningsSurprise(-0.1, -0.2), 50);
  assert.equal(w.earningsSurprise(1, 0), null);
  assert.equal(w.earningsSurprise(null, 2), null);
});
test("coverage distinguishes zero from missing evidence", () => {
  const rows = w.researchCoverage({
    quote: { price: 0, stale: false },
    history: [],
    facts: [],
    filings: [],
    evidence: undefined,
  });
  assert.equal(rows.find((x) => x.key === "quote").state, "Unavailable");
  assert.equal(rows.find((x) => x.key === "financials").state, "Unavailable");
});
test("peer comparability rejects accounting basis and duration mismatch", () => {
  const a = period("2025-12-31", 100);
  assert.equal(w.comparablePeriods(a, { ...a, basis: "IFRS" }), false);
  assert.equal(w.comparablePeriods(a, { ...a, start: "2025-07-01" }), false);
});
