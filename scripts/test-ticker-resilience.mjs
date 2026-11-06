// Synthetic authenticated API coverage. All external requests are fixtures.
// Default: built production route. --source: transpile the same route/provider graph.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  sourceModule,
  marketResponse,
  bar,
} from "../tests/helpers/provider-fixture.mjs";
const require = createRequire(import.meta.url);
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://account.example.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fixture-public";
process.env.EODHD_API_KEY = "fixture-eod";
process.env.TWELVE_DATA_API_KEY = "fixture-twelve";
process.env.SEC_USER_AGENT = "AURYN tests@test.invalid";
for (const name of [
  "EODHD_API_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AURYN_ACCESS_ENABLED",
  "AURYN_SHARED_MARKET_GUARD",
  "AURYN_REQUIRE_DISTRIBUTED_BUDGET",
])
  delete process.env[name];
const calls = [];
globalThis.fetch = async (input) => {
  const u = new URL(String(input));
  calls.push(u);
  if (u.pathname === "/auth/v1/user")
    return Response.json({
      id: "00000000-0000-4000-8000-000000000001",
      email_confirmed_at: "2026-01-01",
    });
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
  if (
    u.pathname.includes("UNKNOWN") ||
    u.searchParams.get("symbol") === "UNKNOWN"
  )
    return u.hostname === "eodhd.com"
      ? new Response("", { status: 404 })
      : Response.json({
          status: "error",
          code: 404,
          message: "Symbol not found",
        });
  if (
    u.pathname.includes("UNCERTAIN") ||
    u.searchParams.get("symbol") === "UNCERTAIN"
  )
    return u.hostname === "eodhd.com"
      ? new Response("", { status: 503 })
      : Response.json({
          status: "error",
          code: 404,
          message: "Symbol not found",
        });
  if (u.hostname === "eodhd.com" && /BRK-B|PARTIAL/.test(u.pathname))
    return new Response("", { status: 503 });
  if (
    u.hostname === "api.twelvedata.com" &&
    u.searchParams.get("symbol") === "BRK.B"
  ) {
    if (u.pathname === "/quote")
      return Response.json({
        symbol: "BRK.B",
        name: "Berkshire Hathaway Class B",
        currency: "USD",
        exchange: "NYSE",
        close: 400,
        timestamp: Math.floor(Date.now() / 1000),
      });
    if (u.pathname === "/time_series")
      return Response.json({
        meta: { symbol: "BRK.B", currency: "USD", exchange: "NYSE" },
        values: [bar],
      });
  }
  if (u.hostname === "eodhd.com" && u.pathname.includes("RATE"))
    return new Response("", { status: 429 });
  return marketResponse(u);
};
const route = process.argv.includes("--source")
  ? sourceModule("app/api/research/[symbol]/route.ts")
  : require("../.next/server/app/api/research/[symbol]/route.js").routeModule
      .userland;
const request = (symbol, authenticated = true) =>
  route.GET(
    new Request(
      "https://auryn.example/api/research/" + encodeURIComponent(symbol),
      { headers: authenticated ? { Authorization: "Bearer fixture" } : {} },
    ),
    { params: Promise.resolve({ symbol }) },
  );
let checks = 0;
const unauthenticated = await request("SPY", false);
assert.equal(unauthenticated.status, 401);
assert.equal(calls.length, 0);
checks++;
for (const symbol of ["BRK-B", "BRK.B"]) {
  const r = await request(symbol),
    d = await r.json();
  assert.equal(r.status, 200);
  assert.equal(d.company.symbol, symbol);
  assert.equal(d.quote.price, 400);
  assert.match(d.quote.source, /fallback/);
  assert.equal(d.history.length, 1);
  assert.match(r.headers.get("cache-control"), /no-store/);
  checks++;
}
for (const symbol of ["SPY", "IPO", "PARTIAL", "RATE"]) {
  const r = await request(symbol),
    d = await r.json();
  assert.equal(r.status, 200);
  assert.ok(d.quote.price > 0);
  assert.equal(d.history.length, 1);
  assert.deepEqual(d.facts, []);
  assert.equal(d.snapshot.financialPeriod, null);
  assert.match(d.issues.join(" "), /financial/i);
  checks++;
}
const adr = await (await request("SAP")).json();
assert.equal(adr.quote.currency, "USD");
assert.equal(adr.facts[0].currency, "EUR");
assert.match(adr.facts[0].sourceUrl, /sec.gov/);
checks++;
const crypto = await (await request("ETH-USD")).json();
assert.equal(crypto.company.symbol, "ETH/USD");
assert.equal(crypto.company.assetType, "crypto");
assert.equal(
  calls.some((u) => /fundamentals\/ETH/.test(u.pathname)),
  false,
);
checks++;
for (const [symbol, status] of [
  ["BAD?", 400],
  ["ETH/EUR", 422],
]) {
  const before = calls.filter(
    (u) => u.hostname !== "account.example.invalid",
  ).length;
  const r = await request(symbol);
  assert.equal(r.status, status);
  assert.equal(
    calls.filter((u) => u.hostname !== "account.example.invalid").length,
    before,
  );
  checks++;
}
const missing = await request("UNKNOWN");
assert.equal(missing.status, 404);
assert.doesNotMatch(
  JSON.stringify(await missing.json()),
  /fixture-eod|fixture-twelve/,
);
checks++;
const uncertain = await request("UNCERTAIN");
assert.equal(uncertain.status, 200);
const partial = await uncertain.json();
assert.equal(partial.quote.price, null);
assert.match(partial.issues.join(" "), /unavailable/i);
checks++;
console.log(
  `${checks} ticker resilience API checks passed (${process.argv.includes("--source") ? "source route" : "production build"}; synthetic transport only).`,
);
