import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
import { consensusOutlook, researchOutlook } from "../lib/outlook.ts";
import { listingReconciliation } from "../lib/listing-reconciliation.ts";

// Independent synthetic values: 100m shares * $50 = $5bn market cap;
// $300m net debt + market cap = $5.3bn, or 5x $1.06bn revenue.
function input(snapshotDate = "2026-10-16") {
  const r = normalizeEodFundamentals(
    "TEST",
    {
      General: {
        Code: "TEST",
        Name: "TEST",
        Type: "Common Stock",
        Exchange: "NASDAQ",
        CurrencyCode: "USD",
        CountryISO: "US",
        UpdatedAt: "2026-10-16",
      },
      Highlights: { MarketCapitalization: 5e9, RevenueTTM: 1.06e9 },
      SharesStats: { SharesOutstanding: 1e8 },
      Valuation: { EnterpriseValueRevenue: 5, EnterpriseValue: 5.3e9 },
      AnalystRatings: {
        TargetPrice: 70,
        TargetPriceLow: 40,
        TargetPriceHigh: 90,
      },
      Financials: {
        Income_Statement: { currency_symbol: "USD" },
        Balance_Sheet: {
          currency_symbol: "USD",
          quarterly: {
            q: {
              date: "2026-06-30",
              filing_date: "2026-08-01",
              cashAndEquivalents: 2e8,
              shortLongTermDebtTotal: 5e8,
            },
          },
        },
      },
      Earnings: {
        Trend: {
          Annual: {
            y: {
              date: "2028-12-31",
              period: "FY2028",
              currency: "USD",
              revenueEstimateLow: 1e9,
              revenueEstimateAvg: 2e9,
              revenueEstimateHigh: 3e9,
              earningsEstimateAvg: -1,
            },
          },
        },
      },
    },
    "2026-10-17T00:00:00Z",
  );
  r.evidence.listingObservations = {
    marketCap: { asOf: snapshotDate, currency: "USD", shareBasis: "TEST" },
    shares: { asOf: snapshotDate, unit: "shares", shareBasis: "TEST" },
    price: {
      value: 50,
      asOf: snapshotDate,
      currency: "USD",
      shareBasis: "TEST",
    },
  };
  return {
    ...r,
    quote: {
      price: 50,
      asOf: "2026-10-16T20:00:00Z",
      currency: "USD",
      stale: false,
    },
    retrievedAt: "2026-10-17T00:00:00Z",
    history: [],
  };
}

test("old matched capitalization snapshots cannot supply shares for current revenue scenarios", () => {
  const r = input("2024-10-16");
  assert.equal(listingReconciliation(r).status, "missing");
  assert.equal(researchOutlook(r).available, false);
  assert.match(researchOutlook(r).reason, /120 days|older|recent/i);
  assert.equal(
    consensusOutlook(r).target,
    70,
    "independent supplied analyst targets are preserved",
  );
});

test("matched snapshot share age uses the same 120-day boundary as the reported-share bridge", () => {
  assert.equal(listingReconciliation(input("2026-06-19")).status, "available");
  assert.equal(listingReconciliation(input("2026-06-18")).status, "missing");
  const fresh = researchOutlook(input());
  assert.equal(fresh.available, true);
  assert.equal(fresh.basis, "revenue");
  assert.equal(fresh.shares, 1e8);
  assert.ok(Math.abs(fresh.cases[1].target - 88.18181818181819) < 1e-10);
});

test("an impossible provider dataset date cannot make analyst targets appear dated", () => {
  const r = input();
  r.retrievedAt = "2026-03-03T00:00:00Z";
  r.quote.asOf = "2026-03-02T21:00:00Z";
  const normalized = normalizeEodFundamentals(
    "TEST",
    {
      General: { Code: "TEST", CurrencyCode: "USD", UpdatedAt: "2026-02-30" },
      AnalystRatings: {
        TargetPrice: 70,
        TargetPriceLow: 40,
        TargetPriceHigh: 90,
      },
    },
    r.retrievedAt,
  );
  r.evidence = normalized.evidence;
  assert.equal(r.evidence.updatedAt, null);
  assert.equal(consensusOutlook(r), null);
});

test("impossible fiscal dates are removed at normalization rather than shifted by Date.parse", () => {
  const normalized = normalizeEodFundamentals(
    "TEST",
    {
      General: { Code: "TEST", CurrencyCode: "USD", UpdatedAt: "2026-10-16" },
      Earnings: {
        Trend: {
          Annual: {
            bad: {
              date: "2027-02-30",
              period: "FY2027",
              currency: "USD",
              earningsEstimateAvg: 5,
              earningsEstimateLow: 4,
              earningsEstimateHigh: 6,
            },
            leap: {
              date: "2028-02-29",
              period: "FY2028",
              currency: "USD",
              earningsEstimateAvg: 5,
              earningsEstimateLow: 4,
              earningsEstimateHigh: 6,
            },
          },
        },
      },
    },
    "2026-10-17T00:00:00Z",
  );
  assert.deepEqual(
    normalized.evidence.estimates.map((x) => x.date),
    ["2028-02-29"],
  );
});
