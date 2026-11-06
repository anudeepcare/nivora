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
  // Explicit economic observation dates are synthetic fixture data; General's
  // dataset update date alone must never populate these in normalization.
  normalized.evidence.listingObservations = {
    marketCap: { asOf: "2026-10-16", currency: "USD", shareBasis: symbol },
    shares: { asOf: "2026-10-16", unit: "shares", shareBasis: symbol },
  };
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

test("a complete revenue forecast remains usable when a nearer incomplete forecast is present", () => {
  const r = input();
  const good = {
    ...r.evidence.estimates[0],
    date: "2028-12-31",
    period: "FY2028",
  };
  r.evidence.estimates = [
    { ...good, date: "2029-10-17", period: "FY2029", revenueLow: null },
    good,
  ];
  const result = researchOutlook(r);
  assert.equal(result.available, true);
  assert.equal(result.end, "2028-12-31");
});
test("an unmatched newer cash observation does not hide the latest complete cash/debt pair", () => {
  const r = input();
  const cash = r.facts.find((x) => x.metric === "cash");
  r.facts.push({
    ...cash,
    end: "2026-09-30",
    filed: "2026-10-10",
    accession: "new-incomplete-balance",
    value: 250e6,
  });
  const result = researchOutlook(r);
  assert.equal(result.available, true);
  assert.equal(result.balanceDate, "2026-06-30");
});

test("infrastructure suitability is selected from provider industry for arbitrary tickers", async () => {
  const { modelCoverage } = await import("../lib/research-depth.ts");
  for (const industry of [
    "Data Centers",
    "Bitcoin Mining",
    "Cryptocurrency Mining",
  ])
    assert.equal(
      modelCoverage("UNLISTED", "stock", { industry, sector: "Technology" })
        .family,
      "infrastructure",
    );
  assert.equal(
    modelCoverage("UNLISTED", "stock", {
      industry: "Software - Application",
      sector: "Technology",
    }).family,
    "operating-company",
  );
});

test("uploaded IREN has no field-date bridge; a synthetic dated extension can exercise calculated EV arithmetic", async () => {
  const { readFile } = await import("node:fs/promises");
  const r = JSON.parse(
    await readFile(
      new URL("./fixtures/iren-observed-20261019.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(researchOutlook(r).available, false);
  r.evidence.listingObservations = {
    marketCap: {
      asOf: r.quote.asOf,
      currency: "USD",
      shareBasis: r.company.symbol,
    },
    shares: {
      asOf: r.quote.asOf,
      unit: "shares",
      shareBasis: r.company.symbol,
    },
  };
  const result = researchOutlook(r);
  assert.equal(result.available, true);
  const shares = 394058648,
    // The deterministic accession tie break selects the quarterly observation
    // (5,895,600,000 cash), whose date equals the annual observation's date.
    netDebt = 7839600000 - 5895600000;
  const calculated = (shares * 28.19 + netDebt) / 707006976;
  assert(Math.abs(result.cases[1].multiple - calculated) < 1e-9);
  assert(
    Math.abs(
      result.cases[1].target -
        (7411105890 * calculated - netDebt) / (shares * 1.1),
    ) < 1e-6,
  );
  assert.match(result.caveat, /calculated.*multiple/i);
  const { researchBrief } = await import("../lib/research-brief.ts");
  assert.equal(researchBrief(r).scenario.calculatedMultiple, true);
  for (const symbol of ["QATEST", "NBIS", "TE"]) {
    const shared = structuredClone(r);
    shared.company.symbol = symbol;
    shared.evidence.listingObservations.marketCap.shareBasis = symbol;
    shared.evidence.listingObservations.shares.shareBasis = symbol;
    shared.evidence.profile.industry = "Data Centers";
    assert.equal(researchOutlook(shared).available, true);
  }
  const noSupport = structuredClone(r);
  noSupport.facts = noSupport.facts.filter((f) => f.metric !== "revenue");
  assert.equal(researchOutlook(noSupport).available, false);
  const invalid = structuredClone(r);
  invalid.evidence.ownership.outstanding = 394;
  assert.equal(researchOutlook(invalid).available, false);
  const wrongRevenue = structuredClone(r);
  wrongRevenue.evidence.highlights.RevenueTTM /= 1000;
  assert.equal(researchOutlook(wrongRevenue).available, false);
});
