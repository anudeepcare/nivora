import test from "node:test";
import assert from "node:assert/strict";
import {
  earningsAnalysisQuery,
  projectEarningsAnalysis,
} from "../lib/earnings-analysis.ts";
const now = Date.parse("2026-11-18T18:00:00Z");
const request = (view) =>
  earningsAnalysisQuery(new URLSearchParams(`view=${view}`));
const row = {
  ticker: "ABC",
  fiscalPeriod: "Q3 FY2026",
  reportDate: "2026-11-17",
  headline: "Reported results",
  generatedAt: now / 1000 - 60,
};
const stats = () => ({
  isPreview: false,
  data: {
    calculationVersion: "1",
    asOf: now / 1000,
    window: {
      key: "2026-W46",
      kind: "COMPLETED_WEEK",
      startDate: "2026-11-09",
      endDate: "2026-11-15",
    },
    eventsInWindow: 10,
    classifiedEvents: 10,
    unclassifiedEvents: 0,
    distinctTickers: 10,
    completedReactions: 10,
    pendingReactions: 0,
    coverageRatio: 1,
    sufficientData: true,
    beat: {
      count: 6,
      rate: 0.6,
      withReaction: 6,
      fell: 2,
      rose: 4,
      flat: 0,
      fellRate: 1 / 3,
    },
    miss: {
      count: 3,
      rate: 0.3,
      withReaction: 3,
      fell: 2,
      rose: 1,
      flat: 0,
      fellRate: 2 / 3,
    },
    inline: {
      count: 1,
      rate: 0.1,
      withReaction: 1,
      fell: 0,
      rose: 0,
      flat: 1,
      fellRate: 0,
    },
  },
});
test("queries are finite documented views with fixed request limits", () => {
  assert.equal(request("recent").path, "earnings/recent?days=7&limit=25");
  assert.throws(() =>
    earningsAnalysisQuery(new URLSearchParams("view=recent&url=https://bad")),
  );
  assert.throws(() =>
    earningsAnalysisQuery(new URLSearchParams("view=ranked&view=recent")),
  );
});
test("recent keeps real canonical identity, content date and unavailable rather than future reports", () => {
  const r = projectEarningsAnalysis(
    {
      isPreview: false,
      data: [
        row,
        { ...row, ticker: "../x" },
        { ...row, ticker: "FUT", reportDate: "2026-11-19" },
      ],
    },
    request("recent"),
    now,
  );
  assert.equal(r.rows.length, 1);
  assert.equal(r.omitted, 2);
  assert.equal(r.rows[0].ticker, "ABC");
  assert.equal(r.rows[0].generatedAt, "2026-11-18T17:59:00.000Z");
});
test("statistical fractions retain correct denominator and thin samples suppress rate publication", () => {
  const r = projectEarningsAnalysis(stats(), request("statistics"), now);
  assert.equal(r.statistics.beatRate, 0.6);
  assert.equal(r.statistics.beatsFellRate, 1 / 3);
  const raw = stats();
  raw.data.sufficientData = false;
  raw.data.insufficientDataReason = "SAMPLE_BELOW_FLOOR";
  assert.equal(
    projectEarningsAnalysis(raw, request("statistics"), now).statistics
      .beatRate,
    null,
  );
});
test("contradictory counts/rates, future computation and wrong weekly span reject", () => {
  for (const mutate of [
    (d) => (d.beat.rate = 0.1),
    (d) => (d.completedReactions = 12),
    (d) => (d.asOf = now / 1000 + 1),
    (d) => (d.window.kind = "WEEK_TO_DATE"),
  ]) {
    const raw = stats();
    mutate(raw.data);
    assert.throws(() =>
      projectEarningsAnalysis(raw, request("statistics"), now),
    );
  }
});
test("ranked preview, pending reaction and omitted values remain distinct", () => {
  const raw = {
    isPreview: true,
    data: {
      asOf: now / 1000,
      rankingVersion: "1",
      reported: {
        windowStart: "2026-11-04",
        windowEnd: "2026-11-18",
        totalInWindow: 10,
        rows: [
          {
            ticker: "ABC",
            reportDate: "2026-11-17",
            reactionPending: true,
            liveReactionPct: -2,
            importance: 0.5,
          },
        ],
      },
      upcoming: {
        windowStart: "2026-11-18",
        windowEnd: "2026-11-25",
        totalInWindow: 5,
        rows: [
          {
            ticker: "XYZ",
            earningsDate: "2026-11-20",
            confirmed: false,
            importance: 0.4,
          },
        ],
      },
    },
  };
  const r = projectEarningsAnalysis(raw, request("ranked"), now);
  assert.equal(r.preview, true);
  assert.equal(r.rows[0].reactionKind, "Provisional session move");
  assert.equal(r.rows[0].movePct, -2);
  assert.equal(r.upcoming[0].confirmed, false);
  assert.equal(r.rows[0].eps, null);
  assert.equal(r.rows[0].sentisenseScore7d, undefined);
});

test("missing reaction coverage is distinct from pending sessions and recent fiscal periods retain identity", () => {
  const raw = stats();
  raw.data.completedReactions = 9;
  raw.data.coverageRatio = 0.9;
  raw.data.beat.withReaction = 5;
  raw.data.beat.rose = 3;
  raw.data.beat.fellRate = 0.4;
  const r = projectEarningsAnalysis(raw, request("statistics"), now);
  assert.equal(r.statistics.unavailableReactions, 1);
  assert.equal(r.statistics.pending, 0);
  const recent = projectEarningsAnalysis(
    { isPreview: false, data: [row, { ...row, fiscalPeriod: "Q2 FY2026" }] },
    request("recent"),
    now,
  );
  assert.equal(recent.rows.length, 2);
});
