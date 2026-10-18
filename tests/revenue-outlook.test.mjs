import test from "node:test";
import assert from "node:assert/strict";
import { researchOutlook } from "../lib/outlook.ts";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
function input(symbol = "NBIS") {
  const normalized = normalizeEodFundamentals(
    symbol,
    {
      General: {
        Code: symbol,
        Name: symbol,
        Exchange: "NASDAQ",
        CurrencyCode: "USD",
        CountryISO: "US",
        UpdatedAt: "2026-10-16",
      },
      Highlights: { MarketCapitalization: 5000000000, RevenueTTM: 1060000000 },
      SharesStats: { SharesOutstanding: 100000000 },
      Valuation: { EnterpriseValueRevenue: 5, EnterpriseValue: 5300000000 },
      Financials: {
        Income_Statement: { currency_symbol: "USD" },
        Balance_Sheet: {
          currency_symbol: "USD",
          quarterly: {
            "2026-06-30": {
              date: "2026-06-30",
              filing_date: "2026-08-01",
              cashAndEquivalents: 200000000,
              shortLongTermDebtTotal: 500000000,
            },
          },
        },
      },
      Earnings: {
        Trend: {
          Annual: {
            "2028-12-31": {
              date: "2028-12-31",
              period: "FY2028",
              currency: "USD",
              revenueEstimateLow: 1000000000,
              revenueEstimateAvg: 2000000000,
              revenueEstimateHigh: 3000000000,
              earningsEstimateAvg: -1,
              earningsEstimateNumberOfAnalysts: 10,
            },
          },
        },
      },
    },
    "2026-10-17T00:00:00Z",
  );
  return {
    ...normalized,
    quote: { price: 50, currency: "USD", stale: false, asOf: "2026-10-16" },
    history: [],
    historySource: "fixture",
    retrievedAt: "2026-10-17T00:00:00Z",
  };
}
test("Synthetic infrastructure and loss-making operating-company revenue sensitivities reconcile enterprise value, net debt and diluted shares", () => {
  for (const symbol of ["NBIS", "IREN", "HIMS"]) {
    const r = researchOutlook(input(symbol));
    assert.equal(r.available, true);
    assert.equal(r.basis, "revenue");
    assert(Math.abs(r.cases[0].target - (4e9 - 3e8) / 1.2e8) < 1e-8);
    assert(Math.abs(r.cases[1].target - (10e9 - 3e8) / 1.1e8) < 1e-8);
    assert(Math.abs(r.cases[2].target - (18e9 - 3e8) / 1e8) < 1e-8);
    assert.equal(r.cases[1].eps, null);
  }
});
test("revenue scenarios fail closed on missing shares, missing debt, currency mismatch or unordered ranges", () => {
  for (const change of [
    (r) => delete r.evidence.ownership.outstanding,
    (r) => (r.facts = r.facts.filter((f) => f.metric !== "debt")),
    (r) => (r.evidence.estimates[0].currency = "EUR"),
    (r) => (r.evidence.estimates[0].revenueLow = 4e9),
  ]) {
    const r = input();
    change(r);
    assert.equal(researchOutlook(r).available, false);
  }
});

test("foreign-domiciled revenue cases require reporting currency and listing equity reconciliation", () => {
  const r = input("NBIS");
  r.company.foreignListing = true;
  r.evidence.highlights.MarketCapitalization = 5e9;
  assert.equal(researchOutlook(r).available, true);
  r.evidence.highlights.MarketCapitalization = 50e9;
  assert.equal(researchOutlook(r).available, false);
  r.evidence.highlights.MarketCapitalization = 5e9;
  r.evidence.reportingCurrency = "EUR";
  assert.equal(researchOutlook(r).available, false);
});

test("revenue sensitivity rejects share-unit and EV/revenue denominator inconsistencies for every listing", () => {
  for (const change of [
    (r) => (r.evidence.ownership.outstanding = 100),
    (r) => (r.evidence.highlights.MarketCapitalization = 50e9),
    (r) => (r.evidence.multiples.EnterpriseValue = 53e9),
    (r) => (r.evidence.highlights.RevenueTTM = 1060000),
    (r) => delete r.evidence.highlights.MarketCapitalization,
  ]) {
    const r = input("HIMS");
    change(r);
    assert.equal(researchOutlook(r).available, false);
  }
});
