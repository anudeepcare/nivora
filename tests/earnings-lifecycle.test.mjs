import test from "node:test";
import assert from "node:assert/strict";
import * as feed from "../lib/home-feed.ts";
import { homeBrief } from "../lib/home-brief.ts";
import { portfolioRiskSummary } from "../lib/product-attention.ts";
import { evaluateAlert } from "../lib/alert-policy.ts";
const base = {
  today: "2026-10-27",
  symbols: ["SOFI", "NOW", "APP"],
  names: { SOFI: "SoFi", NOW: "ServiceNow", APP: "AppLovin" },
  events: [],
  headlines: [],
  exposure: new Map(),
  eventsReady: true,
  newsReady: true,
};
const event = (symbol, actual, date = "2026-10-27") => ({
  symbol,
  date,
  kind: "Earnings",
  detail: "Before market open",
  actual,
});
test("calendar preserves reported zero and negative EPS, and never converts blanks to results", () => {
  const rows = [0, -0.2, "0.18", null, "", false, "unknown"].map(
    (actual, i) => ({
      code: `STK${i}.US`,
      report_date: "2026-10-27",
      actual,
      estimate: 0.15,
    }),
  );
  const events = feed.calendarHighlights(
    { earnings: rows },
    null,
    rows.map((_, i) => `STK${i}`),
    "2026-10-27",
    "2026-11-03",
  );
  assert.deepEqual(
    events.map((e) => e.actual),
    [0, -0.2, 0.18, null, null, null, null],
  );
});
test("earnings status needs a reported actual, not a morning slot or elapsed clock", () => {
  assert.equal(typeof feed.earningsEventState, "function");
  assert.equal(
    feed.earningsEventState(event("SOFI", 0), base.today).status,
    "reported",
  );
  assert.equal(
    feed.earningsEventState(event("SOFI", null), base.today).status,
    "today",
  );
  assert.equal(
    feed.earningsEventState(event("SOFI", 0, "2026-10-28"), base.today).status,
    "upcoming",
  );
  assert.equal(
    feed.earningsEventState(event("SOFI", null, "2026-10-26"), base.today)
      .status,
    "unconfirmed",
  );
});
test("Home does not tell a user to prepare before already released results", () => {
  const brief = homeBrief({ ...base, events: [event("SOFI", 0.18)] });
  assert.doesNotMatch(
    `${brief.kicker} ${brief.title} ${brief.detail} ${brief.action}`,
    /ahead|before results|prepare/i,
  );
  assert.match(
    `${brief.kicker} ${brief.title} ${brief.detail}`,
    /reported|released|results/i,
  );
});
test("same-day Home briefing represents every company with its own release state", () => {
  const brief = homeBrief({
    ...base,
    events: [
      event("SOFI", 0.18),
      event("NOW", null),
      event("APP", null, "2026-10-29"),
    ],
  });
  assert.equal(brief.earnings.length, 2);
  assert.deepEqual(brief.earnings.map((e) => e.symbol).sort(), ["NOW", "SOFI"]);
  assert.match(brief.detail, /1 reported/);
  assert.match(brief.detail, /1 awaiting/);
  assert.doesNotMatch(brief.detail, /before results arrive/);
  assert.equal(brief.checkpoints.length, 3);
});
test("US calendar date stays on the release day after UTC midnight", () => {
  assert.equal(typeof feed.marketDay, "function");
  assert.equal(feed.marketDay("2026-10-28T01:00:00Z"), "2026-10-27");
  assert.equal(feed.marketDay("2026-11-04T04:30:00Z"), "2026-11-03");
  assert.equal(feed.marketDay("2026-10-28"), "2026-10-28");
});
test("reported earnings leave upcoming portfolio exposure and approaching alerts", () => {
  const positions = [
      {
        symbol: "SOFI",
        assetType: "stock",
        currency: "USD",
        quantity: 10,
        cost: 10,
      },
    ],
    quotes = { SOFI: { price: 10, currency: "USD" } };
  assert.equal(
    portfolioRiskSummary(positions, quotes, [event("SOFI", 0)], base.today)
      .earningsValue,
    0,
  );
  const rule = {
    symbol: "SOFI",
    type: "earnings-soon",
    enabled: true,
    threshold: 7,
  };
  const r = evaluateAlert(
    rule,
    {
      asOf: "2026-10-27T19:00:00Z",
      earnings: [{ date: "2026-10-27", actual: 0 }],
      snapshotId: "s",
      price: 10,
      stale: false,
      monthly: 2,
      month: "2026-09",
      filings: [],
    },
    "2026-01-01",
  );
  assert.equal(r, null);
});
