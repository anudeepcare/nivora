import test from "node:test";
import assert from "node:assert/strict";
const m = await import("../lib/home-feed.ts").catch(() => ({}));
test("Home earnings use report dates, selected stocks and a bounded future window", () => {
  assert.equal(typeof m.calendarHighlights, "function");
  const raw = {
    earnings: [
      {
        code: "HIMS.US",
        date: "2026-06-30",
        report_date: "2026-10-22",
        before_after_market: "AfterMarket",
      },
      { code: "HIMS.US", date: "2026-12-31", report_date: "2026-10-17" },
      { code: "CRM.US", report_date: "2026-10-24" },
      { code: "HIMS.US", report_date: "2026-12-24" },
      {
        code: "HIMS.US",
        report_date: "2026-10-22",
        before_after_market: "AfterMarket",
      },
    ],
  };
  const r = m.calendarHighlights(raw, {}, ["HIMS"], "2026-10-18", "2026-11-17");
  assert.equal(r.length, 1);
  assert.equal(r[0].date, "2026-10-22");
  assert.equal(r[0].kind, "Earnings");
  assert.equal(r[0].detail, "After market close");
});
test("Home split events retain ratio direction and exclude invalid ratios", () => {
  assert.equal(typeof m.calendarHighlights, "function");
  const r = m.calendarHighlights(
    {},
    {
      splits: [
        {
          code: "HIMS.US",
          split_date: "2026-10-25",
          old_shares: 10,
          new_shares: 1,
        },
        {
          code: "HIMS.US",
          split_date: "2026-10-26",
          old_shares: 1,
          new_shares: 0,
        },
      ],
    },
    ["HIMS"],
    "2026-10-18",
    "2026-11-17",
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].kind, "Reverse split");
  assert.equal(r[0].detail, "1 for 10 shares");
});
test("Home news stays recent, deduplicates publisher URLs and never accepts unsafe links or future headlines", () => {
  assert.equal(typeof m.newsHighlights, "function");
  const items = [
    {
      date: "2026-10-17",
      title: "Results released",
      url: "https://example.com/a",
    },
    { date: "2026-10-17", title: "Duplicate", url: "https://example.com/a" },
    { date: "2026-11-18", title: "Future", url: "https://example.com/f" },
    { date: "2026-01-01", title: "Old", url: "https://example.com/o" },
    { date: "2026-10-17", title: "Unsafe", url: "javascript:alert(1)" },
  ];
  const r = m.newsHighlights(
    [{ symbol: "HIMS", items }],
    "2026-10-18T12:00:00Z",
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].title, "Results released");
  assert.equal(r[0].symbol, "HIMS");
});
