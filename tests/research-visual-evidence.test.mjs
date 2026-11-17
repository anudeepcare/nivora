import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarEvents,
  ownershipLinks,
  monthCells,
} from "../lib/research-visual-evidence.ts";
test("calendar uses reported event dates, deduplicates, and does not turn estimate periods into events", () => {
  const r = {
    evidence: {
      earnings: [
        { date: "2026-11-10", actual: 2 },
        { date: "2026-11-10", actual: 2 },
        { date: "2026-02-30" },
      ],
      insiders: [{ date: "2026-11-11", name: "A", code: "S", change: 10 }],
      estimates: [{ date: "2027-01-01" }],
    },
    filings: [
      { date: "2026-11-12", form: "10-Q" },
      { date: "invalid", form: "8-K" },
    ],
  };
  const e = calendarEvents(r);
  assert.equal(e.length, 3);
  assert.deepEqual(
    e.map((x) => x.date),
    ["2026-11-10", "2026-11-11", "2026-11-12"],
  );
  assert.equal(e[1].kind, "transaction");
});
test("calendar grid uses actual month length and Monday alignment", () => {
  const cells = monthCells("2026-02");
  assert.equal(cells.filter(Boolean).length, 28);
  assert.equal(cells[6], "2026-02-01");
  assert.deepEqual(monthCells("bad"), []);
});
test("ownership map uses documented institutions only, no synthesized weights or undated edges", () => {
  const m = ownershipLinks(
    {
      ticker: "AAPL",
      reportDate: "2026-09-30",
      holders: [
        { filerName: "Fund A", shares: 100, pctOfClassOutstanding: 2 },
        { filerName: "Fund B", shares: 90 },
        { filerName: "Fund A", shares: 100 },
        { filerName: "", shares: 1 },
      ],
    },
    "AAPL",
  );
  assert.equal(m.rows.length, 2);
  assert.equal(m.rows[0].ownership, 2);
  assert.equal(m.rows[1].ownership, null);
  assert.equal(m.asOf, "2026-09-30");
  assert.equal(
    ownershipLinks({ holders: [{ filerName: "Fund" }] }, "AAPL").rows.length,
    0,
  );
  assert.equal(
    ownershipLinks(
      {
        ticker: "MSFT",
        reportDate: "2026-09-30",
        holders: [{ filerName: "Fund" }],
      },
      "AAPL",
    ).rows.length,
    0,
  );
});
