import test from "node:test";
import assert from "node:assert/strict";
import { financialPeriods } from "../lib/engine.ts";
import { latestFinancialEvidence } from "../lib/analysis.ts";
import { ttmPeriods } from "../lib/research-depth.ts";
import { researchBrief } from "../lib/research-brief.ts";
import { researchOutlook } from "../lib/outlook.ts";
import { metricEvidence } from "../lib/research-integrity.ts";

const fact = (metric, value, extra = {}) => ({
  id: metric,
  metric,
  value,
  unit: "USD",
  currency: "USD",
  start: "2025-01-01",
  end: "2025-12-31",
  filed: "2026-02-01",
  accession: "annual",
  form: "10-K",
  sourceUrl: "https://example.com/annual",
  basis: "GAAP",
  scope: "annual",
  ...extra,
});
const annual = [
  fact("revenue", 100),
  fact("operatingIncome", 20),
  fact("netIncome", 15),
  fact("operatingCashFlow", 25),
  fact("capex", 5),
];
const research = (facts = annual) => ({
  company: {
    symbol: "TEST",
    name: "Test",
    assetType: "stock",
    currency: "USD",
    exchange: "NASDAQ",
  },
  quote: {
    price: 120,
    currency: "USD",
    asOf: "2026-10-26T20:00:00Z",
    stale: false,
    source: "fixture",
    session: "close",
    changePct: 0,
  },
  history: [],
  facts,
  filings: [],
  issues: [],
  retrievedAt: "2026-10-27T00:00:00Z",
  evidence: {
    updatedAt: "2026-10-26",
    reportingCurrency: "USD",
    profile: { sector: "Technology", industry: "Software" },
    ownership: { outstanding: 100 },
    highlights: { MarketCapitalization: 10000 },
    multiples: { ForwardPE: 20 },
    estimates: [
      {
        date: "2029-10-27",
        period: "FY2029",
        frequency: "annual",
        currency: "USD",
        epsLow: 5,
        eps: 6,
        epsHigh: 7,
        analysts: 10,
      },
    ],
  },
});
const quarterSeries = (currency, basis = "GAAP", value = 100) =>
  [
    ["01-01", "03-31"],
    ["04-01", "06-30"],
    ["07-01", "09-30"],
    ["10-01", "12-31"],
  ].map(([start, end]) =>
    fact("revenue", value, {
      id: `${currency}:${basis}:${end}`,
      currency,
      unit: currency,
      basis,
      start: `2025-${start}`,
      end: `2025-${end}`,
      scope: "quarterly",
    }),
  );

test("equal-end annual periods prefer complete evidence independent of fact order", () => {
  const partial = fact("revenue", 101, {
    id: "different-start",
    start: "2025-01-02",
  });
  for (const facts of [
    [...annual, partial],
    [partial, ...annual],
    [...annual, partial].reverse(),
  ]) {
    const result = latestFinancialEvidence(research(facts));
    assert.equal(result.latest.start, "2025-01-01");
    assert.equal(result.latest.margin, 20);
    assert.equal(result.latest.fcf, 20);
  }
});

test("same-end alternatives produce one comparable annual chart point per currency and basis", () => {
  const partial = fact("revenue", 101, {
    id: "different-start",
    start: "2025-01-02",
  });
  const rows = financialPeriods([...annual, partial], "annual", "2026-10-27");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].revenue, 100);
  assert.equal(rows[0].margin, 20);
});

test("an annual label cannot turn an incomplete or malformed date span into annual financial evidence", () => {
  for (const start of ["2025-10-01", "2025-13-01", "2026-01-01"]) {
    assert.deepEqual(
      financialPeriods(
        [fact("revenue", 100, { start })],
        "annual",
        "2026-10-27",
      ),
      [],
    );
  }
});

test("parallel currencies and accounting bases each retain their own four-quarter TTM", () => {
  const facts = [
    ...quarterSeries("USD"),
    ...quarterSeries("EUR", "IFRS", 80),
    ...quarterSeries("USD", "Provider", 110),
  ];
  for (const ordered of [facts, [...facts].reverse()]) {
    const rows = ttmPeriods(ordered, "2026-10-27");
    assert.equal(rows.length, 3);
    assert.deepEqual(
      Object.fromEntries(
        rows.map((p) => [`${p.currency}:${p.basis}`, p.revenue]),
      ),
      { "EUR:IFRS": 320, "USD:GAAP": 400, "USD:Provider": 440 },
    );
    assert.equal(
      latestFinancialEvidence(research(ordered)).latest.currency,
      "USD",
    );
  }
});

test("flow amounts with per-share units are never summed as currency amounts", () => {
  const rows = financialPeriods(
    [fact("revenue", 100, { unit: "USD/shares" }), fact("operatingIncome", 20)],
    "annual",
    "2026-10-27",
  );
  assert.equal(rows[0].revenue, null);
  assert.equal(rows[0].margin, null);
});

test("undated and older capitalization observations do not create a financial conflict after a price move", () => {
  const r = research();
  for (const input of [
    r,
    {
      ...r,
      evidence: {
        ...r.evidence,
        listingObservations: {
          marketCap: {
            asOf: "2026-09-01T20:00:00Z",
            currency: "USD",
            shareBasis: "TEST",
          },
          shares: {
            asOf: "2026-09-01T20:00:00Z",
            unit: "shares",
            shareBasis: "TEST",
          },
        },
      },
    },
  ]) {
    const brief = researchBrief(input);
    assert.equal(brief.conflicting, false);
    assert.equal(brief.businessNumbers.operatingMargin, 20);
    assert.equal(
      brief.checks.find((c) => c.label === "Listing reconciliation").status,
      "missing",
    );
    assert.equal(brief.scenarioEligible, true);
  }
});

test("an earnings scenario exposes the actual horizon and annualized returns to decision consumers", () => {
  const r = research();
  const result = researchBrief(r).scenario;
  assert.ok(result);
  assert.ok(Math.abs(result.years - 3.0006844626967832) < 1e-10);
  assert.ok(Math.abs(result.annual.base) < 1e-10);
  assert.ok(Math.abs(result.annual.low - -12.63926030969148) < 1e-8);
  assert.equal(researchOutlook(r).available, true);
});

test("only matching dated listing observations can establish a capitalization conflict", () => {
  const r = research();
  r.evidence.listingObservations = {
    marketCap: { asOf: r.quote.asOf, currency: "USD", shareBasis: "TEST" },
    shares: { asOf: r.quote.asOf, unit: "shares", shareBasis: "TEST" },
  };
  const brief = researchBrief(r);
  assert.equal(brief.conflicting, true);
  assert.equal(
    brief.checks.find((c) => c.label === "Listing reconciliation").status,
    "conflicting",
  );
  // EPS × P/E and reported operating metrics use none of the conflicting inputs.
  assert.equal(brief.scenarioEligible, true);
  assert.equal(brief.businessNumbers.fcf, 20);
  for (const change of [
    (x) => (x.evidence.listingObservations.marketCap.currency = "EUR"),
    (x) => (x.evidence.listingObservations.shares.shareBasis = "TEST.ADR"),
    (x) =>
      (x.evidence.listingObservations.shares.asOf = "2026-09-01T20:00:00Z"),
    (x) =>
      (x.evidence.listingObservations.marketCap.asOf = "2027-01-01T20:00:00Z"),
  ]) {
    const other = structuredClone(r);
    change(other);
    assert.equal(researchBrief(other).conflicting, false);
  }
});

test("a dated capitalization snapshot reconciles with its own price after the current quote moves", () => {
  const r = research();
  r.evidence.listingObservations = {
    marketCap: {
      asOf: "2026-09-01T20:00:00Z",
      currency: "USD",
      shareBasis: "TEST",
    },
    shares: {
      asOf: "2026-09-01T20:00:00Z",
      unit: "shares",
      shareBasis: "TEST",
    },
    price: {
      value: 100,
      asOf: "2026-09-01T20:00:00Z",
      currency: "USD",
      shareBasis: "TEST",
    },
  };
  const brief = researchBrief(r);
  assert.equal(brief.conflicting, false);
  assert.equal(
    brief.checks.find((c) => c.label === "Listing reconciliation").status,
    "available",
  );
});

function revenueResearch() {
  const r = research([
    fact("revenue", 400),
    fact("cash", 100, {
      scope: "instant",
      start: null,
      end: "2026-06-30",
      filed: "2026-08-01",
    }),
    fact("debt", 500, {
      scope: "instant",
      start: null,
      end: "2026-06-30",
      filed: "2026-08-01",
    }),
  ]);
  r.quote.price = 100;
  r.evidence.highlights.RevenueTTM = 400;
  r.evidence.multiples = { EnterpriseValue: 10400, EnterpriseValueRevenue: 26 };
  r.evidence.estimates = [
    {
      date: "2029-10-27",
      period: "FY2029",
      frequency: "annual",
      currency: "USD",
      revenueLow: 400,
      revenue: 600,
      revenueHigh: 800,
      analysts: 10,
    },
  ];
  r.evidence.listingObservations = {
    marketCap: { asOf: r.quote.asOf, currency: "USD", shareBasis: "TEST" },
    shares: { asOf: r.quote.asOf, unit: "shares", shareBasis: "TEST" },
  };
  return r;
}

test("share-dependent revenue cases require explicit listing dates rather than apparent numeric agreement", () => {
  const r = revenueResearch();
  delete r.evidence.listingObservations;
  assert.equal(researchOutlook(r).available, false);
});

test("revenue cash and debt cannot mix per-share units or different accounting bases", () => {
  for (const change of [
    (f) => (f.unit = "USD/shares"),
    (f) => (f.basis = "IFRS"),
    (f) => (f.scope = "annual"),
  ]) {
    const r = revenueResearch();
    change(r.facts.find((f) => f.metric === "debt"));
    assert.equal(researchOutlook(r).available, false);
  }
});

test("a price refresh uses its observation clock to measure scenario horizon and forecast age", () => {
  const r = research();
  r.priceObservedAt = "2026-11-27T00:00:00Z";
  r.quote.asOf = "2026-11-26T20:00:00Z";
  const result = researchOutlook(r);
  assert.equal(result.available, true);
  assert.ok(Math.abs(result.years - 2.915811088295688) < 1e-10);
  r.priceObservedAt = "2027-11-27T00:00:00Z";
  assert.equal(researchOutlook(r).available, false);
});

test("an old quote cannot drive scenario comparisons just because its stale flag was not refreshed", () => {
  const r = research();
  r.quote.asOf = "2026-09-01T20:00:00Z";
  assert.equal(researchOutlook(r).available, false);
});

test("TTM windows do not double count an overlapping day or silently omit a gap day", () => {
  for (const start of ["2025-03-31", "2025-04-02"]) {
    const rows = quarterSeries("USD");
    rows[1].start = start;
    assert.deepEqual(ttmPeriods(rows, "2026-10-27"), []);
  }
});

test("revenue scenarios preserve numeric guards for invalid shares, capitalization and balance amounts", () => {
  for (const change of [
    (r) => (r.evidence.ownership.outstanding = Infinity),
    (r) => (r.evidence.ownership.outstanding = -100),
    (r) => (r.evidence.highlights.MarketCapitalization = NaN),
    (r) => (r.evidence.highlights.MarketCapitalization = 0),
    (r) => (r.facts.find((f) => f.metric === "cash").value = -100),
    (r) => (r.facts.find((f) => f.metric === "debt").value = Infinity),
  ]) {
    const r = revenueResearch();
    change(r);
    assert.equal(researchOutlook(r).available, false);
    assert.equal(researchBrief(r).businessNumbers.revenue, 400);
  }
});

test("metric provenance does not call parallel reporting currencies or accounting bases conflicting", () => {
  const facts = [
    ...annual,
    ...annual.map((f) => ({
      ...f,
      id: `eur:${f.id}`,
      currency: "EUR",
      unit: "EUR",
      value: f.value * 0.8,
      sourceUrl: "https://example.com/eur",
    })),
    ...annual.map((f) => ({
      ...f,
      id: `provider:${f.id}`,
      basis: "Provider",
      value: f.value * 1.2,
      sourceUrl: "https://example.com/provider",
    })),
  ];
  for (const ordered of [facts, [...facts].reverse()]) {
    const result = metricEvidence(research(ordered), [
      "revenue",
      "operatingIncome",
    ]);
    assert.equal(result.status, "Reported");
    assert.equal(result.currency, "USD");
    assert.deepEqual(result.urls, ["https://example.com/annual"]);
  }
});

test("an unrelated same-end quarter cannot supply a missing annual metric", () => {
  const facts = [
    ...annual.filter((f) => f.metric !== "netIncome"),
    fact("netIncome", 10, {
      start: "2025-10-01",
      scope: "quarterly",
      sourceUrl: "https://example.com/quarter",
    }),
  ];
  const result = metricEvidence(research(facts), ["netIncome"]);
  assert.equal(result.status, "Unavailable");
  assert.deepEqual(result.urls, []);
});

test("metric provenance includes every contributing TTM quarter's source", () => {
  const facts = quarterSeries("USD").map((f, i) => ({
    ...f,
    sourceUrl: `https://example.com/quarter-${i + 1}`,
  }));
  const result = metricEvidence(research(facts), ["revenue"], true);
  assert.equal(result.status, "Calculated");
  assert.deepEqual(
    result.urls,
    [1, 2, 3, 4].map((i) => `https://example.com/quarter-${i}`),
  );
});

test("same-period conflicts on the selected basis remain conflicts while superseded revisions do not", () => {
  const conflicted = [...annual, fact("revenue", 200, { id: "conflict" })];
  assert.equal(
    metricEvidence(research(conflicted), ["revenue"]).status,
    "Conflicting",
  );
  const revised = [
    ...conflicted,
    fact("revenue", 110, {
      id: "revision",
      filed: "2026-03-01",
      accession: "amended",
    }),
  ];
  assert.equal(
    metricEvidence(research(revised), ["revenue"]).status,
    "Reported",
  );
});

// Independent historical reference: Microsoft FY2025 annual report, income statement.
// https://www.microsoft.com/investor/reports/ar25/ — USD millions normalized to USD.
test("published Microsoft FY2025 income amounts retain units and the reported operating margin", () => {
 const facts=[fact('revenue',281724e6),fact('operatingIncome',128528e6)].map(f=>({...f,start:'2024-07-01',end:'2025-06-30',filed:'2025-07-30',sourceUrl:'https://www.microsoft.com/investor/reports/ar25/'}));
 const row=financialPeriods(facts,'annual','2026-10-27')[0];
 assert.equal(row.revenue,281724000000);
 assert.equal(row.operatingIncome,128528000000);
 assert.ok(Math.abs(row.margin-45.62)<0.01);
 assert.equal(row.end,'2025-06-30');
 assert.equal(row.currency,'USD');
});
