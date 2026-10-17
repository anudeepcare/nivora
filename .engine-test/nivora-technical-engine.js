"use strict";
// Pure, side-effect-free extraction of the technical scoring logic that used to live
// inline in app/api/analyze/[symbol]/route.ts. Both the live API route and the backtest
// replay engine (nivora-backtest-replay.ts) call this SAME function, so a backtest result
// can never silently drift from what production actually computes.
//
// IMPORTANT: this function takes already-point-in-time-sliced bars. It does not fetch
// anything and does not know what "today" is. Callers are responsible for making sure
// `rows` and `benchRows` only contain bars that were actually known as of the decision date.
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTechnicalSnapshot = computeTechnicalSnapshot;
const quant_1 = require("./quant");
const qLabel = (n, good = 67, bad = 42) => (n >= good ? "Strong" : n < bad ? "Weak" : "Mixed");
function seededEma(values, period) {
    if (!values.length)
        return [];
    if (values.length < period)
        return new Array(values.length).fill(Number.NaN);
    const out = new Array(values.length).fill(Number.NaN);
    let seed = 0;
    for (let i = 0; i < period; i++)
        seed += values[i];
    seed /= period;
    out[period - 1] = seed;
    const k = 2 / (period + 1);
    for (let i = period; i < values.length; i++)
        out[i] = values[i] * k + out[i - 1] * (1 - k);
    return out;
}
function standardMacd(values) {
    const e12 = seededEma(values, 12), e26 = seededEma(values, 26);
    const line = values.map((_, i) => Number.isFinite(e12[i]) && Number.isFinite(e26[i]) ? e12[i] - e26[i] : Number.NaN);
    const valid = line.map((v, i) => ({ v, i })).filter(x => Number.isFinite(x.v));
    const vals = valid.map(x => x.v);
    const sigVals = seededEma(vals, 9);
    let signal = 0;
    const lastLine = line.at(-1) ?? 0;
    if (sigVals.length && Number.isFinite(sigVals.at(-1)))
        signal = sigVals.at(-1);
    return { line: lastLine, signal, hist: lastLine - signal };
}
function sampleStd(values) { if (values.length < 2)
    return 0; const m = values.reduce((a, b) => a + b, 0) / values.length; return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1)); }
/**
 * `rows` must be in ASCENDING chronological order (oldest first, matching the reversed
 * TwelveData response used in the live route), already truncated so the LAST element is
 * the bar for the decision date (the "as of" date). Do not pass future bars.
 */
function computeTechnicalSnapshot(rows, benchRows, benchmark, options = {}) {
    if (!Array.isArray(rows) || rows.length < 40)
        return null;
    if (rows.some((x, i) => ![x.open, x.high, x.low, x.close].every(n => typeof n === 'number' && Number.isFinite(n) && n > 0) || x.high < x.low || x.high < Math.max(x.open, x.close) || x.low > Math.min(x.open, x.close) || !Number.isFinite(Date.parse(x.datetime)) || (i > 0 && Date.parse(x.datetime) <= Date.parse(rows[i - 1].datetime))))
        return null;
    const volumeAvailable = rows.slice(-21).every(x => typeof x.volume === 'number' && Number.isFinite(x.volume) && x.volume >= 0) && rows.slice(-21).some(x => x.volume > 0) && rows.slice(-21, -1).some(x => x.volume > 0);
    const annualization = options.assetType === 'crypto' ? 365 : 252;
    const alignedBenchmark = benchRows?.filter(x => Number.isFinite(x.close) && x.close > 0);
    const comparisonDates = rows.slice(-61).map(x => x.datetime);
    const benchmarkByDate = new Map((alignedBenchmark ?? []).map(x => [x.datetime, x]));
    const benchmarkAvailable = !!benchmark && comparisonDates.length >= 21 && comparisonDates.every(date => benchmarkByDate.has(date));
    const c = rows.map(x => +x.close), h = rows.map(x => +x.high), l = rows.map(x => +x.low), v = rows.map(x => +x.volume || 0);
    const p = c.at(-1), prev = c.at(-2) ?? p;
    const ema20s = seededEma(c, 20), ema50s = seededEma(c, 50), ema200s = seededEma(c, 200);
    const e20 = ema20s.at(-1), e50 = ema50s.at(-1), e200 = ema200s.at(-1);
    const rv = (0, quant_1.rsi)(c), a = (0, quant_1.atr)(rows), v20 = (0, quant_1.sma)(v.slice(0, -1), 20), v5 = (0, quant_1.sma)(v.slice(0, -1), 5);
    const ret5 = p / (c.at(-6) ?? p) - 1, ret20 = p / (c.at(-21) ?? p) - 1, ret60 = p / (c.at(-61) ?? p) - 1;
    const m = standardMacd(c), sd20 = (0, quant_1.stddev)(c, 20), bbZ = sd20 ? (p - (0, quant_1.sma)(c, 20)) / (2 * sd20) : 0;
    const ov = (0, quant_1.obv)(c, v), obvSlope = (0, quant_1.slope)(ov, 10), volumeRatio = volumeAvailable && v20 ? v5 / v20 : 1;
    let bench20 = 0, bench60 = 0, marketTrend = 50, benchPrice = null;
    if (benchmarkAvailable) {
        const bc = comparisonDates.map(date => benchmarkByDate.get(date).close), bp = bc.at(-1);
        benchPrice = Number.isFinite(bp) ? bp : null;
        bench20 = bp / (bc.at(-21) ?? bp) - 1;
        bench60 = bp / (bc.at(-61) ?? bp) - 1;
        const be20 = seededEma(bc, 20).at(-1), be50 = seededEma(bc, 50).at(-1);
        marketTrend = (0, quant_1.clamp)(50 + (bp > be20 ? 18 : -18) + (Number.isFinite(be50) ? (be20 > be50 ? 18 : -18) : 0) + bench20 * 80, 12, 88);
    }
    const rel20 = benchmarkAvailable ? (ret20 - bench20) * 100 : 0, rel60 = benchmarkAvailable && c.length >= 61 ? (ret60 - bench60) * 100 : 0;
    const trend = (0, quant_1.clamp)(50 + (p > e20 ? 11 : -11) + (Number.isFinite(e50) ? (e20 > e50 ? 14 : -14) : 0) + (Number.isFinite(e200) ? (e50 > e200 ? 13 : -13) : 0) + (c.length >= 61 ? ret60 * 45 : 0) + rel60 * .6, 8, 94);
    const momentum = (0, quant_1.clamp)(50 + (rv - 50) * .75 + ret20 * 125 + (m.hist > 0 ? 9 : -9) + ret5 * 70, 8, 94);
    const flow = volumeAvailable ? (0, quant_1.clamp)(50 + (volumeRatio - 1) * 36 + (obvSlope > 0 ? 10 : -10) + (p > (c.at(-6) ?? p) ? 7 : p < (c.at(-6) ?? p) ? -7 : 0), 8, 94) : 50;
    const low60 = Math.min(...l.slice(-60)), high60 = Math.max(...h.slice(-60));
    const structure = (0, quant_1.clamp)(30 + 70 * (p - low60) / (high60 - low60 || 1), 8, 94);
    const extATR = Math.abs(p - e20) / (a || p * .02);
    const extension = (0, quant_1.clamp)(extATR * 32 + Math.max(0, Math.abs(bbZ) - .7) * 22, 5, 94);
    const nearestSupportCandidates = [e20, e50, ...l.slice(-80)].filter(x => x < p).sort((x, y) => y - x);
    const nearestResCandidates = [...h.slice(-80)].filter(x => x > p).sort((x, y) => x - y);
    const support = (0, quant_1.rnd)(nearestSupportCandidates.find(x => p - x >= a * .35) ?? p - a * 1.35);
    const majorSupport = (0, quant_1.rnd)(nearestSupportCandidates.find(x => x < support - a * .65) ?? p - a * 2.8);
    const invalidation = (0, quant_1.rnd)(Math.max(low60, majorSupport - a * .95));
    const resistance = (0, quant_1.rnd)(nearestResCandidates.find(x => x - p >= a * .35) ?? p + a * 1.35);
    const breakout = (0, quant_1.rnd)(nearestResCandidates.find(x => x > resistance + a * .65) ?? p + a * 2.7);
    const preferredEntry = (0, quant_1.rnd)(Math.max(majorSupport, (support + majorSupport) / 2));
    const riskToInv = Math.max(.01, p - invalidation), reward = Math.max(.01, resistance - p), rr = reward / riskToInv;
    const marketPenalty = marketTrend < 38 ? 9 : 0;
    const weighted = (parts) => { const valid = parts.filter(x => x[2]); return valid.reduce((sum, [n, w]) => sum + n * w, 0) / valid.reduce((sum, [, w]) => sum + w, 0); };
    const entry = (0, quant_1.clamp)(weighted([[trend, .18, true], [momentum, .15, true], [flow, .13, volumeAvailable], [structure, .14, true], [100 - extension, .24, true], [(0, quant_1.clamp)(rr * 35), .10, true], [(0, quant_1.clamp)(rel20 + 50), .06, benchmarkAvailable]]) - marketPenalty, 8, 94);
    const risk = (0, quant_1.clamp)(24 + extension * .32 + (a / p) * 560 + (p - support > 2.4 * a ? 12 : 0) + (marketTrend < 38 ? 9 : 0), 8, 94);
    const marketRegime = !benchmarkAvailable ? "Unavailable" : marketTrend >= 63 ? "Supportive" : marketTrend < 38 ? "Risk-off" : "Mixed";
    const relativeStrength = !benchmarkAvailable ? "Unavailable" : rel20 >= 5 ? "Leading" : rel20 <= -5 ? "Lagging" : "In line";
    const dailyReturns = c.slice(1).map((x, i) => Math.log(x / c[i])).filter(Number.isFinite).slice(-20);
    const realizedVol20 = dailyReturns.length >= 10 ? sampleStd(dailyReturns) * Math.sqrt(annualization) * 100 : null;
    const sma20 = (0, quant_1.sma)(c, 20), sma50 = c.length >= 50 ? (0, quant_1.sma)(c, 50) : null, sma200 = c.length >= 200 ? (0, quant_1.sma)(c, 200) : null;
    const bollUpper = sma20 + 2 * sd20, bollLower = sma20 - 2 * sd20;
    const bollingerPosition = bollUpper > bollLower ? (p - bollLower) / (bollUpper - bollLower) * 100 : null;
    const yearStart = Date.parse(rows.at(-1).datetime) - 364 * 86400000;
    const fullYear = rows.length >= annualization && Date.parse(rows[0].datetime) <= yearStart + 7 * 86400000;
    const yearHigh = Math.max(...rows.filter(x => Date.parse(x.datetime) >= yearStart).map(x => x.high));
    const drawdown52wPct = fullYear ? ((p / yearHigh) - 1) * 100 : null;
    const volatilityRisk = (0, quant_1.clamp)(20 + (a / p) * 520 + (realizedVol20 ?? 45) * .38, 5, 95);
    const technicalStrength = (0, quant_1.clamp)(weighted([[trend, .34, true], [momentum, .27, true], [flow, .17, volumeAvailable], [structure, .16, true], [(0, quant_1.clamp)(rel20 + 50), .06, benchmarkAvailable]]), 5, 95);
    const entryQuality = (0, quant_1.clamp)(technicalStrength * .35 + (100 - extension) * .32 + (100 - risk) * .18 + (0, quant_1.clamp)(rr * 32) * .10 + (benchmarkAvailable && marketTrend >= 50 ? 5 : 0), 5, 95);
    const state = technicalStrength >= 76 ? "Strong bullish" : technicalStrength >= 64 ? "Bullish" : technicalStrength >= 48 ? "Constructive / mixed" : technicalStrength >= 35 ? "Weak" : "Bearish";
    const entryState = entryQuality >= 72 ? "Attractive" : entryQuality >= 58 ? "Watch / improving" : entryQuality >= 44 ? "Neutral" : "Poor / wait";
    return {
        price: (0, quant_1.rnd)(p), changePct: (0, quant_1.rnd)((0, quant_1.pct)(p, prev)), volumeRatio: volumeAvailable ? (0, quant_1.rnd)(volumeRatio) : null,
        scores: { trend: Math.round(trend), momentum: Math.round(momentum), flow: Math.round(flow), structure: Math.round(structure), entry: Math.round(entryQuality), timing: Math.round(entryQuality), risk: Math.round(risk), extension: Math.round(extension) },
        labels: { trend: qLabel(trend), momentum: qLabel(momentum), flow: volumeAvailable ? qLabel(flow) : "Unavailable", structure: qLabel(structure), entry: entry >= 68 ? "Good" : entry < 48 ? "Poor" : "Improving", risk: risk < 40 ? "Lower" : risk < 70 ? "Moderate" : "High", extension: extension >= 65 ? "Stretched" : extension < 38 ? "Normal" : "Elevated" },
        levels: { preferredEntry, support, majorSupport, resistance, breakout, invalidation },
        volatility: { atr14: (0, quant_1.rnd)(a), atrPct: (0, quant_1.rnd)(a / p * 100) },
        market: { benchmark, benchmarkPrice: benchPrice != null ? (0, quant_1.rnd)(benchPrice) : null, regime: marketRegime, score: benchmarkAvailable ? Math.round(marketTrend) : null, relativeStrength, relative20: benchmarkAvailable ? (0, quant_1.rnd)(rel20) : null },
        riskReward: (0, quant_1.rnd)(rr),
        indicators: { rsi14: (0, quant_1.rnd)(rv), atr14: (0, quant_1.rnd)(a), atrPct: (0, quant_1.rnd)(a / p * 100), realizedVol20: realizedVol20 == null ? null : (0, quant_1.rnd)(realizedVol20), volumeRatio20: volumeAvailable && v20 ? (0, quant_1.rnd)((v.at(-1) ?? 0) / v20) : null, sma20: (0, quant_1.rnd)(sma20), sma50: sma50 == null ? null : (0, quant_1.rnd)(sma50), sma200: sma200 == null ? null : (0, quant_1.rnd)(sma200), distance20Pct: (0, quant_1.rnd)((p / sma20 - 1) * 100), distance50Pct: sma50 == null ? null : (0, quant_1.rnd)((p / sma50 - 1) * 100), distance200Pct: sma200 == null ? null : (0, quant_1.rnd)((p / sma200 - 1) * 100), bollingerPosition: bollingerPosition == null ? null : (0, quant_1.rnd)(bollingerPosition), drawdown52wPct: drawdown52wPct == null ? null : (0, quant_1.rnd)(drawdown52wPct), macd: { line: (0, quant_1.rnd)(m.line, 4), signal: (0, quant_1.rnd)(m.signal, 4), histogram: (0, quant_1.rnd)(m.hist, 4) } },
        technicalState: { strength: Math.round(technicalStrength), entryQuality: Math.round(entryQuality), trend: Math.round(trend), momentum: Math.round(momentum), participation: Math.round(flow), structure: Math.round(structure), extensionRisk: Math.round(extension), volatilityRisk: Math.round(volatilityRisk), state, entryState },
        coverage: { volume: volumeAvailable, benchmark: benchmarkAvailable, longTrend: c.length >= 200, fullYear, annualization, barCount: rows.length },
        indicatorVersion: "wilder-v1", technicalStateVersion: "auryn-tech-v2"
    };
}
