import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtureProviders,
  marketResponse,
  bar,
  sourceModule,
} from "./helpers/provider-fixture.mjs";
const originalFetch = globalThis.fetch;
test.after(() => {
  globalThis.fetch = originalFetch;
});

test("EODHD class-share aliases preserve instrument identity and prices", async () => {
  const p = fixtureProviders(marketResponse);
  const r = await p.research("BRK-B");
  assert.equal(r.quote.price, 102);
  assert.equal(r.company.symbol, "BRK-B");
  assert.equal(r.history.length, 1);
  assert.match(r.quote.source, /EODHD/);
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("EODHD reporting currency remains distinct from USD share-price currency", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/fundamentals/")
      ? Response.json({
          General: {
            Code: "SAP",
            Name: "SAP SE",
            Exchange: "NYSE",
            CurrencyCode: "USD",
            CountryISO: "DE",
          },
          Financials: {
            Income_Statement: {
              currency_symbol: "EUR",
              quarterly: {
                a: {
                  date: "2026-06-30",
                  filing_date: "2026-08-01",
                  totalRevenue: 1000,
                },
              },
            },
          },
        })
      : marketResponse(u),
  );
  const r = await p.research("SAP");
  assert.equal(r.quote.currency, "USD");
  assert.equal(r.facts[0]?.currency, "EUR");
  assert.equal(r.facts[0]?.filed, "2026-08-01");
  assert.ok(r.facts.every((f) => f.sourceUrl.includes("eodhd.com")));
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("ETF missing corporate facts retains identity, price and limited history with explicit coverage", async () => {
  const p = fixtureProviders(marketResponse);
  const r = await p.research("SPY");
  assert.equal(r.company.name, "Verified SPY");
  assert.equal(r.quote.price, 102);
  assert.equal(r.history.length, 1);
  assert.deepEqual(r.facts, []);
  assert.equal(r.coverage.fundamentals.status, "unavailable");
  assert.match(r.issues.join(" "), /financial|coverage/i);
});

test("malformed and unsupported symbols are rejected before any provider traffic", async () => {
  const p = fixtureProviders(marketResponse);
  for (const symbol of ["BAD?", "A..B", "../MSFT", "A--B"])
    await assert.rejects(p.research(symbol), (e) => e.status === 400);
  await assert.rejects(p.research("ETH/EUR"), (e) => e.status === 422);
  assert.equal(p.calls.length, 0);
});

test("excluded foreign-currency Twelve data cannot contaminate research", async () => {
  const p = fixtureProviders(
    (u) =>
      u.pathname === "/time_series"
        ? Response.json({
            meta: { symbol: "SAP", currency: "EUR", exchange: "XETR" },
            values: [bar],
          })
        : marketResponse(u),
    { eodhd: false },
  );
  const r = await p.research("SAP");
  assert.equal(r.quote.price, null);
  assert.deepEqual(r.history, []);
  assert.notEqual(r.coverage.quote.status, "available");
  assert.equal(p.calls.length, 0);
});

test("malformed EODHD fundamentals stay retryable and recover without excluded sources", async () => {
  let broken = true;
  const p = fixtureProviders((u) =>
    u.pathname.includes("/fundamentals/")
      ? Response.json(
          broken
            ? {}
            : {
                General: {
                  Code: "IPO",
                  Name: "New Public Company",
                  Exchange: "NYSE",
                  CurrencyCode: "USD",
                },
                Financials: {
                  Income_Statement: {
                    currency_symbol: "USD",
                    quarterly: {
                      a: {
                        date: "2026-03-31",
                        filing_date: "2026-05-01",
                        totalRevenue: 20,
                      },
                    },
                  },
                },
              },
        )
      : marketResponse(u),
  );
  const first = await p.research("IPO");
  assert.equal(first.history.length, 1);
  assert.equal(first.coverage.fundamentals.status, "unavailable");
  broken = false;
  const next = await p.research("IPO");
  assert.equal(next.facts.find((f) => f.metric === "revenue")?.value, 20);
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("expired last-good prices and history survive total outage with original dates and cached provenance", async () => {
  const realNow = Date.now;
  let now = realNow(),
    offline = false;
  Date.now = () => now;
  try {
    const p = fixtureProviders(
      (u) => (offline ? new Response("", { status: 503 }) : marketResponse(u)),
      { twelve: false },
    );
    const first = await p.research("CACHE");
    offline = true;
    now += 16 * 60 * 1000;
    const r = await p.research("CACHE");
    assert.equal(r.quote.price, first.quote.price);
    assert.equal(r.quote.asOf, first.quote.asOf);
    assert.equal(r.quote.stale, true);
    assert.match(r.quote.source, /cached/i);
    assert.deepEqual(r.history, first.history);
    assert.match(r.historySource, /cached/i);
  } finally {
    Date.now = realNow;
  }
});

for (const failure of ["timeout", "429", "empty", "invalid-json"])
  test(`primary ${failure} response reports missing data without excluded fallback`, async () => {
    const p = fixtureProviders((u) => {
      if (u.hostname === "eodhd.com") {
        if (failure === "timeout")
          throw new DOMException("Timed out", "TimeoutError");
        if (failure === "429") return new Response("", { status: 429 });
        if (failure === "invalid-json")
          return new Response("<html>unavailable</html>", { status: 200 });
        return Response.json({});
      }
      return marketResponse(u);
    });
    const r = await p.research("OUTAGE");
    assert.equal(r.quote.price, null);
    assert.equal(r.history.length, 0);
    assert.notEqual(r.coverage.quote.status, "available");
    assert.ok(r.issues.length > 0);
    assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
  });

test("crypto aliases keep the requested asset identity and never request corporate financials", async () => {
  const p = fixtureProviders(marketResponse);
  const r = await p.research("ETH-USD");
  assert.equal(r.company.symbol, "ETH/USD");
  assert.equal(r.company.assetType, "crypto");
  assert.equal(r.quote.currency, "USD");
  assert.equal(
    p.calls.some((u) =>
      /fundamentals|company_tickers|companyfacts/.test(u.pathname),
    ),
    false,
  );
});

test("EODHD search deduplicates class-share aliases without foreign listing contamination", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/search/")
      ? Response.json([
          {
            Code: "BRK-B",
            Name: "Berkshire Class B",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock",
          },
          {
            Code: "BRK.B",
            Name: "Berkshire Class B",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock",
          },
          {
            Code: "BRK-B",
            Name: "Wrong listing",
            Exchange: "XETRA",
            Currency: "EUR",
            Type: "Common Stock",
          },
        ])
      : marketResponse(u),
  );
  const rows = await p.search("brk.b");
  assert.equal(rows.length, 1);
  assert.ok(["BRK.B", "BRK-B"].includes(rows[0].symbol));
  assert.equal(rows[0].currency, "USD");
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("documented unknown symbols differ from temporary provider outages", async () => {
  const p = fixtureProviders((u) =>
    u.hostname === "eodhd.com"
      ? new Response("", { status: 404 })
      : u.hostname === "api.twelvedata.com"
        ? Response.json({
            status: "error",
            code: 404,
            message: "Symbol not found",
          })
        : marketResponse(u),
  );
  await assert.rejects(p.research("UNKNOWN"), (e) => e.status === 404);
});

test("invalid primary payloads do not poison the cache after provider recovery", async () => {
  let broken = true;
  const p = fixtureProviders(
    (u) =>
      broken && u.hostname === "eodhd.com"
        ? Response.json({})
        : marketResponse(u),
    { twelve: false },
  );
  const first = await p.research("RECOVERY");
  assert.equal(first.quote.price, null);
  broken = false;
  const next = await p.research("RECOVERY");
  assert.equal(next.quote.price, 102);
  assert.equal(next.history.length, 1);
});

test("cached fallback expires at its original bounded horizon despite repeated refreshes", async () => {
  const realNow = Date.now;
  let now = realNow(),
    offline = false;
  Date.now = () => now;
  try {
    const p = fixtureProviders(
      (u) => (offline ? new Response("", { status: 503 }) : marketResponse(u)),
      { twelve: false },
    );
    await p.quote("LIMIT");
    offline = true;
    now += 16 * 60 * 1000;
    assert.equal((await p.quote("LIMIT")).quote.price, 102);
    now += 25 * 60 * 60 * 1000;
    await assert.rejects(p.quote("LIMIT"));
  } finally {
    Date.now = realNow;
  }
});

test("EODHD crypto quote rejects explicit currency contradicting the requested pair", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/real-time/")
      ? Response.json({
          code: "ETH-USD.CC",
          currency: "EUR",
          close: 200,
          timestamp: Math.floor(Date.now() / 1000),
        })
      : marketResponse(u),
  );
  const r = await p.research("ETH/USD");
  assert.equal(r.quote.price, null);
  assert.match(r.issues.join(" "), /unavailable|currency/i);
});

test("future-dated quote is not retained as the only price when backup is unavailable", async () => {
  const p = fixtureProviders(
    (u) =>
      u.pathname.includes("/real-time/")
        ? Response.json({
            code: "FUTURE.US",
            close: 102,
            timestamp: Math.floor(Date.now() / 1000) + 3600,
          })
        : marketResponse(u),
    { twelve: false },
  );
  const r = await p.research("FUTURE");
  assert.equal(r.quote.price, null);
  assert.equal(r.history.length, 1);
});

test("EODHD class-share profile preserves verified issuer identity when quote is offline", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/real-time/")
      ? new Response("", { status: 503 })
      : u.pathname.includes("/fundamentals/")
        ? Response.json({
            General: {
              Code: "BRK-B",
              Name: "Berkshire Hathaway Class B",
              CurrencyCode: "USD",
              Exchange: "NYSE",
            },
          })
        : marketResponse(u),
  );
  const r = await p.research("BRK-B");
  assert.equal(r.company.name, "Berkshire Hathaway Class B");
  assert.equal(r.quote.price, null);
  assert.equal(r.history.length, 1);
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("a cached fallback cannot outlive its retention deadline inside a refresh TTL", async () => {
  const realNow = Date.now;
  let now = realNow(),
    offline = false;
  Date.now = () => now;
  try {
    const p = fixtureProviders(
      (u) => (offline ? new Response("", { status: 503 }) : marketResponse(u)),
      { twelve: false },
    );
    await p.quote("BOUNDARY");
    offline = true;
    now += 86400000 + 30000;
    assert.equal((await p.quote("BOUNDARY")).quote.price, 102);
    now += 31000;
    await assert.rejects(p.quote("BOUNDARY"));
  } finally {
    Date.now = realNow;
  }
});

test("valid EODHD identity with zero financial observations discloses missing coverage", async () => {
  const p = fixtureProviders(marketResponse);
  const r = await p.research("EMPTY");
  assert.equal(r.company.name, "Verified EMPTY");
  assert.equal(r.quote.price, 102);
  assert.deepEqual(r.facts, []);
  assert.equal(r.coverage.fundamentals.status, "unavailable");
  assert.match(r.issues.join(" "), /financial|coverage/i);
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("invalid primary price rows are retried after recovery instead of cached as a successful dataset", async () => {
  let broken = true;
  const p = fixtureProviders(
    (u) =>
      broken && u.pathname.includes("/eod/")
        ? Response.json([{ date: "2026-10-23", close: "bad" }])
        : marketResponse(u),
    { twelve: false },
  );
  assert.deepEqual((await p.research("ROW")).history, []);
  broken = false;
  assert.equal((await p.research("ROW")).history.length, 1);
});

test("chart route classifies malformed symbols before provider requests", async (t) => {
  const previousAccess = process.env.AURYN_ACCESS_ENABLED;
  process.env.AURYN_ACCESS_ENABLED = "false";
  t.after(() => {
    if (previousAccess === undefined) delete process.env.AURYN_ACCESS_ENABLED;
    else process.env.AURYN_ACCESS_ENABLED = previousAccess;
  });
  const p = fixtureProviders((u) =>
    u.pathname === "/auth/v1/user"
      ? Response.json({
          id: "00000000-0000-4000-8000-000000000001",
          email_confirmed_at: "2026-01-01",
        })
      : marketResponse(u),
  );
  const { sourceModule } = await import("./helpers/provider-fixture.mjs");
  const chart = sourceModule("app/api/chart/[symbol]/route.ts");
  const r = await chart.GET(
    new Request("https://test.invalid/api/chart/BAD?range=1Y", {
      headers: { Authorization: "Bearer fixture" },
    }),
    { params: Promise.resolve({ symbol: "BAD?" }) },
  );
  assert.equal(r.status, 400);
  assert.equal(
    p.calls.some(
      (u) => u.hostname === "eodhd.com" || u.hostname === "api.twelvedata.com",
    ),
    false,
  );
});

test("a primary outage plus fallback not-found stays partial instead of declaring an invalid symbol", async () => {
  const p = fixtureProviders((u) =>
    u.hostname === "eodhd.com"
      ? new Response("", { status: 503 })
      : u.hostname === "api.twelvedata.com"
        ? Response.json({
            status: "error",
            code: 404,
            message: "Symbol not found",
          })
        : marketResponse(u),
  );
  const r = await p.research("UNCERTAIN");
  assert.equal(r.company.symbol, "UNCERTAIN");
  assert.equal(r.quote.price, null);
  assert.match(r.issues.join(" "), /unavailable|could not return/i);
  assert.ok(p.calls.every((u) => u.hostname === "eodhd.com"));
});

test("EODHD quote rejects each explicit non-USD currency field before normalization", () => {
  const { normalizeEodQuote } = sourceModule("lib/eodhd-normalize.ts");
  for (const field of ["currency", "currency_code", "CurrencyCode"]) {
    assert.throws(
      () =>
        normalizeEodQuote("ETH/USD", {
          code: "ETH-USD.CC",
          [field]: "EUR",
          close: 200,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      /currency/i,
    );
  }
});
