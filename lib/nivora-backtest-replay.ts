// Runs your actual, unmodified nivora-investor.ts::buildInvestorDecision against
// point-in-time historical inputs, then measures the realized forward return vs a
// benchmark. Output rows are shaped to slot directly into summarizeCalibration()
// from nivora-calibration-v62.ts, so a backtest and live calibration read the same way.
//
// KNOWN LIMITATION (be upfront about this, don't paper over it): buildInvestorDecision
// also consumes `context` — analyst recommendations, earnings surprises, and a Street
// price target — which feed the `forward`, `earnings`, `streetChange` and `streetTarget`
// factors. Point-in-time analyst-estimate history is not available from free sources
// (Finnhub's recommendation-trends endpoint only returns current data, not a historical
// snapshot as of a past date). Two honest options, pick one before you trust results:
//   (a) Run the backtest with `context = null` (this file's default) — the decision engine
//       will treat analyst/earnings evidence as unavailable and re-weight around it, same
//       as it does live for a low-coverage name. This tests the fundamentals+technical core
//       honestly, but understates what live decisions look like once Street data is present.
//   (b) Buy or build a point-in-time estimates feed (e.g. a vendor with historical
//       IBES/estimize-style snapshots) and wire it into `contextAsOf()` below. Don't fake it
//       with today's analyst data reused across history — that's a lookahead leak.

import {computeTechnicalSnapshot, type Bar} from "./nivora-technical-engine";
import {pointInTimeFundamentals} from "./nivora-backtest-fundamentals";
import {buildInvestorDecision} from "./nivora-investor";
import type {CalibrationRow} from "./nivora-calibration-v62";

export type ReplayInput = {
  symbol: string;
  archetypeHintBars: Bar[];       // full ascending-order daily bars for the symbol, as far back as you have
  benchBars: Bar[] | null;        // same, for the benchmark (SPY, or BTC/USD for crypto)
  companyFacts: any;              // raw SEC companyfacts JSON, fetched once, reused across all asOfDates
  benchmarkSymbol: string | null;
};

export type ReplayRow = CalibrationRow & {
  symbol: string; asOfDate: string; horizonDays: number;
  action: string; thesisState: string; archetype: string; regime:string;
  entryPrice: number; exitPrice: number | null;
};

const clampIdx = (arr: Bar[], asOfDate: string) => {
  // Bars must be ascending by datetime. Find the last index whose date <= asOfDate.
  let idx = -1;
  for (let i = 0; i < arr.length; i++) { if (arr[i].datetime <= asOfDate) idx = i; else break; }
  return idx;
};

/**
 * Simulates a single decision at `asOfDate` and measures the outcome `horizonDays` later.
 * Returns null if there isn't enough history before OR enough forward data after asOfDate
 * to score it (edges of your dataset naturally get dropped — that's correct, not a bug).
 */
export function replayOne(input: ReplayInput, asOfDate: string, horizonDays: number): ReplayRow | null {
  const asOfIdx = clampIdx(input.archetypeHintBars, asOfDate);
  if (asOfIdx < 200) return null; // need real EMA200 history, matching the live route's minimum
  const rowsUpToDate = input.archetypeHintBars.slice(0, asOfIdx + 1);

  const benchIdx = input.benchBars ? clampIdx(input.benchBars, asOfDate) : -1;
  const benchRowsUpToDate = input.benchBars && benchIdx >= 40 ? input.benchBars.slice(0, benchIdx + 1) : null;

  const technical = computeTechnicalSnapshot(rowsUpToDate, benchRowsUpToDate, input.benchmarkSymbol);
  if (!technical) return null;

  const fundamentals = pointInTimeFundamentals(input.companyFacts, asOfDate);
  const market = {assetType: "stock", price: technical.price, scores: technical.scores, levels: technical.levels, volatility: technical.volatility, market: technical.market};
  const company = {rawMetrics: fundamentals.rawMetrics, fundamentalSignal: fundamentals.fundamentalSignal, fiveYearRecord: fundamentals.fiveYearRecord, filingRisk: fundamentals.filingRisk};
  const context = null; // see file header — swap in a real point-in-time estimates feed here if you have one

  const decision = buildInvestorDecision({market, company, context, owns: false});
  if (!decision) return null;

  // Forward outcome: exact-index horizon in trading days (not calendar days — matches how
  // your live paper-trading loop measures things, since markets are only open ~252 days/yr).
  const exitIdx = asOfIdx + horizonDays;
  const benchExitIdx = input.benchBars ? benchIdx + horizonDays : -1;
  if (exitIdx >= input.archetypeHintBars.length) return null; // not enough forward data yet — drop, don't extrapolate

  const entryPrice = input.archetypeHintBars[asOfIdx].close;
  const exitPrice = input.archetypeHintBars[exitIdx].close;
  const rawReturnPct = (exitPrice / entryPrice - 1) * 100;

  let benchReturnPct: number | null = null;
  if (input.benchBars && benchExitIdx >= 0 && benchExitIdx < input.benchBars.length) {
    benchReturnPct = (input.benchBars[benchExitIdx].close / input.benchBars[benchIdx].close - 1) * 100;
  }
  const alphaPct = benchReturnPct != null ? rawReturnPct - benchReturnPct : rawReturnPct;

  return {
    score: decision.thesisScore, alphaPct, archetype: decision.archetype,
    symbol: input.symbol, asOfDate, horizonDays,
    action: decision.today?.action||decision.action, thesisState: decision.thesisState,
    regime:technical.market.regime,
    entryPrice, exitPrice
  };
}

/** Runs replayOne across a list of dates for one symbol (e.g. every Friday over N years). */
export function replaySymbol(input: ReplayInput, asOfDates: string[], horizonDays: number): ReplayRow[] {
  const out: ReplayRow[] = [];
  for (const d of asOfDates) { const r = replayOne(input, d, horizonDays); if (r) out.push(r); }
  return out;
}
