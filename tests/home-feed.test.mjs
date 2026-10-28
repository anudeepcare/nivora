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

test("Home news decodes publisher text and gives each followed company a first headline", () => {
  const result = m.newsHighlights(
    [
      {
        symbol: "HIMS",
        items: [
          {
            date: "2026-10-18T10:00:00Z",
            title: "Hims &amp; Hers",
            url: "https://example.com/a",
          },
          {
            date: "2026-10-18T09:00:00Z",
            title: "Second",
            url: "https://example.com/b",
          },
        ],
      },
      {
        symbol: "NOW",
        items: [
          {
            date: "2026-10-17T10:00:00Z",
            title: "ServiceNow update",
            url: "https://example.com/c",
          },
        ],
      },
    ],
    "2026-10-18T12:00:00Z",
  );
  assert.equal(result[0].title, "Hims & Hers");
  assert.equal(result[1].symbol, "NOW");
  assert.equal(result[2].symbol, "HIMS");
});

test("Home headline selection prioritizes company identity and covers different holdings before repeats", () => {
  assert.equal(typeof m.relevantHoldingHeadlines, "function");
  const row = (symbol, title, i) => ({
    symbol,
    title,
    date: "2026-10-22",
    url: `https://example.com/${i}`,
  });
  const rows = [
    row("NOW", "NowVertical Group raises capital", 1),
    row("NOW", "Primis Financial reports results", 2),
    row("NOW", "ServiceNow (NOW) reports earnings", 3),
    row("NOW", "ServiceNow launches a product", 4),
    row("HIMS", "Hims & Hers expands care", 5),
    row("ZETA", "Zeta Global wins contract", 6),
  ];
  const ranked = m.relevantHoldingHeadlines(
    rows,
    {
      NOW: "ServiceNow Inc",
      HIMS: "Hims & Hers Health Inc",
      ZETA: "Zeta Global Holdings Corp",
    },
    new Map([
      ["NOW", 200],
      ["HIMS", 100],
      ["ZETA", 50],
    ]),
  );
  assert.deepEqual(
    ranked.map((x) => x.url),
    [3, 5, 6, 4].map((i) => `https://example.com/${i}`),
  );
  assert.equal(
    m.relevantHoldingHeadlines(
      [row("SAP", "SAP updates outlook", 7)],
      { SAP: "SAP SE ADR" },
      new Map(),
    ).length,
    1,
  );
});

test("Home covers every followed stock in sequential API batches of at most thirty", async () => {
  assert.equal(typeof m.loadHomeFeed, "function");
  const symbols = Array.from({ length: 67 }, (_, i) => `STK${i}`);
  const calls = [];
  let active = 0,
    peak = 0;
  const result = await m.loadHomeFeed(
    [...symbols, "STK0", "BTC/USD"],
    async (batch) => {
      active++;
      peak = Math.max(peak, active);
      calls.push([...batch]);
      await Promise.resolve();
      active--;
      return {
        events: batch.map((symbol) => ({
          symbol,
          date: "2026-10-27",
          kind: "Earnings",
          detail: "After market close",
        })),
        news: [],
        issues: [],
        retrievedAt: "2026-10-27T12:00:00Z",
        followed: batch.length,
        newsFollowed: batch.length,
        eventsReady: true,
        newsReady: true,
      };
    },
  );
  assert.deepEqual(
    calls.map((x) => x.length),
    [30, 30, 7],
  );
  assert.deepEqual(calls.flat(), symbols);
  assert.equal(peak, 1);
  assert.equal(result.events.length, 67);
  assert.equal(result.followed, 67);
  assert.equal(result.newsFollowed, 67);
});

test("Home retains successful batches and distinguishes a failed source from an empty one", async () => {
  assert.equal(typeof m.loadHomeFeed, "function");
  const symbols = Array.from({ length: 32 }, (_, i) => `STK${i}`);
  const result = await m.loadHomeFeed(symbols, async (batch) => {
    if (batch[0] === "STK0") throw new Error("Provider unavailable");
    return {
      events: [
        {
          symbol: "STK31",
          date: "2026-10-27",
          kind: "Earnings",
          detail: "After market close",
        },
      ],
      news: [],
      issues: ["Some news coverage is temporarily unavailable."],
      retrievedAt: "2026-10-27T12:00:00Z",
      followed: 2,
      newsFollowed: 1,
      eventsReady: true,
      newsReady: false,
    };
  });
  assert.equal(result.events.length, 1);
  assert.equal(result.eventsReady, false);
  assert.equal(result.newsReady, false);
  assert.equal(result.followed, 2);
  assert.ok(result.issues.length);
  const empty = await m.loadHomeFeed(["NOW"], async () => ({
    events: [],
    news: [],
    issues: [],
    retrievedAt: "2026-10-27T12:00:00Z",
    followed: 1,
    newsFollowed: 1,
    eventsReady: true,
    newsReady: true,
  }));
  assert.equal(empty.newsReady, true);
  assert.equal(empty.eventsReady, true);
  assert.equal(empty.news.length, 0);
});

test("News failure does not erase successful calendar coverage", () => {
  assert.equal(typeof m.homeFeedReadiness, "function");
  assert.deepEqual(
    m.homeFeedReadiness({
      issues: ["Some news coverage is temporarily unavailable."],
    }),
    { eventsReady: true, newsReady: false },
  );
  assert.deepEqual(
    m.homeFeedReadiness({
      issues: ["Some scheduled events could not be checked."],
    }),
    { eventsReady: false, newsReady: true },
  );
  assert.deepEqual(
    m.homeFeedReadiness({ issues: ["Company updates are not connected."] }),
    { eventsReady: false, newsReady: false },
  );
});

test("Provider news work is bounded and individual failures preserve successful results", async () => {
  assert.equal(typeof m.settledFeedMap, "function");
  let active = 0,
    peak = 0;
  const results = await m.settledFeedMap(
    ["A", "B", "C", "D", "E"],
    async (symbol) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      if (symbol === "C") throw new Error("unavailable");
      return symbol;
    },
    2,
  );
  assert.equal(peak, 2);
  assert.deepEqual(
    results.map((x) => x.status),
    ["fulfilled", "fulfilled", "rejected", "fulfilled", "fulfilled"],
  );
  assert.equal(results[4].value, "E");
});

test("Same-day earnings retain every company and its market session in one date group", () => {
  assert.equal(typeof m.groupMarketEvents, "function");
  const groups = m.groupMarketEvents([
    {
      symbol: "NOW",
      date: "2026-10-28",
      kind: "Earnings",
      detail: "After market close",
    },
    {
      symbol: "SOFI",
      date: "2026-10-27",
      kind: "Earnings",
      detail: "Before market open",
    },
    {
      symbol: "HIMS",
      date: "2026-10-27",
      kind: "Earnings",
      detail: "After market close",
    },
  ]);
  assert.deepEqual(
    groups.map((x) => x.date),
    ["2026-10-27", "2026-10-28"],
  );
  assert.deepEqual(
    groups[0].events.map((x) => [x.symbol, x.detail]),
    [
      ["SOFI", "Before market open"],
      ["HIMS", "After market close"],
    ],
  );
});

test("Home calendar maps provider share-class aliases back to the followed symbol", () => {
  const events = m.calendarHighlights(
    {
      earnings: [
        {
          code: "BRK-B.US",
          report_date: "2026-10-30",
          before_after_market: "BeforeMarket",
        },
      ],
    },
    {
      splits: [
        {
          code: "BRK-B.US",
          split_date: "2026-10-31",
          old_shares: 1,
          new_shares: 2,
        },
      ],
    },
    ["BRK.B"],
    "2026-10-27",
    "2026-11-26",
  );
  assert.deepEqual(
    events.map(({ symbol, kind, detail }) => ({ symbol, kind, detail })),
    [
      { symbol: "BRK.B", kind: "Earnings", detail: "Before market open" },
      { symbol: "BRK.B", kind: "Stock split", detail: "2 for 1 shares" },
    ],
  );
  const reverse = m.calendarHighlights(
    { earnings: [{ code: "BRK.B.US", report_date: "2026-10-30" }] },
    null,
    ["BRK-B"],
    "2026-10-27",
    "2026-11-26",
  );
  assert.equal(reverse[0]?.symbol, "BRK-B");
});

test("Home calendar never joins a foreign exchange suffix to a US share-class alias", () => {
  const source = {
    earnings: [
      { code: "ABC-L.US", report_date: "2026-10-30" },
      { code: "ABC.L", report_date: "2026-10-31" },
    ],
  };
  const foreign = m.calendarHighlights(
    source,
    null,
    ["ABC.L"],
    "2026-10-27",
    "2026-11-26",
  );
  assert.deepEqual(
    foreign.map(({ symbol, date }) => ({ symbol, date })),
    [{ symbol: "ABC.L", date: "2026-10-31" }],
  );
  const domestic = m.calendarHighlights(
    source,
    null,
    ["ABC-L"],
    "2026-10-27",
    "2026-11-26",
  );
  assert.deepEqual(
    domestic.map(({ symbol, date }) => ({ symbol, date })),
    [{ symbol: "ABC-L", date: "2026-10-30" }],
  );
});

test("Home batch aggregation retains early evidence when a later batch is partial or rejected", async () => {
  const symbols = Array.from({ length: 32 }, (_, index) => `STK${index}`);
  const earlyEvent = {
    symbol: "STK0",
    date: "2026-10-30",
    kind: "Earnings",
    detail: "Before market open",
  };
  const earlyNews = {
    symbol: "STK0",
    date: "2026-10-27",
    title: "STK0 results",
    url: "https://example.com/early",
  };
  for (const later of ["news-failure", "request-failure"]) {
    const feed = await m.loadHomeFeed(symbols, async (batch) => {
      if (batch[0] === "STK0")
        return {
          events: [earlyEvent],
          news: [earlyNews],
          issues: [],
          retrievedAt: "2026-10-27T12:00:00Z",
          followed: 30,
          newsFollowed: 30,
          eventsReady: true,
          newsReady: true,
        };
      if (later === "request-failure") throw new Error("Provider unavailable");
      return {
        events: [],
        news: [],
        issues: ["Some news coverage is temporarily unavailable."],
        retrievedAt: "2026-10-27T12:01:00Z",
        followed: 2,
        newsFollowed: 1,
        eventsReady: true,
        newsReady: false,
      };
    });
    assert.deepEqual(feed.events, [earlyEvent], later);
    assert.deepEqual(feed.news, [earlyNews], later);
    assert.equal(feed.eventsReady, later === "news-failure", later);
    assert.equal(feed.newsReady, false, later);
    assert.equal(feed.retrievedAt, "2026-10-27T12:00:00Z", later);
    assert.equal(feed.followed, later === "news-failure" ? 32 : 30, later);
    assert.equal(feed.newsFollowed, later === "news-failure" ? 31 : 30, later);
    assert.ok(feed.issues.length, later);
  }
});
