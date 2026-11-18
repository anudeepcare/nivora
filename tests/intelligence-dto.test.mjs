import test from "node:test";
import assert from "node:assert/strict";
import {
  intelligenceData,
  publicIntelligence,
} from "../lib/intelligence-dto.ts";
import { intelligenceView } from "../lib/sentisense-view.ts";
import { SENTISENSE_DATASETS } from "../lib/sentisense-api.ts";
test("unknown datasets and nested objects at scalar leaves fail closed", () => {
  assert.equal(intelligenceData("futureEndpoint", { score: 99 }), null);
  assert.deepEqual(
    intelligenceData("profile", {
      ticker: "APP",
      kind: "STOCK",
      description: { score: 3 },
      score: 99,
    }),
    { ticker: "APP", kind: "STOCK" },
  );
  const result = publicIntelligence({
    dataset: "consensus",
    status: "available",
    secret: 99,
    data: { targetMean: 100, sentiment: 5 },
  });
  assert.deepEqual(result, {
    dataset: "consensus",
    status: "available",
    data: { targetMean: 100 },
  });
});
test("all generic datasets remove unknown fields instead of passing through", () => {
  for (const dataset of SENTISENSE_DATASETS) {
    const value = intelligenceData(dataset, {
      sentiment: "SECRET",
      score: 99,
      nested: { sentiment: "SECRET" },
    });
    assert.doesNotMatch(JSON.stringify(value), /SECRET|"score"|"nested"/);
  }
});
test("consumed financial units, dates, zero and negative observations survive projection", () => {
  const examples = {
    estimates: {
      ticker: "APP",
      estimates: [
        {
          periodType: "ANNUAL",
          fiscalPeriodEnd: "2026-12-31",
          estimateMean: 0,
          revenueMean: 100,
          numberOfAnalysts: 4,
        },
      ],
      surprises: [
        {
          periodLabel: "Q1",
          reportDate: "2026-03-31",
          actualEps: -1,
          surprisePct: 0,
        },
      ],
    },
    holders: {
      ticker: "APP",
      reportDate: "2026-09-30",
      holders: [
        {
          filerName: "Fund",
          shares: 100,
          valueUsd: 10,
          pctOfClassOutstanding: 0,
          comparisonStatus: "AVAILABLE",
          sharesChange: -2,
        },
      ],
    },
    options: {
      asOf: "2026-11-17",
      latest: { atmIv: 0.4, callVol: 0, putVol: 10, expectedMove1d: 0.01 },
      context: { ivRank1y: 23 },
      oiWalls: { maxPain: 100 },
      unusual: [
        {
          contract: "APP1",
          expiry: "2026-12-18",
          type: "call",
          strike: 100,
          volume: 0,
          oi: 10,
          premium: 100,
        },
      ],
    },
    kpis: {
      kpis: [
        {
          id: "users",
          name: "Users",
          unit: "users",
          sourceRef: "Annual filing",
          values: [
            { date: "2026-09-30", period: "Q3", value: 10, isEstimate: false },
          ],
        },
      ],
    },
    fundamentalsAnnual: {
      periods: [
        {
          fiscalPeriod: "FY",
          periodEndDate: "2025-12-31",
          reportedCurrency: "EUR",
          revenue: 100,
          operatingIncome: -10,
          freeCashFlow: 0,
        },
      ],
    },
    optionsIntraday: {
      session: "2026-11-17",
      delayMinutes: 15,
      series: [
        {
          cycle: 1,
          asOf: 1794873600,
          asOfEt: "10:00",
          atmIv: 0.3,
          callVol: 0,
          putVol: 20,
        },
      ],
    },
  };
  for (const [dataset, data] of Object.entries(examples))
    assert.deepEqual(
      intelligenceView(dataset, intelligenceData(dataset, data)),
      intelligenceView(dataset, data),
      dataset,
    );
});
test("ETF linked identities and story citations retained without arbitrary nested fields", () => {
  assert.deepEqual(
    intelligenceData("etfHoldings", {
      ticker: "SPY",
      asOfDate: "2026-11-17",
      partial: true,
      holdings: [
        {
          ticker: "ROG",
          linkedTicker: null,
          name: "Roche",
          weightPct: 2,
          score: 10,
        },
      ],
    }),
    {
      ticker: "SPY",
      asOfDate: "2026-11-17",
      partial: true,
      holdings: [
        { ticker: "ROG", linkedTicker: null, name: "Roche", weightPct: 2 },
      ],
    },
  );
  const story = intelligenceData("storyDetail", {
    id: "story1",
    narrativeBody: "Authored story",
    citationLinks: {
      doc1: "https://example.com/article",
      score: 99,
      doc2: { score: 4 },
    },
    timeline: [{ publishedAt: 1, content: "Update", sentiment: 8 }],
    sentiment: 9,
  });
  assert.deepEqual(story.citationLinks, {
    doc1: "https://example.com/article",
  });
  assert.equal(story.timeline[0].content, "Update");
  assert.doesNotMatch(JSON.stringify(story), /sentiment|score/);
});
test("malformed truthy basis flags stay fail-closed without leaking their object", () => {
  const estimates = {
    surprises: [
      {
        reportDate: "2026-11-17",
        surprisePct: 25,
        surpriseFlag: { reason: "INCOMPATIBLE_BASIS", score: 99 },
      },
    ],
  };
  const projected = intelligenceData("estimates", estimates);
  assert.equal(projected.surprises[0].surpriseFlag, true);
  assert.doesNotMatch(
    JSON.stringify(intelligenceView("estimates", projected)),
    /25%/,
  );
  assert.doesNotMatch(JSON.stringify(projected), /INCOMPATIBLE_BASIS|score/);
  const insiders = [
    {
      insiderName: "Officer",
      pricePerShare: 55,
      securityBasis: { reason: "UNKNOWN_UNITS", score: 99 },
    },
  ];
  const safe = intelligenceData("insiders", insiders);
  assert.equal(safe[0].securityBasis, true);
  assert.doesNotMatch(
    JSON.stringify(intelligenceView("insiders", safe)),
    /55|Price per share/,
  );
  assert.doesNotMatch(JSON.stringify(safe), /UNKNOWN_UNITS|score/);
});

test("public options DTO preserves limited print summary through the actual presentation boundary", async () => {
  const { optionsPositioning } = await import("../lib/options-positioning.ts");
  const result = publicIntelligence({
    dataset: "options",
    status: "preview",
    isPreview: true,
    data: {
      asOf: "2026-11-18",
      largePrintCount: 4,
      largestPrintPctl: 88,
      secret: "never",
    },
  });
  assert.equal(result.isPreview, true);
  assert.deepEqual(optionsPositioning(result.data).prints, {
    count: 4,
    percentile: 88,
  });
  assert.ok(!JSON.stringify(result).includes("never"));
  const bad = publicIntelligence({
    dataset: "options",
    status: "available",
    data: { largePrintCount: { secret: 4 }, largestPrintPctl: [88] },
  });
  assert.deepEqual(optionsPositioning(bad.data).prints, {
    count: null,
    percentile: null,
  });
});
