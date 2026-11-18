import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDividendDates,
  normalizeEconomicEvents,
  normalizeTreasuryCurve,
} from "../lib/eod-context.ts";
test("dividend calendar retains reported dates only, validates subject and signals partial coverage", () => {
  const v = normalizeDividendDates(
    {
      meta: { symbol: "TEST.US", total: 2 },
      data: [{ symbol: "TEST.US", date: "2026-11-20" }],
      links: { next: "https://ignored.invalid" },
    },
    "TEST.US",
    "2026-11-18",
    "2026-12-18",
  );
  assert.equal(v.rows[0].date, "2026-11-20");
  assert.equal(v.truncated, true);
  assert.equal("amount" in v.rows[0], false);
  assert.throws(
    () =>
      normalizeDividendDates(
        { meta: { symbol: "OTHER.US" }, data: [] },
        "TEST.US",
        "2026-11-18",
        "2026-12-18",
      ),
    /identity/,
  );
});
test("economic events preserve unknown time zone and nullable unitless values, never coerce missing values to zero", () => {
  const v = normalizeEconomicEvents(
    [
      {
        country: "US",
        type: "Payrolls",
        date: "2026-11-20 09:00:00",
        comparison: null,
        period: "Oct",
        actual: null,
        estimate: 0,
        previous: 123,
      },
    ],
    "2026-11-18",
    "2026-11-25",
  );
  assert.equal(v.rows[0].reportedTime, "09:00:00");
  assert.equal(v.rows[0].actual, null);
  assert.equal(v.rows[0].estimate, 0);
  assert.equal("timezone" in v.rows[0], false);
});
test("Treasury yields use one actual dated curve, not a mixture of freshest tenors", () => {
  const v = normalizeTreasuryCurve(
    {
      data: [
        { date: "2026-11-17", tenor: "2Y", rate: 3 },
        { date: "2026-11-17", tenor: "10Y", rate: 4 },
        { date: "2026-11-18", tenor: "2Y", rate: 3.1 },
      ],
    },
    "2026-11-18",
  );
  assert.equal(v.date, "2026-11-18");
  assert.deepEqual(v.rows, [{ tenor: "2Y", rate: 3.1 }]);
  assert.equal(v.spread10y2y, null);
  const both = normalizeTreasuryCurve(
    {
      data: [
        { date: "2026-11-17", tenor: "2Y", rate: 3 },
        { date: "2026-11-17", tenor: "10Y", rate: 4 },
      ],
    },
    "2026-11-18",
  );
  assert.equal(both.spread10y2y, 1);
});
