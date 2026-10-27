import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtureProviders,
  marketResponse,
  sourceModule,
} from "./helpers/provider-fixture.mjs";
import { providerSymbol, providerIdentity } from "../lib/provider-symbol.ts";
import { eodTicker } from "../lib/eodhd-normalize.ts";
const originalFetch = globalThis.fetch;
test.after(() => {
  globalThis.fetch = originalFetch;
});

function eodFacts(symbol, { complete = false, end = "2026-06-30" } = {}) {
  return {
    General: {
      Code: symbol,
      Name: "Verified " + symbol,
      Exchange: "NYSE",
      CurrencyCode: "USD",
      CountryISO: "US",
    },
    SharesStats: { SharesOutstanding: 77 },
    Financials: {
      Income_Statement: {
        currency_symbol: "USD",
        quarterly: {
          a: {
            date: end,
            filing_date: end,
            totalRevenue: 100,
            ...(complete ? { netIncome: 10, operatingIncome: 20 } : {}),
          },
        },
      },
      ...(complete
        ? {
            Cash_Flow: {
              currency_symbol: "USD",
              quarterly: {
                a: {
                  date: end,
                  filing_date: end,
                  totalCashFromOperatingActivities: 30,
                  capitalExpenditures: -5,
                },
              },
            },
          }
        : {}),
    },
  };
}
function secResponse(
  u,
  { end = "2026-06-30", currency = "USD", complete = true } = {},
) {
  if (u.pathname.endsWith("company_tickers.json"))
    return Response.json({
      0: { ticker: "TEST", cik_str: 123, title: "SEC TEST" },
    });
  if (u.pathname.includes("companyfacts")) {
    const row = {
      start: end.slice(0, 4) + "-04-01",
      end,
      filed: end,
      form: "10-Q",
      accn: "0000000123-26-000001",
    };
    const values = {
      Revenues: 200,
      ...(complete
        ? {
            NetIncomeLoss: 20,
            OperatingIncomeLoss: 40,
            NetCashProvidedByUsedInOperatingActivities: 60,
            PaymentsToAcquirePropertyPlantAndEquipment: 10,
          }
        : {}),
    };
    return Response.json({
      entityName: "SEC TEST",
      facts: {
        "us-gaap": Object.fromEntries(
          Object.entries(values).map(([tag, val]) => [
            tag,
            { units: { [currency]: [{ ...row, val }] } },
          ]),
        ),
      },
    });
  }
  if (u.pathname.includes("/submissions/"))
    return Response.json({
      filings: {
        recent: {
          form: ["10-Q"],
          accessionNumber: ["0000000123-26-000001"],
          primaryDocument: ["report.htm"],
          filingDate: [end],
        },
      },
    });
  return null;
}
test("a nonempty but incomplete primary selects complete SEC statements and keeps primary profile and ownership", async () => {
  const p = fixtureProviders(
    (u) =>
      secResponse(u) ??
      (u.pathname.includes("/fundamentals/")
        ? Response.json(eodFacts("TEST"))
        : marketResponse(u)),
  );
  const r = await p.research("TEST");
  assert.equal(r.facts.find((f) => f.metric === "revenue")?.value, 200);
  assert.ok(r.facts.every((f) => f.sourceUrl.includes("sec.gov")));
  assert.equal(r.company.name, "Verified TEST");
  assert.equal(r.evidence.ownership.outstanding, 77);
  assert.equal(r.filings.length, 1);
  assert.equal(r.quote.price, 102);
  assert.equal(r.history.length, 1);
});
test("stale complete primary statements recover with newer complete SEC evidence", async () => {
  const p = fixtureProviders(
    (u) =>
      secResponse(u) ??
      (u.pathname.includes("/fundamentals/")
        ? Response.json(eodFacts("TEST", { complete: true, end: "2023-06-30" }))
        : marketResponse(u)),
  );
  const r = await p.fundamentals("TEST");
  assert.equal(r.facts.find((f) => f.metric === "revenue")?.value, 200);
});
test("current complete primary avoids unnecessary SEC spend", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/fundamentals/")
      ? Response.json(eodFacts("TEST", { complete: true }))
      : marketResponse(u),
  );
  const r = await p.fundamentals("TEST");
  assert.equal(r.facts.find((f) => f.metric === "revenue")?.value, 100);
  assert.equal(
    p.calls.some((u) => u.hostname.includes("sec.gov")),
    false,
  );
});
test("incomplete SEC fallback cannot erase better primary facts or splice another currency", async () => {
  const p = fixtureProviders(
    (u) =>
      secResponse(u, { complete: false, currency: "EUR" }) ??
      (u.pathname.includes("/fundamentals/")
        ? Response.json(eodFacts("TEST"))
        : marketResponse(u)),
  );
  const r = await p.fundamentals("TEST");
  assert.equal(r.facts.find((f) => f.metric === "revenue")?.value, 100);
  assert.ok(r.facts.every((f) => f.currency === "USD"));
  assert.equal(r.filings.length, 1);
});
test("international exchange suffixes cannot alias to US class shares or spend provider calls", async () => {
  const p = fixtureProviders(marketResponse);
  for (const s of ["SAP.XETRA", "VOD.L", "SHOP.TO", "0700.HK", "LSE:VOD"])
    await assert.rejects(p.research(s), (e) => e.status === 422);
  assert.notEqual(providerIdentity("VOD.L"), providerIdentity("VOD-L"));
  assert.equal(p.calls.length, 0);
  assert.throws(() => eodTicker("SHOP.TO"));
});
test("US exchange-qualified and class aliases resolve without losing their class identity", () => {
  assert.equal(providerSymbol("NASDAQ:MSFT"), "MSFT");
  assert.equal(providerSymbol("BRK.B.US"), "BRK.B");
  assert.equal(eodTicker("BRK.B.US"), "BRK-B.US");
  assert.equal(providerIdentity("BRK.B"), providerIdentity("BRK-B"));
  assert.notEqual(providerIdentity("BRK.A"), providerIdentity("BRK-B"));
});
test("complete enabled directories include late rows and search by company, exchange and class alias", async () => {
  const rows = Array.from({ length: 65 }, (_, i) => ({
    Code: "Z" + i,
    Name: "Other " + i,
    Exchange: "NASDAQ",
    Currency: "USD",
    Type: "Common Stock",
  }));
  rows.push({
    Code: "BRK-B",
    Name: "Berkshire Hathaway Class B",
    Exchange: "NYSE",
    Currency: "USD",
    Type: "Common Stock",
  });
  const p = fixtureProviders(
    (u) => {
      if (u.pathname.endsWith("/exchange-symbol-list/US"))
        return Response.json(rows);
      if (u.pathname.endsWith("/exchange-symbol-list/CC"))
        return Response.json([
          {
            Code: "ETH-USD",
            Name: "Ethereum",
            Exchange: "CC",
            Currency: "USD",
            Type: "Crypto",
          },
        ]);
      return marketResponse(u);
    },
    { twelve: false },
  );
  assert.equal(typeof p.marketDirectory, "function");
  const d = await p.marketDirectory();
  assert.equal(d.listings.length, 67);
  assert.equal(d.complete, true);
  assert.equal((await p.search("berkshire hathaway"))[0]?.symbol, "BRK-B");
  assert.equal((await p.search("NYSE:BRK.B"))[0]?.symbol, "BRK-B");
  assert.equal((await p.search("Z64"))[0]?.symbol, "Z64");
});
test("partial research reports independent dataset availability and crypto financials as not applicable", async () => {
  const p = fixtureProviders((u) =>
    u.pathname.includes("/real-time/") || u.pathname === "/quote"
      ? new Response("", { status: 503 })
      : marketResponse(u),
  );
  const r = await p.research("TEST");
  assert.equal(r.coverage?.quote.status, "unavailable");
  assert.equal(r.coverage?.history.status, "available");
  assert.equal(r.coverage?.profile.status, "available");
  assert.equal(r.coverage?.fundamentals.status, "unavailable");
  const crypto = await p.research("ETH/USD");
  assert.equal(crypto.coverage?.fundamentals.status, "not-applicable");
});
test("a Twelve-only profile recovers independently when SEC facts and quote are unavailable", async () => {
  const p = fixtureProviders(
    (u) =>
      u.pathname === "/quote"
        ? new Response("", { status: 503 })
        : marketResponse(u),
    { eodhd: false },
  );
  const r = await p.research("PROFILE");
  assert.equal(r.company.name, "Verified PROFILE");
  assert.equal(r.coverage.profile.status, "available");
  assert.equal(r.history.length, 1);
  assert.equal(r.facts.length, 0);
});
test("mixed periods and currencies never count as a complete operating statement", () => {
  const { fundamentalCoverage, preferReportedFacts } = sourceModule(
    "lib/fundamental-coverage.ts",
  );
  const base = {
    id: "a",
    start: "2026-04-01",
    end: "2026-06-30",
    filed: "2026-08-01",
    value: 1,
    currency: "USD",
    unit: "USD",
    basis: "GAAP",
    scope: "quarterly",
  };
  const facts = [
    "revenue",
    "netIncome",
    "operatingIncome",
    "operatingCashFlow",
    "capex",
  ].map((metric) => ({ ...base, metric }));
  assert.equal(
    fundamentalCoverage(facts, Date.parse("2026-10-27")).complete,
    true,
  );
  const mixed = facts.map((f) =>
    f.metric === "capex" ? { ...f, currency: "EUR", unit: "EUR" } : f,
  );
  assert.equal(
    fundamentalCoverage(mixed, Date.parse("2026-10-27")).complete,
    false,
  );
  const mismatched = facts.map((f) =>
    f.metric === "capex" ? { ...f, start: "2026-04-02" } : f,
  );
  assert.equal(
    fundamentalCoverage(mismatched, Date.parse("2026-10-27")).complete,
    false,
  );
  assert.equal(
    preferReportedFacts(mixed, facts, Date.parse("2026-10-27")),
    true,
  );
});
test("US directory stock coverage includes OTC ADRs while foreign and unsupported instrument types stay excluded", () => {
  const { normalizeEodSearch } = sourceModule("lib/eodhd-normalize.ts");
  const rows = normalizeEodSearch([
    {
      Code: "ADR",
      Name: "Foreign Issuer ADR",
      Exchange: "OTCQX",
      Currency: "USD",
      Type: "Common Stock",
    },
    {
      Code: "FOREIGN",
      Name: "Foreign listing",
      Exchange: "LSE",
      Currency: "USD",
      Type: "Common Stock",
    },
    {
      Code: "WARRANT",
      Name: "Warrant",
      Exchange: "NYSE",
      Currency: "USD",
      Type: "Warrant",
    },
  ]);
  assert.deepEqual(
    rows.map((r) => r.symbol),
    ["ADR"],
  );
});
test("empty enabled directory responses are incomplete and recover on the next discovery pass", async () => {
  let broken = true;
  const p = fixtureProviders(
    (u) => {
      if (u.pathname.includes("/exchange-symbol-list/"))
        return Response.json(
          broken
            ? []
            : [
                {
                  Code: u.pathname.endsWith("/CC") ? "ETH-USD" : "AAPL",
                  Name: "Verified",
                  Exchange: u.pathname.endsWith("/CC") ? "CC" : "NASDAQ",
                  Currency: "USD",
                  Type: u.pathname.endsWith("/CC") ? "Crypto" : "Common Stock",
                },
              ],
        );
      return marketResponse(u);
    },
    { twelve: false },
  );
  const first = await p.marketDirectory();
  assert.equal(first.complete, false);
  broken = false;
  const now = Date.now;
  Date.now = () => now() + 61000;
  try {
    const second = await p.marketDirectory();
    assert.equal(second.complete, true);
    assert.equal(second.listings.length, 2);
  } finally {
    Date.now = now;
  }
});
test("verified provider aliases remain discoverable when the current full directory has only the new company name", async () => {
  const p = fixtureProviders(
    (u) => {
      if (u.pathname.endsWith("/exchange-symbol-list/US"))
        return Response.json([
          {
            Code: "META",
            Name: "Meta Platforms",
            Exchange: "NASDAQ",
            Currency: "USD",
            Type: "Common Stock",
          },
        ]);
      if (u.pathname.endsWith("/exchange-symbol-list/CC"))
        return Response.json([
          {
            Code: "ETH-USD",
            Name: "Ethereum",
            Exchange: "CC",
            Currency: "USD",
            Type: "Crypto",
          },
        ]);
      if (u.pathname.includes("/search/"))
        return Response.json([
          {
            Code: "META",
            Name: "Meta Platforms",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock",
          },
        ]);
      return marketResponse(u);
    },
    { twelve: false },
  );
  assert.equal((await p.search("Facebook"))[0]?.symbol, "META");
});

test("a live-shaped Twelve profile without currency recovers only with a matching USD directory listing", async () => {
  const p = fixtureProviders(
    (u) => {
      if (u.pathname === "/quote") return new Response("", { status: 503 });
      if (u.pathname === "/profile")
        return Response.json({
          symbol: "IREN",
          name: "IREN Ltd.",
          exchange: "NASDAQ",
          country: "Australia",
          type: "Common Stock",
        });
      if (u.pathname === "/stocks")
        return Response.json({
          data: [
            {
              symbol: "IREN",
              name: "IREN Ltd.",
              exchange: "NASDAQ",
              currency: "USD",
              type: "Common Stock",
            },
          ],
        });
      if (u.pathname === "/etf" || u.pathname === "/cryptocurrencies")
        return Response.json({ data: [] });
      return marketResponse(u);
    },
    { eodhd: false },
  );
  const r = await p.research("IREN");
  assert.equal(r.company.name, "IREN Ltd.");
  assert.equal(r.company.currency, "USD");
  assert.equal(r.coverage.profile.status, "available");
  assert.equal(r.quote.price, null);
});

test("a currency-less Twelve profile cannot borrow another listing identity or non-USD currency", async () => {
  const p = fixtureProviders(
    (u) => {
      if (u.pathname === "/quote") return new Response("", { status: 503 });
      if (u.pathname === "/profile")
        return Response.json({
          symbol: "SAP",
          name: "SAP SE",
          exchange: "NYSE",
          country: "Germany",
        });
      if (u.pathname === "/stocks")
        return Response.json({
          data: [
            {
              symbol: "SAP",
              name: "SAP SE",
              exchange: "NYSE",
              currency: "EUR",
              type: "Common Stock",
            },
            {
              symbol: "OTHER",
              name: "Other",
              exchange: "NYSE",
              currency: "USD",
              type: "Common Stock",
            },
          ],
        });
      if (u.pathname === "/etf" || u.pathname === "/cryptocurrencies")
        return Response.json({ data: [] });
      return marketResponse(u);
    },
    { eodhd: false },
  );
  const r = await p.research("SAP");
  assert.equal(r.coverage.profile.status, "unavailable");
  assert.equal(r.company.name, "SAP");
});
