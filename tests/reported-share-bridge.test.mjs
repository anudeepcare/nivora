import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
import { listingReconciliation } from "../lib/listing-reconciliation.ts";
const observedAt = "2026-11-08T12:00:00Z";
const raw = () => ({
  General: {
    Code: "TEST",
    Type: "Common Stock",
    Exchange: "NASDAQ",
    CurrencyCode: "USD",
    CountryISO: "US",
    UpdatedAt: "2026-11-08",
  },
  SharesStats: { SharesOutstanding: 101000000 },
  Financials: { Income_Statement: { currency_symbol: "USD" } },
  outstandingShares: {
    quarterly: {
      q: {
        date: "2026-Q3",
        dateFormatted: "2026-09-30",
        shares: 100000000,
        sharesMln: "100",
      },
    },
  },
});
const report = (payload = raw()) => ({
  ...normalizeEodFundamentals("TEST", payload, observedAt),
  retrievedAt: observedAt,
  quote: {
    price: 25,
    currency: "USD",
    asOf: "2026-11-06T21:00:00Z",
    stale: false,
  },
  history: [],
});
test("dated provider share counts bridge independent current price without inventing a market-cap observation", () => {
  const r = report();
  assert.equal(r.evidence.listingObservations, undefined);
  assert.equal(r.evidence.ownership.outstanding, 101000000);
  const b = listingReconciliation(r);
  assert.equal(b.status, "available");
  assert.equal(b.shares, 100000000);
  assert.equal(b.sharesAsOf, "2026-09-30");
  assert.equal(b.basis, "reported-share-bridge");
  assert.equal(b.differencePct, null);
  assert.match(b.detail, /not.*audit/i);
});
test("share units in millions are explicit and conflicting whole-share units are withheld", () => {
  const p = raw();
  delete p.outstandingShares.quarterly.q.shares;
  assert.equal(report(p).evidence.reportedShareObservation?.value, 100000000);
  p.outstandingShares.quarterly.q.shares = 100;
  assert.equal(report(p).evidence.reportedShareObservation, undefined);
});
test("a complete balance-sheet share fact carries its actual end date and filing knowledge", () => {
  const p = raw();
  delete p.outstandingShares;
  p.Financials.Balance_Sheet = {
    currency_symbol: "USD",
    quarterly: {
      q: {
        date: "2026-09-30",
        filing_date: "2026-11-01",
        commonStockSharesOutstanding: "100000000",
      },
    },
  };
  const r = report(p);
  assert.equal(r.evidence.reportedShareObservation?.asOf, "2026-09-30");
  assert.equal(listingReconciliation(r).status, "available");
});
test("bridge withholds foreign ADR stale future split-affected conflicting and mismatched observations", () => {
  for (const mutate of [
    (p) => (p.General.CountryISO = "AU"),
    (p) => (p.General.Type = "American Depositary Receipt"),
    (p) => (p.General.Type = "ETF"),
    (p) => (p.outstandingShares.quarterly.q.dateFormatted = "2026-01-01"),
    (p) => (p.outstandingShares.quarterly.q.dateFormatted = "2026-12-31"),
    (p) => (p.outstandingShares.quarterly.q.dateFormatted = "2026-02-30"),
    (p) => (p.SplitsDividends = { LastSplitDate: "2026-10-01" }),
    (p) => (p.SharesStats.SharesOutstanding = 1e9),
  ]) {
    const p = raw();
    mutate(p);
    assert.notEqual(listingReconciliation(report(p)).status, "available");
  }
  const r = report();
  r.quote.currency = "EUR";
  assert.notEqual(listingReconciliation(r).status, "available");
  r.quote.currency = "USD";
  r.quote.asOf = "2026-10-01";
  assert.notEqual(listingReconciliation(r).status, "available");
});

test("malformed economic dates never throw or become share observations", () => {
  for (const d of ["2026-13-99", "not-a-date", "2026-02-30"]) {
    const p = raw();
    p.outstandingShares.quarterly.q.dateFormatted = d;
    assert.equal(report(p).evidence.reportedShareObservation, undefined);
  }
});

test("synthetic IREN HIMS CIFR NBIS normalize dated shares into automatic revenue scenarios without injected listing dates", async () => {
  const { researchOutlook } = await import("../lib/outlook.ts");
  for (const symbol of ["IREN", "HIMS", "CIFR", "NBIS"]) {
    const p = raw();
    p.General.Code = symbol;
    p.Highlights = { RevenueTTM: 1e9 };
    p.Financials.Income_Statement.yearly = {
      y: { date: "2026-06-30", filing_date: "2026-08-01", totalRevenue: 1e9 },
    };
    p.Financials.Balance_Sheet = {
      currency_symbol: "USD",
      quarterly: {
        q: {
          date: "2026-09-30",
          filing_date: "2026-11-01",
          cash: 1e8,
          shortLongTermDebtTotal: 2e8,
        },
      },
    };
    p.Earnings = {
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
    };
    const r = {
      ...normalizeEodFundamentals(symbol, p, observedAt),
      retrievedAt: observedAt,
      quote: {
        price: 25,
        currency: "USD",
        asOf: "2026-11-06T21:00:00Z",
        stale: false,
      },
      history: [],
    };
    assert.equal(r.evidence.listingObservations, undefined);
    assert.match(
      r.evidence.reportedShareObservation.sourceField,
      /outstandingShares/,
    );
    const result = researchOutlook(r);
    assert.equal(result.available, true, `${symbol}: ${result.reason}`);
    assert.equal(
      result.shares,
      100000000,
      "dated count, not undated101m snapshot",
    );
    assert.equal(result.basis, "revenue");
    assert.equal(result.cases.length, 3);
    assert.match(result.caveat, /Dates differ/);
  }
});
