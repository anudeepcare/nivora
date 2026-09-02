// Pure, side-effect-free extraction of the technical scoring logic that used to live
// inline in app/api/analyze/[symbol]/route.ts. Both the live API route and the backtest
// replay engine (nivora-backtest-replay.ts) call this SAME function, so a backtest result
// can never silently drift from what production actually computes.
//
// IMPORTANT: this function takes already-point-in-time-sliced bars. It does not fetch
// anything and does not know what "today" is. Callers are responsible for making sure
// `rows` and `benchRows` only contain bars that were actually known as of the decision date.

import {clamp, sma, rnd, ema, rsi, atr, stddev, macd, obv, slope, pct} from "./quant";

export type Bar = {datetime: string; open: number; high: number; low: number; close: number; volume: number};

export type TechnicalSnapshot = {
  price: number; changePct: number; volumeRatio: number;
  scores: {trend: number; momentum: number; flow: number; structure: number; entry: number; timing: number; risk: number; extension: number};
  labels: {trend: string; momentum: string; flow: string; structure: string; entry: string; risk: string; extension: string};
  levels: {preferredEntry: number; support: number; majorSupport: number; resistance: number; breakout: number; invalidation: number};
  volatility: {atr14: number; atrPct: number};
  market: {benchmark: string | null; benchmarkPrice: number | null; regime: string; score: number; relativeStrength: string; relative20: number};
  riskReward: number;
  indicatorVersion:"wilder-v1";
};

const qLabel = (n: number, good = 67, bad = 42) => (n >= good ? "Strong" : n < bad ? "Weak" : "Mixed");

/**
 * `rows` must be in ASCENDING chronological order (oldest first, matching the reversed
 * TwelveData response used in the live route), already truncated so the LAST element is
 * the bar for the decision date (the "as of" date). Do not pass future bars.
 */
export function computeTechnicalSnapshot(rows: Bar[], benchRows: Bar[] | null, benchmark: string | null): TechnicalSnapshot | null {
  if (!Array.isArray(rows) || rows.length < 40) return null;
  const c = rows.map(x => +x.close), h = rows.map(x => +x.high), l = rows.map(x => +x.low), v = rows.map(x => +x.volume || 0);
  const p = c.at(-1)!, prev = c.at(-2) ?? p;
  const e20 = ema(c, 20).at(-1)!, e50 = ema(c, 50).at(-1)!, e200 = ema(c, 200).at(-1)!;
  const rv = rsi(c), a = atr(rows), v20 = sma(v, 20), v5 = sma(v, 5);
  const ret5 = p / (c.at(-6) ?? p) - 1, ret20 = p / (c.at(-21) ?? p) - 1, ret60 = p / (c.at(-61) ?? p) - 1;
  const m = macd(c), sd20 = stddev(c, 20), bbZ = sd20 ? (p - sma(c, 20)) / (2 * sd20) : 0;
  const ov = obv(c, v), obvSlope = slope(ov, 10), volumeRatio = v20 ? v5 / v20 : 1;

  let bench20 = 0, bench60 = 0, marketTrend = 50, benchPrice: number | null = null;
  if (benchRows && benchRows.length >= 40) {
    const bc = benchRows.map(x => +x.close), bp = bc.at(-1)!;
    benchPrice = Number.isFinite(bp) ? bp : null;
    bench20 = bp / (bc.at(-21) ?? bp) - 1; bench60 = bp / (bc.at(-61) ?? bp) - 1;
    const be20 = ema(bc, 20).at(-1)!, be50 = ema(bc, 50).at(-1)!;
    marketTrend = clamp(50 + (bp > be20 ? 18 : -18) + (be20 > be50 ? 18 : -18) + bench20 * 80, 12, 88);
  }
  const rel20 = (ret20 - bench20) * 100, rel60 = (ret60 - bench60) * 100;

  const trend = clamp(50 + (p > e20 ? 11 : -11) + (e20 > e50 ? 14 : -14) + (e50 > e200 ? 13 : -13) + ret60 * 45 + rel60 * .6, 8, 94);
  const momentum = clamp(50 + (rv - 50) * .75 + ret20 * 125 + (m.hist > 0 ? 9 : -9) + ret5 * 70, 8, 94);
  const flow = clamp(50 + (volumeRatio - 1) * 36 + (obvSlope > 0 ? 10 : -10) + (p > (c.at(-6) ?? p) ? 7 : -7), 8, 94);
  const low60 = Math.min(...l.slice(-60)), high60 = Math.max(...h.slice(-60));
  const structure = clamp(30 + 70 * (p - low60) / (high60 - low60 || 1), 8, 94);

  const extATR = Math.abs(p - e20) / (a || p * .02);
  const extension = clamp(extATR * 32 + Math.max(0, Math.abs(bbZ) - .7) * 22, 5, 94);

  const nearestSupportCandidates = [e20, e50, ...l.slice(-80)].filter(x => x < p).sort((x, y) => y - x);
  const nearestResCandidates = [...h.slice(-80)].filter(x => x > p).sort((x, y) => x - y);
  const support = rnd(nearestSupportCandidates.find(x => p - x >= a * .35) ?? p - a * 1.35);
  const majorSupport = rnd(nearestSupportCandidates.find(x => x < support - a * .65) ?? p - a * 2.8);
  const invalidation = rnd(Math.max(low60, majorSupport - a * .95));
  const resistance = rnd(nearestResCandidates.find(x => x - p >= a * .35) ?? p + a * 1.35);
  const breakout = rnd(nearestResCandidates.find(x => x > resistance + a * .65) ?? p + a * 2.7);
  const preferredEntry = rnd(Math.max(majorSupport, (support + majorSupport) / 2));

  const riskToInv = Math.max(.01, p - invalidation), reward = Math.max(.01, resistance - p), rr = reward / riskToInv;
  const marketPenalty = marketTrend < 38 ? 9 : 0;
  const entry = clamp(trend * .18 + momentum * .15 + flow * .13 + structure * .14 + (100 - extension) * .24 + clamp(rr * 35) * .10 + clamp(rel20 + 50) * .06 - marketPenalty, 8, 94);
  const risk = clamp(24 + extension * .32 + (a / p) * 560 + (p - support > 2.4 * a ? 12 : 0) + (marketTrend < 38 ? 9 : 0), 8, 94);
  const marketRegime = marketTrend >= 63 ? "Supportive" : marketTrend < 38 ? "Risk-off" : "Mixed";
  const relativeStrength = rel20 >= 5 ? "Leading" : rel20 <= -5 ? "Lagging" : "In line";

  return {
    price: rnd(p), changePct: rnd(pct(p, prev)), volumeRatio: rnd(volumeRatio),
    scores: {trend: Math.round(trend), momentum: Math.round(momentum), flow: Math.round(flow), structure: Math.round(structure), entry: Math.round(entry), timing: Math.round(entry), risk: Math.round(risk), extension: Math.round(extension)},
    labels: {trend: qLabel(trend), momentum: qLabel(momentum), flow: qLabel(flow), structure: qLabel(structure), entry: entry >= 68 ? "Good" : entry < 48 ? "Poor" : "Improving", risk: risk < 40 ? "Lower" : risk < 70 ? "Moderate" : "High", extension: extension >= 65 ? "Stretched" : extension < 38 ? "Normal" : "Elevated"},
    levels: {preferredEntry, support, majorSupport, resistance, breakout, invalidation},
    volatility: {atr14: rnd(a), atrPct: rnd(a / p * 100)},
    market: {benchmark, benchmarkPrice: benchPrice != null ? rnd(benchPrice) : null, regime: marketRegime, score: Math.round(marketTrend), relativeStrength, relative20: rnd(rel20)},
    riskReward: rnd(rr),
    indicatorVersion:"wilder-v1"
  };
}
