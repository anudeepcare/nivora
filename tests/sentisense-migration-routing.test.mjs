import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
const realFetch = globalThis.fetch;
const keys = [
  "AURYN_MARKET_PROVIDER",
  "AURYN_SENTISENSE_MODE",
  "AURYN_PRICE_PROVIDER",
  "SENTISENSE_API_KEY",
  "NODE_ENV",
  "AURYN_SHARED_RATE_LIMIT",
  "EODHD_API_KEY",
  "TWELVE_DATA_API_KEY",
];
function fixture() {
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    AURYN_MARKET_PROVIDER: "sentisense",
    AURYN_SENTISENSE_MODE: "pro",
    SENTISENSE_API_KEY: "fixture-senti",
    EODHD_API_KEY: "fixture-eod",
    TWELVE_DATA_API_KEY: "fixture-twelve",
    NODE_ENV: "test",
  });
  delete process.env.AURYN_SHARED_RATE_LIMIT;
  delete process.env.AURYN_PRICE_PROVIDER;
  return () => {
    globalThis.fetch = realFetch;
    for (const [k, v] of Object.entries(saved))
      v === undefined ? delete process.env[k] : (process.env[k] = v);
  };
}
test("SentiSense source selection never touches legacy endpoint on source failure", async () => {
  const done = fixture();
  try {
    const hosts = [];
    globalThis.fetch = async (url) => {
      hosts.push(new URL(url).hostname);
      return new Response("", { status: 503 });
    };
    const api = sourceModule("lib/providers.ts");
    await assert.rejects(api.quote("APP"));
    await assert.rejects(api.twelve("quote", { symbol: "APP" }));
    const eod = sourceModule("lib/eodhd.ts");
    assert.equal(eod.eodEnabled(), false);
    await assert.rejects(eod.eodRequest("real-time/APP.US"));
    assert.ok(hosts.length > 0);
    assert.ok(hosts.every((x) => x === "app.sentisense.ai"));
  } finally {
    done();
  }
});
test("sole-source guard remains for legacy research endpoints even with explicit EODHD live quotes", async () => {
  const done = fixture();
  try {
    process.env.AURYN_PRICE_PROVIDER = "eodhd";
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      throw Error("must not run");
    };
    const api = sourceModule("lib/providers.ts");
    await assert.rejects(api.twelve("profile", { symbol: "APP" }));
    await assert.rejects(
      api.twelve("time_series", { symbol: "APP", interval: "1day" }),
    );
    await assert.rejects(
      sourceModule("lib/eodhd.ts").eodRequest("fundamentals/APP.US"),
    );
    assert.equal(calls, 0);
  } finally {
    done();
  }
});
test("explicit EODHD price mode reads only real-time quotes, never legacy research or Twelve", async () => {
  const done = fixture();
  try {
    process.env.AURYN_PRICE_PROVIDER = "eodhd";
    const urls = [];
    globalThis.fetch = async (input) => {
      const url = new URL(input);
      urls.push(url);
      assert.equal(url.hostname, "eodhd.com");
      assert.equal(url.pathname, "/api/real-time/APP.US");
      return Response.json({
        code: "APP.US",
        close: 120,
        timestamp: Math.floor(Date.now() / 1000),
      });
    };
    const api = sourceModule("lib/providers.ts");
    const result = await api.quote("APP");
    assert.equal(result.quote.price, 120);
    assert.match(result.quote.source, /EODHD/);
    const eod = sourceModule("lib/eodhd.ts");
    assert.equal(eod.eodEnabled(), false);
    await assert.rejects(eod.eodRequest("fundamentals/APP.US"));
    await assert.rejects(api.twelve("quote", { symbol: "APP" }));
    assert.ok(urls.length > 0);
    assert.ok(
      urls.every(
        (u) =>
          u.hostname === "eodhd.com" && u.pathname === "/api/real-time/APP.US",
      ),
    );
  } finally {
    done();
  }
});

for (const invalid of ["null-price", "future-observation"]) {
  for (const sentiAvailable of [true, false]) {
    test(`invalid EODHD ${invalid} cannot escape when SentiSense ${sentiAvailable ? "succeeds" : "fails"}`, async () => {
      const done = fixture();
      try {
        process.env.AURYN_PRICE_PROVIDER = "eodhd";
        const hosts = [];
        globalThis.fetch = async (input) => {
          const url = new URL(input);
          hosts.push(url.hostname);
          if (url.hostname === "eodhd.com") {
            assert.equal(url.pathname, "/api/real-time/APP.US");
            return Response.json({
              code: "APP.US",
              name: "AppLovin",
              currency: "USD",
              exchange: "NASDAQ",
              close: invalid === "null-price" ? null : 999,
              timestamp:
                Math.floor(Date.now() / 1000) +
                (invalid === "future-observation" ? 3600 : 0),
            });
          }
          assert.equal(url.hostname, "app.sentisense.ai");
          if (!sentiAvailable) return new Response("", { status: 503 });
          if (url.pathname.endsWith("/profile"))
            return Response.json({
              ticker: "APP",
              name: "AppLovin",
              currency: "usd",
              primaryExchange: "XNAS",
              country: "United States",
            });
          return Response.json({
            ticker: "APP",
            currentPrice: 120,
            priceAsOf: Date.now() - 15 * 60000,
          });
        };
        const api = sourceModule("lib/providers.ts");
        if (sentiAvailable) {
          const value = await api.quote("APP");
          assert.equal(value.quote.price, 120);
          assert.match(value.quote.source, /SentiSense/);
        } else await assert.rejects(api.quote("APP"));
        assert.ok(hosts.includes("eodhd.com"));
        assert.ok(hosts.includes("app.sentisense.ai"));
        assert.ok(!hosts.some((h) => h.includes("twelvedata")));
      } finally {
        done();
      }
    });
  }
}

test("EODHD price mode supplies split-adjusted daily chart history, not SentiSense weekly bars", async () => {
  const done = fixture();
  try {
    process.env.AURYN_PRICE_PROVIDER = "eodhd";
    const calls = [];
    globalThis.fetch = async (input) => {
      const url = new URL(input); calls.push(url);
      assert.equal(url.hostname, "eodhd.com");
      if (url.pathname === "/api/splits/APP.US") return Response.json([]);
      assert.equal(url.pathname, "/api/eod/APP.US");
      return Response.json([{date:"2026-11-13",open:100,high:110,low:90,close:105,adjusted_close:105,volume:1000}]);
    };
    const result = await sourceModule("lib/providers.ts").marketHistory("APP", "5Y");
    assert.equal(result.candles.length, 1);
    assert.equal(result.candles[0].close, 105);
    assert.match(result.source, /EODHD/);
    assert.equal(calls.length, 2);
  } finally { done(); }
});

test("research receives five-year daily EODHD history even when SentiSense research is unavailable", async () => {
  const done = fixture();
  try {
    process.env.AURYN_PRICE_PROVIDER = "eodhd";
    const calls = [];
    globalThis.fetch = async (input) => {
      const url = new URL(input); calls.push(url);
      if (url.hostname === "app.sentisense.ai") return new Response("", {status:503});
      assert.equal(url.hostname, "eodhd.com");
      if (url.pathname === "/api/splits/APP.US") return Response.json([]);
      if (url.pathname === "/api/real-time/APP.US") return Response.json({code:"APP.US",close:105,timestamp:Math.floor(Date.now()/1000)});
      assert.equal(url.pathname, "/api/eod/APP.US");
      assert.ok(Date.parse(url.searchParams.get("from")) < Date.now()-4*365*86400000);
      return Response.json([{date:"2026-11-13",open:100,high:110,low:90,close:105,adjusted_close:105,volume:1000}]);
    };
    const result = await sourceModule("lib/providers.ts").research("APP");
    assert.equal(result.history.length, 1);
    assert.match(result.historySource, /EODHD/);
    assert.ok(!result.issues.some(x => x.includes("one-year window")));
    assert.ok(!calls.some(x => x.pathname === "/api/v1/stocks/chart"));
  } finally { done(); }
});
