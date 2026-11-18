import test from "node:test";
import assert from "node:assert/strict";
import {
  analystActivityQuery,
  projectAnalystActivity,
} from "../lib/analyst-market-activity.ts";
const now = Date.parse("2026-11-18T18:00:00Z"),
  q = analystActivityQuery(new URLSearchParams());
const row = {
  ticker: "ABC",
  firm: "Example Research",
  actionDate: "2026-11-17",
  actionType: "UPGRADE",
  fromGrade: "Hold",
  toGrade: "Buy",
  priceTarget: 100,
  priorPriceTarget: 50,
};
test("requests default real rating changes, fixed window and bounded manual pages", () => {
  assert.deepEqual(q, { days: 30, offset: 0, mode: "changes" });
  for (const s of [
    "days=365",
    "offset=1001",
    "mode=evil",
    "mode=all&mode=changes",
    "url=x",
  ])
    assert.throws(() => analystActivityQuery(new URLSearchParams(s)));
});
test("market records preserve action identity/date and deliberately omit split-unsafe targets", () => {
  const d = projectAnalystActivity(
    { isPreview: false, totalCount: 100, data: [row] },
    q,
    now,
  );
  assert.equal(d.rows[0].firm, "Example Research");
  assert.equal(d.rows[0].actionDate, "2026-11-17");
  assert.equal(d.rows[0].toGrade, "Buy");
  assert.equal(JSON.stringify(d).includes("priceTarget"), false);
  assert.equal(d.totalCount, 100);
});
test("free full first page is not inferred as paid; later allowance fallback is withheld", () => {
  const d = projectAnalystActivity(
    { isPreview: false, totalCount: 60, data: Array(50).fill(row) },
    q,
    now,
  );
  assert.equal(d.canNext, true);
  assert.equal(d.isPreview, false);
  for (const preview of [true, false])
    assert.throws(() =>
      projectAnalystActivity(
        {
          isPreview: preview,
          previewReason: "PRO_REQUIRED",
          totalCount: 60,
          data: [row],
        },
        { ...q, offset: 50 },
        now,
      ),
    );
  assert.throws(() =>
    projectAnalystActivity(
      { isPreview: true, totalCount: 0, data: [row] },
      q,
      now,
    ),
  );
});
test("malformed/future/out-of-window or wrong filter rows are counted, not invented", () => {
  const d = projectAnalystActivity(
    {
      isPreview: false,
      totalCount: 4,
      data: [
        row,
        { ...row, actionDate: "2099-01-01" },
        { ...row, actionType: "REITERATE" },
        { ...row, ticker: "BAD/URL" },
      ],
    },
    q,
    now,
  );
  assert.equal(d.rows.length, 1);
  assert.equal(d.omitted, 3);
  const all = projectAnalystActivity(
    {
      isPreview: false,
      totalCount: 1,
      data: [
        { ...row, actionType: "REITERATE", fromGrade: null, toGrade: null },
      ],
    },
    { ...q, mode: "all" },
    now,
  );
  assert.equal(all.rows[0].fromGrade, null);
});
