import { companyRelationships } from "./company-relationships.ts";
import { researchReport } from "./sentisense-report.ts";
import type { SentiSenseDataset, SentiSenseResult } from "./sentisense-api";
/** Closed response schemas. Scalar leaves cannot smuggle nested provider objects. */
type Shape = true | { [key: string]: Shape } | readonly [Shape];
const fields = (names: string): Record<string, Shape> =>
  Object.fromEntries(
    names
      .split(" ")
      .filter(Boolean)
      .map((k) => [k, true]),
  );
const meta = fields(
  "ticker symbol asOf updatedAt updatedAtEpoch lastUpdated fetchedAt reportedCurrency",
);
const withMeta = (
  names: string,
  nested: Record<string, Shape> = {},
): Shape => ({ ...meta, ...fields(names), ...nested });
const metrics = fields("atmIv pcVol pcOi callVol putVol expectedMove1d");
const series: Shape = {
  ...metrics,
  ...fields("date asOf asOfEt cycle unusualCount"),
};
const statements = fields(
  "fiscalPeriod fiscalYear periodEndDate filingDate periodMonths reportedCurrency revenue operatingIncome netIncome epsBasic epsDiluted operatingCashFlow capitalExpenditure freeCashFlow totalAssets totalLiabilities totalEquity",
);
const listSchemas: Partial<Record<SentiSenseDataset, Shape>> = {
  institutionalActivists: fields(
    "filerCik filerName ticker companyName shares valueUsd changeType sharesChange sharesChangePct filedDate reportDate",
  ),
  politicians: fields(
    "politicianName disclosureDate transactionDate owner transactionType amountRange assetDescription chamber",
  ),
  insiders: fields(
    "insiderName filedDate transactionDate insiderTitle transactionCode securityTitle securityBasis sharesTransacted pricePerShare totalValue",
  ),
  earnings: {
    ...fields("headline fiscalPeriod reportDate guidance summaryMd"),
    kpiHighlights: [fields("label value yoy")],
  },
  filingChanges: {
    ...fields("formType section filedAt reportDate noMaterialChanges edgarUrl"),
    diff: {
      ...fields("paragraphsAdded paragraphsRemoved paragraphsModified"),
      blocks: [fields("op oldExcerpt newExcerpt")],
    },
  },
  analystActions: fields(
    "firm actionDate actionType fromGrade toGrade priorPriceTarget priceTarget",
  ),
  stockEtfs: fields("etfName etfTicker asOfDate weightPct"),
  kpiTypes: fields("id name category chartType"),
};
const schemas: Partial<Record<SentiSenseDataset, Shape>> = {
  institutionProfile: {
    ...fields(
      "filerCik displayName filerCategory latestReportDate totalValueUsd holdingsCount positionsHeld quartersTracked comparisonStatus comparisonReportDate returnedCount offset multiCikRollup childCikCount",
    ),
    holdings: [
      fields(
        "ticker companyName shares valueUsd portfolioWeight changeType sharesChange sharesChangePct",
      ),
    ],
  },
  institutionHistory: {
    ...fields("filerCik displayName"),
    quarters: [
      fields(
        "reportDate label value status comparisonStatus comparisonReportDate totalValueUsd positionsHeld top10Pct newPositions increasedPositions decreasedPositions soldOutPositions boughtUsd trimmedUsd exitedUsd netFlowUsd priceEffectUsd",
      ),
    ],
  },

  consensus: withMeta(
    "consensusLabel targetMean targetLow targetHigh numberOfAnalysts currency",
  ),
  etfAnalyst: withMeta("asOfDate computedAt", {
    coverage: fields(
      "holdingsCount holdingsCovered weightCovered partial totalKnownHoldings",
    ),
    weightedConsensus: fields("upsidePercent consensusLabel totalAnalysts"),
  }),
  etfHoldings: withMeta("asOfDate partial totalHoldings totalKnownHoldings", {
    holdings: [fields("ticker name linkedTicker weightPct exchange")],
  }),
  estimates: withMeta("", {
    estimates: [
      fields(
        "periodType fiscalPeriodEnd periodLabel estimateLow estimateMean estimateHigh numberOfAnalysts revenueMean numberOfAnalystsRevenue",
      ),
    ],
    surprises: [
      fields(
        "periodLabel reportDate actualEps estimateEps surpriseFlag surprisePct",
      ),
    ],
  }),
  holders: withMeta("reportDate holderCount totalCount partial isPending", {
    holders: [
      fields(
        "filerName filerCategory shares valueUsd pctOfClassOutstanding comparisonStatus sharesChange sharesChangePct changeType",
      ),
    ],
  }),
  documents: withMeta("", { documents: [fields("sourceName published url")] }),
  options: withMeta("ivRank1y maxPain", {
    ...metrics,
    latest: metrics,
    context: fields("ivRank1y"),
    oiWalls: {
      ...fields("expiry maxPain totalCallOi totalPutOi"),
      callWalls: [fields("strike oi")],
      putWalls: [fields("strike oi")],
    },
    unusual: [
      fields(
        "contract expiry type strike volume oi volOiRatio premium oiConfirmation",
      ),
    ],
  }),
  consensusHistory: withMeta("", {
    history: [
      fields(
        "snapshotDate targetLow targetMean targetHigh numberOfAnalysts countsObserved",
      ),
    ],
  }),
  analystCoverage: withMeta("", {
    coverage: [
      {
        ...fields("firm noteCount"),
        analysts: [fields("name")],
        latestNote: fields("publishedDate priceTarget newsUrl"),
        firmRating: fields("date rating"),
      },
    ],
  }),
  earningsReactions: withMeta("", {
    reactions: [fields("reportDate timing priorClose nextClose movePct")],
  }),
  ownershipHistory: withMeta("", {
    quarters: [
      fields(
        "label value reportDate status holderCount totalInstitutionalShares totalInstitutionalValue institutionalOwnershipPct",
      ),
    ],
  }),
  optionsHistory: withMeta("window", { series: [series] }),
  optionsIntraday: withMeta("session live delayMinutes cycles missingCycles", {
    series: [series],
  }),
  kpis: withMeta("", {
    kpis: [
      {
        ...fields(
          "name id unit category displayFormat chartType sourceRef discontinued discontinuedNote",
        ),
        values: [fields("period date value isEstimate")],
      },
    ],
  }),
  profile: withMeta(
    "name kind ceo sector industry country currency primaryExchange employees ipoDate marketCap homepageUrl description",
  ),
  fundamentalsCurrent: withMeta(
    "available reason quartersIncluded epsTTM revenueTTM peTTM psTTM",
  ),
  fundamentalsQuarterly: withMeta("timeframe", { periods: [statements] }),
  fundamentalsAnnual: withMeta("timeframe", { periods: [statements] }),
  shortInterest: withMeta("", {
    dataPoints: [
      fields("settlementDate shortInterest daysToCover avgDailyVolume"),
    ],
  }),
  shortVolume: withMeta("", {
    dataPoints: [fields("date shortVolume totalVolume shortVolumeRatio")],
  }),
  float: withMeta("effectiveDate freeFloat freeFloatPercent"),
  tickerStories: [
    {
      ...fields("id brokeAt"),
      tickers: [true],
      cluster: fields("title storySource clusteredAt clusterSize isLive"),
    },
  ],
  storyDetail: {
    ...fields(
      "id title storySource summarizedContent narrativeBody bullishView bearishView archived",
    ),
    tickers: [true],
    timeline: [fields("publishedAt updateType content")],
  },
};
function project(value: unknown, shape: Shape): unknown {
  if (value === null) return null;
  if (shape === true)
    return ["string", "boolean"].includes(typeof value) ||
      (typeof value === "number" && Number.isFinite(value))
      ? value
      : undefined;
  if (Array.isArray(shape))
    return Array.isArray(value)
      ? value.map((v) => project(v, shape[0])).filter((v) => v !== undefined)
      : undefined;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const data = value as Record<string, unknown>,
    out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(shape)) {
    if (!Object.hasOwn(data, key)) continue;
    // Coverage/basis flags suppress incompatible numbers. Unknown truthy shapes
    // remain a suppression flag, never forwarded as raw provider objects.
    const v =
      ["surpriseFlag", "securityBasis"].includes(key) &&
      data[key] &&
      typeof data[key] === "object"
        ? true
        : project(data[key], child);
    if (v !== undefined) out[key] = v;
  }
  return out;
}
export function intelligenceData(
  dataset: SentiSenseDataset,
  data: unknown,
): unknown {
  if (data == null) return null;
  if (dataset === "relationships") return companyRelationships(data);
  if (dataset === "aiReport") return researchReport(data);
  const row = listSchemas[dataset];
  if (row)
    return Array.isArray(data)
      ? project(data, [row])
      : project(data, { results: [row] });
  const shape = schemas[dataset];
  if (!shape) return null; // New adapter datasets cannot escape until explicitly reviewed.
  const result = project(data, shape) ?? null;
  if (dataset === "storyDetail" && result && typeof result === "object") {
    const citations = (data as Record<string, unknown>).citationLinks;
    (result as Record<string, unknown>).citationLinks = Object.fromEntries(
      Object.entries(
        citations && typeof citations === "object" ? citations : {},
      ).filter(
        ([k, v]) =>
          /^doc\d+$/.test(k) && typeof v === "string" && /^https?:\/\//.test(v),
      ),
    );
  }
  return result;
}
export function publicIntelligence(result: SentiSenseResult): SentiSenseResult {
  const envelope = project(
    result,
    fields(
      "symbol dataset source entitlement commercialDisplay totalCount status asOf retrievedAt isPreview sampleCompany retryAfterSeconds",
    ),
  ) as Omit<SentiSenseResult, "data">;
  return { ...envelope, data: intelligenceData(result.dataset, result.data) };
}
