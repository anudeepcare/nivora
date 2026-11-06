import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtureProviders,
  marketResponse,
  bar,
} from "./helpers/provider-fixture.mjs";
const originalFetch = globalThis.fetch;
test.after(() => {
  globalThis.fetch = originalFetch;
});

test("class-share fallback accepts equivalent Twelve quote and history identities", async () => {
  const p = fixtureProviders((u) => {
    if (u.hostname === "eodhd.com") return new Response("", { status: 503 });
    if (u.pathname === "/quote")
      return Response.json({
        symbol: "BRK.B",
        name: "Berkshire Hathaway Class B",
        exchange: "NYSE",
        currency: "USD",
        close: 400,
        timestamp: Math.floor(Date.now() / 1000),
      });
    if (u.pathname === "/time_series")
      return Response.json({
        meta: { symbol: "BRK.B", currency: "USD", exchange: "NYSE" },
        values: [bar],
      });
    return marketResponse(u);
  });
  const r = await p.research("BRK-B");
  assert.equal(r.quote.price, 400);
  assert.equal(r.company.symbol, "BRK-B");
  assert.equal(r.history.length, 1);
  assert.match(r.quote.source, /Twelve Data.*fallback/);
});

test("a primary profile without financial statements uses SEC facts and preserves reporting currency", async () => {
  const p = fixtureProviders((u) => {
    if (u.pathname.endsWith("company_tickers.json"))
      return Response.json({
        0: { ticker: "SAP", cik_str: 1000184, title: "SAP SE" },
      });
    if (u.pathname.includes("companyfacts"))
      return Response.json({
        entityName: "SAP SE",
        facts: {
          "ifrs-full": {
            Revenue: {
              units: {
                EUR: [
                  {
                    val: 1000,
                    start: "2025-01-01",
                    end: "2025-12-31",
                    filed: "2026-02-01",
                    form: "20-F",
                    accn: "0001000184-26-000001",
                  },
                ],
              },
            },
          },
        },
      });
    if (u.pathname.includes("/submissions/"))
      return Response.json({ filings: { recent: { form: [] } } });
    return marketResponse(u);
  });
  const r = await p.research("SAP");
  assert.equal(r.quote.currency, "USD");
  assert.equal(r.facts[0]?.currency, "EUR");
  assert.equal(r.facts[0]?.basis, "IFRS");
  assert.equal(r.facts[0]?.filed, "2026-02-01");
  assert.match(r.facts[0]?.sourceUrl, /sec.gov/);
  assert.match(r.issues.join(" "), /SEC|fallback/);
});

test("ETF missing corporate facts retains identity, price and limited history with explicit coverage", async () => {
  const p = fixtureProviders(marketResponse);
  const r = await p.research("SPY");
  assert.equal(r.company.name, "Verified SPY");
  assert.equal(r.quote.price, 102);
  assert.equal(r.history.length, 1);
  assert.deepEqual(r.facts, []);
  assert.match(r.issues.join(" "), /financial|coverage/i);
});

test("malformed and unsupported symbols are rejected before any provider traffic", async () => {
  const p = fixtureProviders(marketResponse);
  for (const symbol of ["BAD?", "A..B", "../MSFT", "A--B"])
    await assert.rejects(p.research(symbol), (e) => e.status === 400);
  await assert.rejects(p.research("ETH/EUR"), (e) => e.status === 422);
  assert.equal(p.calls.length, 0);
});

test("foreign-currency Twelve history cannot contaminate USD research", async () => {
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
  assert.equal(r.quote.price, 103);
  assert.deepEqual(r.history, []);
  assert.match(r.issues.join(" "), /currency|listing/i);
});

test("invalid empty SEC responses remain retryable and disclose missing coverage", async () => {
  let broken = true;
  const p = fixtureProviders(
    (u) => {
      if (u.pathname.endsWith("company_tickers.json"))
        return Response.json({
          0: { ticker: "IPO", cik_str: 123, title: "New Public Company" },
        });
      if (u.pathname.includes("companyfacts"))
        return Response.json(
          broken
            ? {}
            : {
                entityName: "New Public Company",
                facts: {
                  "us-gaap": {
                    Revenues: {
                      units: {
                        USD: [
                          {
                            val: 20,
                            start: "2026-01-01",
                            end: "2026-03-31",
                            filed: "2026-05-01",
                            form: "10-Q",
                            accn: "0000000123-26-000001",
                          },
                        ],
                      },
                    },
                  },
                },
              },
        );
      if (u.pathname.includes("/submissions/"))
        return Response.json(
          broken ? {} : { filings: { recent: { form: [] } } },
        );
      return marketResponse(u);
    },
    { eodhd: false },
  );
  const first = await p.research("IPO");
  assert.equal(first.history.length, 1);
  assert.match(first.issues.join(" "), /Financial facts|Company disclosures/);
  broken = false;
  const next = await p.research("IPO");
  assert.equal(next.facts[0]?.value, 20);
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
  test(`primary ${failure} response falls back without losing useful research`, async () => {
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
    assert.equal(r.quote.price, 103);
    assert.equal(r.history.length, 1);
    assert.match(r.quote.source, /fallback/);
    assert.match(r.historySource, /fallback/);
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

test("search falls through invalid primary payload and deduplicates class-share aliases", async () => {
  const p = fixtureProviders((u) =>
    u.hostname === "eodhd.com"
      ? Response.json({})
      : Response.json({
          data: [
            {
              symbol: "BRK-B",
              instrument_name: "Berkshire Class B",
              currency: "USD",
              exchange: "NYSE",
            },
            {
              symbol: "BRK.B",
              instrument_name: "Berkshire Class B",
              currency: "USD",
              exchange: "NYSE",
            },
          ],
        }),
  );
  const rows = await p.search("brk.b");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].symbol, "BRK.B");
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

test("crypto quote currency is validated even when pair identity matches", async () => {
  const p = fixtureProviders(
    (u) =>
      u.pathname === "/quote"
        ? Response.json({
            symbol: "ETH/USD",
            name: "Ethereum",
            currency: "EUR",
            close: 200,
            timestamp: Math.floor(Date.now() / 1000),
          })
        : marketResponse(u),
    { eodhd: false },
  );
  const r = await p.research("ETH/USD");
  assert.equal(r.quote.price, null);
  assert.match(r.issues.join(" "), /currency/i);
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

test("class-share fallback profile preserves verified issuer identity when quote is offline", async () => {
  const p = fixtureProviders((u) => {
    if (u.hostname === "eodhd.com" || u.pathname === "/quote")
      return new Response("", { status: 503 });
    if (u.pathname === "/profile")
      return Response.json({
        symbol: "BRK.B",
        name: "Berkshire Hathaway Class B",
        currency: "USD",
        exchange: "NYSE",
      });
    return marketResponse(u);
  });
  const r = await p.research("BRK-B");
  assert.equal(r.company.name, "Berkshire Hathaway Class B");
  assert.equal(r.quote.price, null);
  assert.equal(r.history.length, 1);
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

test("valid SEC identity with zero supported financial observations discloses coverage", async () => {
  const p = fixtureProviders(
    (u) => {
      if (u.pathname.endsWith("company_tickers.json"))
        return Response.json({
          0: {
            ticker: "EMPTY",
            cik_str: 123,
            title: "Empty Statement Coverage",
          },
        });
      if (u.pathname.includes("companyfacts"))
        return Response.json({
          entityName: "Empty Statement Coverage",
          facts: {},
        });
      if (u.pathname.includes("/submissions/"))
        return Response.json({ filings: { recent: { form: [] } } });
      return marketResponse(u);
    },
    { eodhd: false },
  );
  const r = await p.research("EMPTY");
  assert.equal(r.quote.price, 103);
  assert.match(r.issues.join(" "), /financial.*coverage|coverage.*financial/i);
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

test("chart route classifies malformed symbols before provider requests", async () => {
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
  assert.match(r.issues.join(" "), /unavailable/i);
});
