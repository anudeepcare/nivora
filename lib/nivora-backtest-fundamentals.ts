// Reconstructs the same shape app/api/company/[symbol]/route.ts returns (rawMetrics,
// fundamentalSignal, fiveYearRecord), but AS OF A HISTORICAL DATE, using only SEC XBRL
// facts whose `filed` date is <= asOfDate. This is the single most important piece of
// backtest infrastructure: get this wrong and every backtest number is fiction (you'd be
// scoring January using data that wasn't published until August).
//
// SEC's companyfacts payload includes a `filed` date on every fact (the date the filing
// that contained that number was actually submitted to EDGAR) — that's what we filter on,
// NOT the fiscal period end date. A company's Q1 numbers are usually not public until
// 4-8 weeks after the quarter ends; using the period-end date instead of the filed date
// is the most common way people accidentally build a lookahead-biased backtest.

const TAX = ["us-gaap", "ifrs-full"];

type Fact = {val: number; end: string; filed: string; form: string};

function factsFor(facts: any, tags: string[]): Fact[] {
  for (const tax of TAX) {
    for (const tag of tags) {
      const f = facts?.[tax]?.[tag];
      if (!f) continue;
      for (const arr of Object.values(f.units || {})) {
        if (Array.isArray(arr) && arr.length) return arr as Fact[];
      }
    }
  }
  return [];
}

/** Only facts that were actually public knowledge as of `asOfDate` (ISO date string). */
function knownAsOf(facts: Fact[], asOfDate: string, forms: string[]): Fact[] {
  return facts.filter(x => forms.includes(x.form) && x.val != null && String(x.filed) <= asOfDate)
    .sort((a, b) => String(a.filed).localeCompare(String(b.filed)));
}

function latestKnown(facts: any, tags: string[], asOfDate: string): number | null {
  const known = knownAsOf(factsFor(facts, tags), asOfDate, ["10-K", "10-Q", "20-F", "6-K", "40-F"]);
  return known.at(-1)?.val ?? null;
}

function annualSeriesKnown(facts: any, tags: string[], asOfDate: string) {
  const known = knownAsOf(factsFor(facts, tags), asOfDate, ["10-K", "20-F", "40-F"]);
  const byEnd = new Map<string, Fact>();
  for (const x of known) byEnd.set(String(x.end), x); // last-filed wins per period (handles restatements correctly: only restatements filed by asOfDate count)
  return [...byEnd.values()].sort((a, b) => String(a.end).localeCompare(String(b.end))).slice(-5);
}

function growthKnown(facts: any, tags: string[], asOfDate: string): number | null {
  const a = annualSeriesKnown(facts, tags, asOfDate);
  if (a.length < 2) return null;
  const n = +a.at(-1)!.val, p = +a.at(-2)!.val;
  return p ? ((n / p) - 1) * 100 : null;
}

function trendLabel(values: number[]): string {
  if (values.length < 2) return "Limited";
  let up = 0, down = 0;
  for (let i = 1; i < values.length; i++) { if (values[i] > values[i - 1]) up++; else if (values[i] < values[i - 1]) down++; }
  return up >= Math.max(2, values.length - 2) ? "Strong" : up > down ? "Improving" : down > up ? "Weakening" : "Mixed";
}
const score100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const REV_TAGS = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet", "Revenue", "RevenueFromContractsWithCustomers"];
const NI_TAGS = ["NetIncomeLoss", "ProfitLoss", "ProfitLossFromContinuingOperations"];
const CASH_TAGS = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalents"];
const ASSETS_TAGS = ["Assets", "AssetsCurrent"];
const LIAB_TAGS = ["Liabilities", "LiabilitiesCurrent"];
const OPCASH_TAGS = ["NetCashProvidedByUsedInOperatingActivities", "CashFlowsFromUsedInOperatingActivities"];
const CAPEX_TAGS = ["PaymentsToAcquirePropertyPlantAndEquipment", "PurchaseOfPropertyPlantAndEquipment"];
const GROSS_TAGS = ["GrossProfit", "GrossProfitLoss"];
const OPINCOME_TAGS = ["OperatingIncomeLoss", "ProfitLossFromOperatingActivities"];

/**
 * `companyFacts` is the raw JSON from https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
 * (fetch this ONCE per symbol, then call this function for many historical asOfDate values —
 * do not re-fetch per date, SEC will rate-limit you and it's wasted work since the raw facts
 * don't change).
 */
export function pointInTimeFundamentals(companyFacts: any, asOfDate: string) {
  const facts = companyFacts?.facts;
  const rev = latestKnown(facts, REV_TAGS, asOfDate) ?? (annualSeriesKnown(facts, REV_TAGS, asOfDate).at(-1)?.val ?? null);
  const ni = latestKnown(facts, NI_TAGS, asOfDate);
  const cash = latestKnown(facts, CASH_TAGS, asOfDate);
  const assets = latestKnown(facts, ASSETS_TAGS, asOfDate);
  const liab = latestKnown(facts, LIAB_TAGS, asOfDate);
  const opCash = latestKnown(facts, OPCASH_TAGS, asOfDate);
  const capex = latestKnown(facts, CAPEX_TAGS, asOfDate);
  const gross = latestKnown(facts, GROSS_TAGS, asOfDate);
  const opIncome = latestKnown(facts, OPINCOME_TAGS, asOfDate);

  const revGrowth = growthKnown(facts, REV_TAGS, asOfDate);
  const niGrowth = growthKnown(facts, NI_TAGS, asOfDate);
  const fcf = opCash != null && capex != null ? +opCash - Math.abs(+capex) : null;
  const opMargin = rev && opIncome != null ? (+opIncome / +rev) * 100 : null;
  const grossMargin = rev && gross != null ? (+gross / +rev) * 100 : null;
  const leverage = assets && liab != null ? (+liab / +assets) * 100 : null;

  const revSeries = annualSeriesKnown(facts, REV_TAGS, asOfDate);
  const niSeries = annualSeriesKnown(facts, NI_TAGS, asOfDate);
  const opCashSeries = annualSeriesKnown(facts, OPCASH_TAGS, asOfDate);
  const years = [...new Set([...revSeries, ...niSeries].map(x => String(x.end).slice(0, 4)))].sort().slice(-5);
  const history = years.map(year => ({
    year,
    revenue: revSeries.find(x => String(x.end).startsWith(year))?.val ?? null,
    netIncome: niSeries.find(x => String(x.end).startsWith(year))?.val ?? null,
    operatingCashFlow: opCashSeries.find(x => String(x.end).startsWith(year))?.val ?? null
  }));
  const revVals = history.map(x => x.revenue).filter((x): x is number => x != null);
  const niVals = history.map(x => x.netIncome).filter((x): x is number => x != null);
  const revenueTrend = trendLabel(revVals);
  const profitableYears = niVals.length ? niVals.filter(x => x > 0).length / niVals.length : 0;
  const positiveCashYears = history.filter(x => x.operatingCashFlow != null).length
    ? history.filter(x => (x.operatingCashFlow ?? 0) > 0).length / history.filter(x => x.operatingCashFlow != null).length : 0;

  let fiveScore = 50;
  if (revenueTrend === "Strong") fiveScore += 18; else if (revenueTrend === "Improving") fiveScore += 10; else if (revenueTrend === "Weakening") fiveScore -= 12;
  fiveScore += (profitableYears - .5) * 28;
  fiveScore += (positiveCashYears - .5) * 18;
  if (opMargin != null) fiveScore += Math.max(-10, Math.min(12, (opMargin - 8) * .7));
  if (leverage != null) fiveScore += leverage < 55 ? 8 : leverage > 85 ? -10 : 0;

  const fiveYearRecord = {score: score100(fiveScore), years: history.length, revenueTrend, history};

  let score = 0;
  if (revGrowth != null) score += revGrowth > 15 ? 2 : revGrowth > 0 ? 1 : -1;
  if (ni != null) score += +ni > 0 ? 1 : -1;
  if (fcf != null) score += fcf > 0 ? 1 : -1;
  if (opMargin != null && opMargin > 12) score += 1;
  if (leverage != null) score += leverage < 65 ? 1 : leverage > 85 ? -1 : 0;
  if (cash != null && liab != null && +cash > +liab * .25) score += 1;
  const businessScore = score100(50 + score * 8 + (fiveYearRecord.score - 50) * .35);
  const fundamentalSignal = {score: businessScore, label: businessScore >= 72 ? "Strong" : businessScore < 45 ? "Weak / watch" : "Mixed"};

  return {
    rawMetrics: {revGrowth, niGrowth, fcf, opMargin, grossMargin, leverage},
    fundamentalSignal, fiveYearRecord,
    filingRisk: null, // TODO: reconstructing point-in-time filing-risk (S-3/424B5 dilution flags) needs the /submissions feed sliced the same way — not yet implemented, see docs/backtest-design.md
    dataAsOf: asOfDate
  };
}
