import test from "node:test";
import assert from "node:assert/strict";
const m = await import("../lib/home-brief.ts").catch(() => ({}));
const input = {
  today: "2026-10-23",
  symbols: ["SOFI", "NOW"],
  names: { SOFI: "SoFi", NOW: "ServiceNow" },
  events: [],
  headlines: [],
  exposure: new Map([
    ["SOFI", 100],
    ["NOW", 300],
  ]),
  eventsReady: true,
  newsReady: true,
};
test("Home hero uses held upcoming earnings and never expired or unrelated events", () => {
  assert.equal(typeof m.homeBrief, "function");
  const r = m.homeBrief({
    ...input,
    events: [
      { symbol: "SOFI", date: "2026-10-27", kind: "Earnings" },
      { symbol: "OTHER", date: "2026-10-24", kind: "Earnings" },
      { symbol: "NOW", date: "2026-10-22", kind: "Earnings" },
    ],
  });
  assert.equal(r.kind, "earnings");
  assert.equal(r.symbol, "SOFI");
  assert.equal(r.checkpoints.length, 1);
  assert.match(r.detail, /Oct/);
});
test("Home news fallback requires recent dated source and never infers materiality from a headline", () => {
  assert.equal(typeof m.homeBrief, "function");
  const r = m.homeBrief({
    ...input,
    headlines: [
      {
        symbol: "NOW",
        date: "2026-10-22",
        title: "ServiceNow reports results",
        url: "https://example.com/news",
      },
    ],
  });
  assert.equal(r.kind, "news");
  assert.equal(r.title, "A company update to put in context.");
  assert.equal(r.symbol, "NOW");
  assert.match(r.detail, /ServiceNow reports/);
  assert.equal(
    m.homeBrief({
      ...input,
      headlines: [
        {
          symbol: "NOW",
          date: "2027-01-01",
          title: "future",
          url: "https://example.com",
        },
      ],
    }).kind,
    "review",
  );
});
test("quiet Home distinguishes unavailable evidence from no returned checkpoints and keeps daily perspective stable", () => {
  assert.equal(typeof m.homeBrief, "function");
  const quiet = m.homeBrief(input),
    missing = m.homeBrief({ ...input, eventsReady: false, newsReady: false });
  assert.equal(quiet.kind, "review");
  assert.match(quiet.status, /No dated events returned/);
  assert.match(missing.status, /could not be checked/);
  assert.equal(quiet.symbol, "NOW");
  assert.equal(
    m.homeBrief({ ...input, symbols: [], exposure: new Map() }).kind,
    "start",
  );
  assert.equal(typeof m.dailyPerspective, "function");
  assert.equal(
    m.dailyPerspective(input.today),
    m.dailyPerspective(input.today),
  );
});

test("Home never reports no events when dated checkpoints exist", () => {
  const events = [
    {
      symbol: "SOFI",
      date: "2026-10-27",
      kind: "Earnings",
      detail: "Before market open",
    },
    {
      symbol: "NOW",
      date: "2026-10-27",
      kind: "Earnings",
      detail: "After market close",
    },
  ];
  const ready = m.homeBrief({ ...input, events });
  assert.doesNotMatch(ready.status, /No dated events/);
  assert.match(ready.status, /2.*checkpoint/);
  assert.equal(ready.checkpoints.length, 2);
  const partial = m.homeBrief({ ...input, events, eventsReady: false });
  assert.match(partial.status, /2.*checkpoint/);
  assert.match(partial.status, /could not be checked/);
});

test("A quiet watchlist-only briefing does not imply the user owns positions", () => {
  const brief = m.homeBrief({
    ...input,
    exposure: new Map(),
    hasHoldings: false,
  });
  assert.doesNotMatch(
    `${brief.title} ${brief.detail} ${brief.action}`,
    /what you own|concentration|my holdings/i,
  );
  assert.match(brief.action, /watchlist/i);
});
