import {summarizeCalibration, type CalibrationRow} from "./nivora-calibration-v62";
import type {ReplayRow} from "./nivora-backtest-replay";
import {bootstrapMeanCI,permutationMeanDifferencePValue} from "./nivora-statistics";

export type CostModel = {
  slippageBps: number;   // e.g. 15 = 0.15% adverse move between decision and fill, each way
  commissionBps: number; // e.g. 0 for most modern brokers, keep the field for completeness
};

export const DEFAULT_COST_MODEL: CostModel = {slippageBps: 15, commissionBps: 0};

/** Subtracts round-trip costs from alpha. Do this BEFORE you look at hit rate, not after. */
export function applyCosts(rows: ReplayRow[], cost: CostModel = DEFAULT_COST_MODEL): ReplayRow[] {
  const roundTripPct = (cost.slippageBps * 2 + cost.commissionBps * 2) / 100;
  return rows.map(r => ({...r, alphaPct: r.alphaPct - roundTripPct}));
}

/**
 * Splits a chronological list of decision dates into non-overlapping IN-SAMPLE / OUT-OF-SAMPLE
 * windows for walk-forward validation. Only ever tune weights on the in-sample side; the
 * out-of-sample side gets scored exactly once, with the version you already committed to.
 * Calling this again after seeing out-of-sample results and re-splitting is how backtests
 * quietly become curve-fit — don't.
 */
export function walkForwardSplit(sortedDates: string[], inSampleFraction = 0.6): {inSample: string[]; outOfSample: string[]} {
  const cut = Math.floor(sortedDates.length * inSampleFraction);
  return {inSample: sortedDates.slice(0, cut), outOfSample: sortedDates.slice(cut)};
}

export type BacktestReport = {
  overall: ReturnType<typeof summarizeCalibration>;
  byBucket: Array<{scoreBucket: string; n: number; hitRatePct: number; avgAlphaPct: number}>;
  byArchetype: Array<{archetype: string; n: number; hitRatePct: number; avgAlphaPct: number}>;
  byRegime: Array<{regime:string;n:number;hitRatePct:number;avgAlphaPct:number}>;
  actionBreakdown: Array<{action: string; n: number; avgAlphaPct: number}>;
  buySignals:{n:number;hitRatePct:number;avgAlphaPct:number;alphaConfidence95:{mean:number;low:number;high:number;iterations:number};evidenceStatus:"UNPROVEN"|"BACKTEST_EDGE"};
  byBuyPath:Array<{path:string;n:number;hitRatePct:number;avgAlphaPct:number}>;
  alphaConfidence95:{mean:number;low:number;high:number;iterations:number};
  vsRandomBaseline: {n: number; avgAlphaPct: number; meanDifferencePct:number; permutationPValue:number|null} | null;
  minimumSampleMet: boolean;
};

/**
 * `randomBaselineRows` (optional): replay the SAME dates/horizon but on a random symbol drawn
 * from the same universe, ignoring the decision engine's action entirely (i.e. "what if I'd
 * just bought a random stock in this universe on this date"). If NIVORA's avgAlphaPct isn't
 * clearly better than this, the "edge" is just universe selection or a rising market, not the model.
 */
export function buildBacktestReport(rows: ReplayRow[], minimum = 100, randomBaselineRows: CalibrationRow[] | null = null): BacktestReport {
  const overall = summarizeCalibration(rows, minimum);

  const bucketMap = new Map<string, ReplayRow[]>();
  for (const r of rows) { const b = `${Math.floor(r.score / 10) * 10}-${Math.floor(r.score / 10) * 10 + 9}`; (bucketMap.get(b) || bucketMap.set(b, []).get(b)!).push(r); }
  const byBucket = [...bucketMap.entries()].map(([scoreBucket, xs]) => ({scoreBucket, n: xs.length, hitRatePct: +(xs.filter(x => x.alphaPct > 0).length / xs.length * 100).toFixed(1), avgAlphaPct: +(xs.reduce((a, x) => a + x.alphaPct, 0) / xs.length).toFixed(2)})).sort((a, b) => a.scoreBucket.localeCompare(b.scoreBucket));

  const archMap = new Map<string, ReplayRow[]>();
  for (const r of rows) { const k = r.archetype || "unknown"; (archMap.get(k) || archMap.set(k, []).get(k)!).push(r); }
  const byArchetype = [...archMap.entries()].map(([archetype, xs]) => ({archetype, n: xs.length, hitRatePct: +(xs.filter(x => x.alphaPct > 0).length / xs.length * 100).toFixed(1), avgAlphaPct: +(xs.reduce((a, x) => a + x.alphaPct, 0) / xs.length).toFixed(2)})).sort((a, b) => b.n - a.n);

  const regimeMap=new Map<string,ReplayRow[]>();
  for(const r of rows){const k=r.regime||"Unknown";(regimeMap.get(k)||regimeMap.set(k,[]).get(k)!).push(r)}
  const byRegime=[...regimeMap.entries()].map(([regime,xs])=>({regime,n:xs.length,hitRatePct:+(xs.filter(x=>x.alphaPct>0).length/xs.length*100).toFixed(1),avgAlphaPct:+(xs.reduce((a,x)=>a+x.alphaPct,0)/xs.length).toFixed(2)})).sort((a,b)=>b.n-a.n);

  const actionMap = new Map<string, ReplayRow[]>();
  for (const r of rows) { (actionMap.get(r.action) || actionMap.set(r.action, []).get(r.action)!).push(r); }
  const actionBreakdown = [...actionMap.entries()].map(([action, xs]) => ({action, n: xs.length, avgAlphaPct: +(xs.reduce((a, x) => a + x.alphaPct, 0) / xs.length).toFixed(2)})).sort((a, b) => b.n - a.n);

  const buyRows=rows.filter(x=>x.action==="BUY");
  const buyAlpha=buyRows.map(x=>x.alphaPct);
  const buyCI=bootstrapMeanCI(buyAlpha,Math.min(5000,Math.max(1000,buyRows.length*30)),.95,642);
  const buySignals={
    n:buyRows.length,
    hitRatePct:buyRows.length?+(buyRows.filter(x=>x.alphaPct>0).length/buyRows.length*100).toFixed(1):0,
    avgAlphaPct:buyRows.length?+(buyRows.reduce((a,x)=>a+x.alphaPct,0)/buyRows.length).toFixed(2):0,
    alphaConfidence95:buyCI,
    evidenceStatus:(buyRows.length>=30&&buyCI.low>0?"BACKTEST_EDGE":"UNPROVEN") as "UNPROVEN"|"BACKTEST_EDGE"
  };
  const buyPathMap=new Map<string,ReplayRow[]>();
  for(const r of buyRows){const k=String(r.buyPath||"UNSPECIFIED");(buyPathMap.get(k)||buyPathMap.set(k,[]).get(k)!).push(r)}
  const byBuyPath=[...buyPathMap.entries()].map(([path,xs])=>({path,n:xs.length,hitRatePct:+(xs.filter(x=>x.alphaPct>0).length/xs.length*100).toFixed(1),avgAlphaPct:+(xs.reduce((a,x)=>a+x.alphaPct,0)/xs.length).toFixed(2)})).sort((a,b)=>b.n-a.n);

  const alphaConfidence95=bootstrapMeanCI(rows.map(x=>x.alphaPct),Math.min(5000,Math.max(1000,rows.length*20)),.95,64);
  const vsRandomBaseline = randomBaselineRows && randomBaselineRows.length
    ? (()=>{const baselineAvg=+(randomBaselineRows.reduce((a,x)=>a+x.alphaPct,0)/randomBaselineRows.length).toFixed(2);const p=permutationMeanDifferencePValue(rows.map(x=>x.alphaPct),randomBaselineRows.map(x=>x.alphaPct),3000,64);return{n:randomBaselineRows.length,avgAlphaPct:baselineAvg,meanDifferencePct:+p.meanDifference.toFixed(2),permutationPValue:p.pValue}})()
    : null;

  return {overall, byBucket, byArchetype, byRegime, actionBreakdown, buySignals, byBuyPath, alphaConfidence95, vsRandomBaseline, minimumSampleMet: overall.status === "CALIBRATED"};
}
