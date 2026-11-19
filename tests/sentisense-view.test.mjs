import { intelligenceData } from "../lib/intelligence-dto.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { intelligenceView } from "../lib/sentisense-view.ts";
test("institutional changes require comparable quarters and never infer a percentage", () => {
  const view = intelligenceView("holders", {
    holders: [
      {
        filerName: "Fund",
        shares: 100,
        valueUsd: 5000,
        comparisonStatus: "INCOMPLETE_INPUT",
        sharesChangePct: 50,
      },
    ],
    holderCount: 300,
  });
  assert.equal(view.groups[0].rows[0].label, "Fund");
  assert.ok(!JSON.stringify(view).includes("50%"));
  assert.match(view.note, /subset/);
});
test("politician disclosures sort by filing date and preserve owner/range without exact transaction amounts", () => {
  const v = intelligenceView("politicians", [
    {
      politicianName: "Older",
      disclosureDate: "2026-11-01",
      transactionDate: "2026-11-01",
    },
    {
      politicianName: "Latest",
      disclosureDate: "2026-11-03",
      transactionDate: "2026-10-01",
      owner: "Spouse",
      amountRange: "$1,001–$15,000",
    },
  ]);
  assert.equal(v.groups[0].rows[0].label, "Latest");
  assert.match(JSON.stringify(v), /Spouse/);
  assert.match(JSON.stringify(v), /1,001/);
});
test("document timestamp is seconds, link protocols are restricted, no article title is fabricated", () => {
  const v = intelligenceView("documents", {
    documents: [
      {
        sourceName: "Reuters",
        published: 1794873600,
        url: "javascript:alert(1)",
        title: "Not in documented contract",
      },
    ],
  });
  assert.equal(v.groups[0].rows[0].label, "Reuters");
  assert.equal(v.groups[0].rows[0].href, null);
  assert.match(v.groups[0].rows[0].date, /2026-/);
  assert.doesNotMatch(JSON.stringify(v), /Not in documented/);
});
test("options preserve fractions and ratios, never infer trade direction or raw sentiment", () => {
  const v = intelligenceView("options", {
    latest: { atmIv: 0.42, pcVol: 1.2 },
    sentiment: 0.8,
    unusual: [{ contract: "TEST", volOiRatio: 2.5, premium: 1000 }],
  });
  assert.match(JSON.stringify(v), /42%/);
  assert.match(JSON.stringify(v), /2.5×/);
  assert.doesNotMatch(JSON.stringify(v), /bullish|"value":"buyer"|0.8/);
});
test("missing and zero estimates stay distinct, EPS and revenue use documented USD units", () => {
  const v = intelligenceView("estimates", {
    estimates: [
      { periodType: "CURRENT_QUARTER", estimateMean: 0, revenueMean: null },
    ],
    surprises: [],
  });
  assert.match(JSON.stringify(v), /\$0/);
  assert.doesNotMatch(JSON.stringify(v), /Revenue mean.*\$0/);
});
test("earnings render authored highlights, and raw injected object values never leak", () => {
  const v = intelligenceView("earnings", [
    {
      headline: "Quarter report",
      fiscalPeriod: "Q1 FY2026",
      kpiHighlights: [{ label: "Revenue", value: "$1B", yoy: "+4%" }],
      secretToken: "x",
    },
  ]);
  assert.match(JSON.stringify(v), /Revenue/);
  assert.doesNotMatch(JSON.stringify(v), /secretToken/);
});

test("all expanded documented sections produce meaningful records without generic JSON dumping", () => {
  const samples = {
    consensusHistory: {
      history: [
        { snapshotDate: "2026-11-01", targetMean: 100, countsObserved: false },
      ],
    },
    analystActions: {
      results: [{ firm: "Desk", actionDate: "2026-11-01", toGrade: "Hold" }],
    },
    analystCoverage: {
      coverage: [
        {
          firm: "Desk",
          noteCount: 0,
          firmRating: { rating: "Hold", date: "2026-11-01" },
        },
      ],
    },
    earningsReactions: {
      reactions: [{ reportDate: "2026-11-01", movePct: -1.77 }],
    },
    ownershipHistory: {
      quarters: [
        { label: "Q2 2026", reportDate: "2026-06-30", holderCount: 50 },
      ],
    },
    optionsHistory: { series: [{ date: "2026-11-01", atmIv: 0.3 }] },
    optionsIntraday: {
      session: "2026-11-01",
      series: [{ cycle: 1, asOfEt: "10:00 ET", atmIv: 0.3 }],
    },
    kpis: {
      kpis: [
        {
          name: "Subscribers",
          unit: "users",
          values: [{ period: "Q1", value: 100, isEstimate: true }],
        },
      ],
    },
  };
  for (const [id, data] of Object.entries(samples)) {
    const v = intelligenceView(id, data);
    assert.deepEqual(intelligenceView(id, intelligenceData(id, data)), v, id);
    assert.ok(
      v.groups.some((g) => g.rows.length),
      id,
    );
    assert.ok(
      v.groups.some((g) => g.rows.some((r) => r.cells.length)),
      id,
    );
  }
  assert.match(
    JSON.stringify(
      intelligenceView("earningsReactions", samples.earningsReactions),
    ),
    /-1.77%/,
  );
  assert.match(
    JSON.stringify(
      intelligenceView("consensusHistory", samples.consensusHistory),
    ),
    /Carried from prior/,
  );
});
test("EPS surprise uses true percent field, respects basis flags, and does not multiply already-percent values", () => {
  const data = {
    estimates: [],
    surprises: [
      {
        reportDate: "2026-11-01",
        actualEps: 1.2,
        estimateEps: 1,
        surprisePercent: 0.2,
        surprisePct: 20,
      },
    ],
  };
  assert.match(JSON.stringify(intelligenceView("estimates", data)), /20%/);
  data.surprises[0].surpriseFlag = "SIGN_FLIP";
  assert.doesNotMatch(
    JSON.stringify(intelligenceView("estimates", data)),
    /20%/,
  );
});

test("additional nine sections retain financial currencies, distinct short metrics and share-class weight meaning", () => {
  const samples = {
    profile: {
      ticker: "TEST",
      kind: "STOCK",
      name: "Test",
      country: "United States",
    },
    fundamentalsCurrent: {
      ticker: "TEST",
      available: true,
      reportedCurrency: "EUR",
      epsTTM: 2,
      quartersIncluded: 4,
    },
    fundamentalsQuarterly: {
      periods: [
        {
          fiscalPeriod: "Q2",
          fiscalYear: "2026",
          periodEndDate: "2026-06-30",
          reportedCurrency: "EUR",
          revenue: 20,
        },
      ],
    },
    fundamentalsAnnual: {
      periods: [
        {
          fiscalPeriod: "FY",
          fiscalYear: "2025",
          reportedCurrency: "JPY",
          revenue: 2000,
        },
      ],
    },
    shortInterest: {
      dataPoints: [
        { settlementDate: "2026-11-01", shortInterest: 100, daysToCover: 2 },
      ],
    },
    shortVolume: {
      dataPoints: [{ date: "2026-11-01", shortVolumeRatio: 45.2 }],
    },
    float: { ticker: "TEST", freeFloatPercent: 92.5 },
    stockEtfs: [{ etfTicker: "ETF", etfName: "Test ETF", weightPct: 8.5 }],
    kpiTypes: [{ id: "units", name: "Units sold", category: "operational" }],
  };
  for (const [id, data] of Object.entries(samples)) {
    assert.deepEqual(
      intelligenceView(id, intelligenceData(id, data)),
      intelligenceView(id, data),
      id,
    );
    assert.ok(
      intelligenceView(id, data).groups.some((g) => g.rows.length),
      id,
    );
  }
  assert.match(
    JSON.stringify(
      intelligenceView("fundamentalsQuarterly", samples.fundamentalsQuarterly),
    ),
    /20 EUR/,
  );
  assert.doesNotMatch(
    JSON.stringify(
      intelligenceView("fundamentalsQuarterly", samples.fundamentalsQuarterly),
    ),
    /\$20/,
  );
  assert.match(
    JSON.stringify(intelligenceView("shortVolume", samples.shortVolume)),
    /45.2%/,
  );
  assert.match(
    intelligenceView("stockEtfs", samples.stockEtfs).note,
    /share classes/,
  );
});
