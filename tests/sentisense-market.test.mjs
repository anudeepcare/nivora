import test from "node:test";
import assert from "node:assert/strict";
const api = await import("../lib/sentisense-market.ts").catch(() => ({}));
const now = Date.parse("2026-11-16T16:00:00Z");
const profile = {
  ticker: "NOW",
  name: "ServiceNow",
  currency: "usd",
  primaryExchange: "XNYS",
  country: "United States",
  kind: "STOCK",
};
const price = {
  ticker: "NOW",
  currentPrice: 102.25,
  previousClose: 100,
  changePercent: 2.25,
  timestamp: now,
  priceAsOf: now - 15 * 60000,
};
const bar = {
  timestamp: Date.parse("2026-11-13T21:00:00Z"),
  open: 100,
  high: 104,
  low: 99,
  close: 102,
  volume: 15,
  adjusted: true,
};
test("quote preserves documented delayed regular-session data and timestamp", () => {
  const result = api.normalizeSentiSenseMarketQuote(price, profile, "NOW", now);
  assert.equal(result.quote.price, 102.25);
  assert.equal(result.quote.asOf, new Date(price.priceAsOf).toISOString());
  assert.match(result.quote.session, /15-minute delayed/);
  assert.equal(result.quote.stale, false);
});
test("serve timestamp or undated extended quote cannot make a quote fresh", () => {
  const result = api.normalizeSentiSenseMarketQuote(
    {
      ...price,
      priceAsOf: undefined,
      extendedHours: { price: 150, session: "post" },
    },
    profile,
    "NOW",
    now,
  );
  assert.equal(result.quote.asOf, null);
  assert.equal(result.quote.stale, true);
  assert.equal(result.quote.price, 102.25);
});
test("frozen delisted prices, missing currency and wrong symbols are not current", () => {
  assert.equal(
    api.normalizeSentiSenseMarketQuote(
      { ...price, listingStatus: "DELISTED" },
      profile,
      "NOW",
      now,
    ).quote.stale,
    true,
  );
  assert.throws(() =>
    api.normalizeSentiSenseMarketQuote(
      price,
      { ...profile, currency: undefined },
      "NOW",
      now,
    ),
  );
  assert.throws(() =>
    api.normalizeSentiSenseMarketQuote(
      { ...price, ticker: "NBIS" },
      profile,
      "NOW",
      now,
    ),
  );
});
test("chart preserves OHLCV and labels native weekly granularity", () => {
  const result = api.normalizeSentiSenseChart([bar], "5Y", now);
  assert.equal(result.granularity, "weekly");
  assert.equal(result.adjustment, "split-adjusted");
  assert.deepEqual(result.candles[0], {
    time: "2026-11-13",
    open: 100,
    high: 104,
    low: 99,
    close: 102,
    volume: 15,
  });
});
test("chart rejects malformed or unadjusted bars rather than inventing prices", () => {
  assert.throws(() =>
    api.normalizeSentiSenseChart([{ ...bar, open: undefined }], "1Y", now),
  );
  assert.throws(() =>
    api.normalizeSentiSenseChart([{ ...bar, high: 98 }], "1Y", now),
  );
  assert.throws(() =>
    api.normalizeSentiSenseChart([{ ...bar, adjusted: false }], "1Y", now),
  );
  assert.throws(() =>
    api.normalizeSentiSenseChart(
      [{ ...bar, timestamp: now + 86400000 }],
      "1D",
      now,
    ),
  );
});
test("directory retains distinct share classes without inventing venue", () => {
  const result = api.normalizeSentiSenseDirectory([
    {
      ticker: "GOOGL",
      name: "Alphabet",
      shareClasses: [
        { ticker: "GOOGL", primary: true },
        { ticker: "GOOG", primary: false },
      ],
    },
  ]);
  assert.deepEqual(
    result.map((x) => x.symbol),
    ["GOOGL", "GOOG"],
  );
  assert.equal(result[0].exchange, "");
});
test("daily research history requests one-year daily instead of weekly five-year bars", async () => {
  const calls = [];
  const market = api.createSentiSenseMarket(
    async (path, params) => {
      calls.push([path, params]);
      return [bar];
    },
    () => now,
  );
  const value = await market.dailyResearchHistory("NOW");
  assert.equal(value.granularity, "daily");
  assert.equal(calls[0][1].timeframe, "1Y");
  await assert.rejects(() => market.quote("BTC/USD"));
  assert.equal(calls.length, 1);
});

test("MAX retains dividend basis and cannot be presented as daily history", () => {
  const result = api.normalizeSentiSenseChart([bar], "MAX", now);
  assert.equal(result.granularity, "monthly");
  assert.equal(result.adjustment, "split-and-dividend-adjusted");
});
test("intraday bars retain their timestamps, and conflicting duplicates fail", () => {
  assert.equal(
    api.normalizeSentiSenseChart([bar], "1D", now).candles[0].time,
    new Date(bar.timestamp).toISOString(),
  );
  assert.throws(() =>
    api.normalizeSentiSenseChart([bar, { ...bar, close: 101 }], "1Y", now),
  );
});
test("search supports single-letter symbols and separate share classes through directory", async () => {
  const calls = [];
  const market = api.createSentiSenseMarket(
    async (path) => {
      calls.push(path);
      if (path === "etfs")
        return [{ ticker: "QQQ", name: "Invesco QQQ Trust" }];
      return [
        { ticker: "F", name: "Ford" },
        {
          ticker: "GOOGL",
          name: "Alphabet",
          shareClasses: [{ ticker: "GOOG" }],
        },
      ];
    },
    () => now,
  );
  assert.equal((await market.search("F"))[0].symbol, "F");
  assert.equal((await market.search("GOOG"))[0].symbol, "GOOG");
  assert.equal((await market.search("QQQ"))[0].symbol, "QQQ");
  assert.deepEqual(calls, [
    "stocks/detailed",
    "etfs",
    "stocks/detailed",
    "etfs",
    "stocks/detailed",
    "etfs",
  ]);
});

test("MAX preserves documented 1999 history instead of rejecting the full series", () => {
  const timestamp = Date.parse("1999-12-01T00:00:00Z");
  const result = api.normalizeSentiSenseChart(
    [{ ...bar, timestamp }],
    "MAX",
    now,
  );
  assert.equal(result.candles[0].time, "1999-12-01");
  assert.equal(result.candles[0].close, bar.close);
  assert.equal(result.granularity, "monthly");
  assert.equal(result.adjustment, "split-and-dividend-adjusted");
});

test("ETF profiles accept documented named US etfExchange without inventing missing listing facts", () => {
  const fund = {
    ...profile,
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    kind: "ETF",
    primaryExchange: undefined,
    etfExchange: "NASDAQ",
  };
  assert.equal(api.normalizeSentiSenseCompany(fund, "QQQ").exchange, "NASDAQ");
  assert.equal(
    api.normalizeSentiSenseCompany({ ...fund, etfExchange: "NYSE Arca" }, "QQQ")
      .exchange,
    "NYSE ARCA",
  );
  assert.equal(
    api.normalizeSentiSenseCompany({ ...fund, etfExchange: "Cboe BZX" }, "QQQ")
      .exchange,
    "CBOE",
  );
  for (const override of [
    { ticker: "SPY" },
    { currency: undefined },
    { country: undefined },
    { etfExchange: "London" },
    { etfExchange: undefined },
    { kind: "STOCK" },
    { primaryExchange: "XLON" },
  ]) {
    assert.throws(() =>
      api.normalizeSentiSenseCompany({ ...fund, ...override }, "QQQ"),
    );
  }
});
