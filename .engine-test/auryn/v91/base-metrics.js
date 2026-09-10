"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeHistoricalBaseMetrics = computeHistoricalBaseMetrics;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const round = (x, d = 6) => +x.toFixed(d);
const sliceN = (xs, n) => xs.slice(Math.max(0, xs.length - n));
const sma = (xs, n) => xs.length >= n ? mean(xs.slice(-n)) : NaN;
function emaSeries(xs, period) {
    if (!xs.length)
        return [];
    const k = 2 / (period + 1);
    let e = xs[0];
    const out = [e];
    for (let i = 1; i < xs.length; i++) {
        e = xs[i] * k + e * (1 - k);
        out.push(e);
    }
    return out;
}
const ema = (xs, n) => xs.length ? emaSeries(xs, n).at(-1) ?? NaN : NaN;
function pctDistance(price, level) { return finite(level) && level !== 0 ? ((price / level) - 1) * 100 : NaN; }
function std(xs) { if (xs.length < 2)
    return 0; const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); }
function realizedVol(closes, n) { if (closes.length < n + 1)
    return NaN; const c = closes.slice(-(n + 1)), r = []; for (let i = 1; i < c.length; i++)
    if (c[i] > 0 && c[i - 1] > 0)
        r.push(Math.log(c[i] / c[i - 1])); return std(r) * Math.sqrt(252) * 100; }
function rsi(closes, n) { if (closes.length < n + 1)
    return NaN; let gains = 0, losses = 0; const c = closes.slice(-(n + 1)); for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0)
        gains += d;
    else
        losses -= d;
} const ag = gains / n, al = losses / n; if (al === 0)
    return 100; if (ag === 0)
    return 0; return 100 - 100 / (1 + ag / al); }
function trueRanges(bars) { const out = []; for (let i = 0; i < bars.length; i++) {
    const b = bars[i], prev = i ? bars[i - 1].close : b.close;
    out.push(Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev)));
} return out; }
function atrRaw(bars, n) { const tr = trueRanges(bars); return tr.length >= n ? mean(tr.slice(-n)) : NaN; }
function directional(bars, n = 14) { if (bars.length < n + 1)
    return { adx: NaN, pdi: NaN, mdi: NaN }; const tr = trueRanges(bars), plus = [], minus = []; for (let i = 1; i < bars.length; i++) {
    const up = bars[i].high - bars[i - 1].high, down = bars[i - 1].low - bars[i].low;
    plus.push(up > down && up > 0 ? up : 0);
    minus.push(down > up && down > 0 ? down : 0);
} const dx = []; for (let end = n; end < bars.length; end++) {
    const trAvg = mean(tr.slice(end - n + 1, end + 1));
    const p = trAvg ? 100 * mean(plus.slice(end - n, end)) / trAvg : 0;
    const m = trAvg ? 100 * mean(minus.slice(end - n, end)) / trAvg : 0;
    const d = p + m ? 100 * Math.abs(p - m) / (p + m) : 0;
    dx.push(d);
} const trAvg = mean(tr.slice(-n)), pdi = trAvg ? 100 * mean(plus.slice(-n)) / trAvg : 0, mdi = trAvg ? 100 * mean(minus.slice(-n)) / trAvg : 0, adx = dx.length >= n ? mean(dx.slice(-n)) : mean(dx); return { adx, pdi, mdi }; }
function cmf(bars, n = 20) { if (bars.length < n)
    return NaN; let mf = 0, vol = 0; for (const b of bars.slice(-n)) {
    const range = b.high - b.low;
    const mult = range ? ((b.close - b.low) - (b.high - b.close)) / range : 0;
    mf += mult * b.volume;
    vol += b.volume;
} return vol ? mf / vol : 0; }
function mfi(bars, n = 14) { if (bars.length < n + 1)
    return NaN; const rows = bars.slice(-(n + 1)); let pos = 0, neg = 0; for (let i = 1; i < rows.length; i++) {
    const tp = (rows[i].high + rows[i].low + rows[i].close) / 3, prev = (rows[i - 1].high + rows[i - 1].low + rows[i - 1].close) / 3, flow = tp * rows[i].volume;
    if (tp >= prev)
        pos += flow;
    else
        neg += flow;
} if (neg === 0)
    return 100; if (pos === 0)
    return 0; return 100 - 100 / (1 + pos / neg); }
function obvSlope(bars, n = 20) { if (bars.length < n + 1)
    return NaN; let obv = 0; const series = [0]; for (let i = 1; i < bars.length; i++) {
    obv += bars[i].close > bars[i - 1].close ? bars[i].volume : bars[i].close < bars[i - 1].close ? -bars[i].volume : 0;
    series.push(obv);
} const avgVol = mean(bars.slice(-n).map(b => b.volume)); return avgVol ? ((series.at(-1) - series.at(-(n + 1))) / (avgVol * n)) : 0; }
function adSlope(bars, n = 20) { if (bars.length < n)
    return NaN; let total = 0; const recent = bars.slice(-n); for (const b of recent) {
    const range = b.high - b.low;
    const mult = range ? ((b.close - b.low) - (b.high - b.close)) / range : 0;
    total += mult * b.volume;
} const avg = mean(recent.map(b => b.volume)); return avg ? total / (avg * n) : 0; }
function vwapDistance(bars, n = 20) { if (bars.length < n)
    return NaN; let pv = 0, v = 0; for (const b of bars.slice(-n)) {
    const tp = (b.high + b.low + b.close) / 3;
    pv += tp * b.volume;
    v += b.volume;
} const vw = v ? pv / v : NaN; return pctDistance(bars.at(-1).close, vw); }
function percentilePosition(value, xs) { if (!xs.length)
    return NaN; const less = xs.filter(x => x < value).length, equal = xs.filter(x => x === value).length; return ((less + .5 * equal) / xs.length - .5) * 2; }
function benchmarkRegime(bars) { const closes = bars.map(b => b.close); if (closes.length < 40)
    return 'NEUTRAL'; const rv = realizedVol(closes, 20), last = closes.at(-1), s200 = sma(closes, 200), s50 = sma(closes, 50); if (finite(rv) && rv >= 35)
    return 'HIGH_VOL'; if (finite(s200) && finite(s50) && last > s200 && s50 > s200)
    return 'RISK_ON'; if (finite(s200) && finite(s50) && last < s200 && s50 < s200)
    return 'RISK_OFF'; return 'NEUTRAL'; }
function set(m, k, v) { if (finite(v))
    m[k] = round(v); }
function computeHistoricalBaseMetrics(symbolBars, benchmarkBars, externalMetrics = {}, asOfIndex = symbolBars.length - 1) {
    const bars = symbolBars.slice(0, Math.min(symbolBars.length, asOfIndex + 1));
    if (!bars.length)
        return { metrics: {}, regime: 'NEUTRAL' };
    const asOf = bars.at(-1).date, bench = benchmarkBars.filter(b => b.date <= asOf), closes = bars.map(b => b.close), highs = bars.map(b => b.high), lows = bars.map(b => b.low), vols = bars.map(b => b.volume), price = closes.at(-1);
    const metrics = {};
    for (const n of [20, 50, 100, 200])
        set(metrics, `sma${n}`, pctDistance(price, sma(closes, n)));
    for (const n of [20, 50])
        set(metrics, `ema${n}`, pctDistance(price, ema(closes, n)));
    const s20 = sma(closes, 20), s50 = sma(closes, 50), s200 = sma(closes, 200);
    if ([s20, s50, s200].every(finite))
        set(metrics, 'ma_stack', price > s20 && s20 > s50 && s50 > s200 ? 1 : price < s20 && s20 < s50 && s50 < s200 ? -1 : 0);
    if (closes.length >= 25) {
        const before = sma(closes.slice(0, -5), 20);
        set(metrics, 'ma_slope', finite(before) && before ? ((s20 / before) - 1) * 100 : NaN);
    }
    const hi9 = Math.max(...sliceN(highs, 9)), lo9 = Math.min(...sliceN(lows, 9)), hi26 = Math.max(...sliceN(highs, 26)), lo26 = Math.min(...sliceN(lows, 26)), tenkan = (hi9 + lo9) / 2, kijun = (hi26 + lo26) / 2;
    if (bars.length >= 26) {
        set(metrics, 'tenkan_kijun', pctDistance(tenkan, kijun));
        const hi52 = Math.max(...sliceN(highs, 52)), lo52 = Math.min(...sliceN(lows, 52)), cloud = ((tenkan + kijun) / 2 + (hi52 + lo52) / 2) / 2;
        set(metrics, 'ichimoku_cloud', pctDistance(price, cloud));
        set(metrics, 'chikou_state', pctDistance(price, closes.at(-27)));
    }
    for (const n of [5, 14, 21]) {
        const x = rsi(closes, n);
        set(metrics, `rsi${n}`, finite(x) ? (x - 50) / 50 : NaN);
    }
    if ('rsi14' in metrics)
        set(metrics, 'rsi_regime', Math.abs(metrics.rsi14) >= .4 ? Math.sign(metrics.rsi14) : 0);
    const e12 = emaSeries(closes, 12), e26 = emaSeries(closes, 26), macdRaw = closes.map((_, i) => (e12[i] ?? NaN) - (e26[i] ?? NaN)), signalRaw = emaSeries(macdRaw, 9), ml = macdRaw.at(-1), ms = signalRaw.at(-1);
    set(metrics, 'macd_line', price ? ml / price * 100 : NaN);
    set(metrics, 'macd_signal', price ? ms / price * 100 : NaN);
    set(metrics, 'macd_histogram', price ? (ml - ms) / price * 100 : NaN);
    const d = directional(bars, 14);
    set(metrics, 'adx14', finite(d.adx) ? (d.adx / 100) * Math.sign(d.pdi - d.mdi) : NaN);
    set(metrics, 'dmi_plus', finite(d.pdi) ? d.pdi / 100 : NaN);
    set(metrics, 'dmi_minus', finite(d.mdi) ? -d.mdi / 100 : NaN);
    if (bars.length >= 14) {
        const hh = Math.max(...sliceN(highs, 14)), ll = Math.min(...sliceN(lows, 14));
        set(metrics, 'stochastic', hh > ll ? ((price - ll) / (hh - ll) - .5) * 2 : 0);
    }
    if (bars.length >= 20) {
        const tps = bars.map(b => (b.high + b.low + b.close) / 3), tp = tps.at(-1), avg = sma(tps, 20), dev = mean(sliceN(tps, 20).map(x => Math.abs(x - avg)));
        set(metrics, 'cci20', dev ? ((tp - avg) / (.015 * dev)) / 100 : 0);
        const past = closes.at(-21);
        set(metrics, 'roc20', past ? ((price / past) - 1) * 100 : NaN);
    }
    const mf = mfi(bars, 14);
    set(metrics, 'mfi14', finite(mf) ? (mf - 50) / 50 : NaN);
    if (bars.length >= 20) {
        const avg = sma(closes, 20), sd = std(sliceN(closes, 20)), upper = avg + 2 * sd, lower = avg - 2 * sd;
        set(metrics, 'bollinger_percent_b', upper > lower ? ((price - lower) / (upper - lower) - .5) * 2 : 0);
        set(metrics, 'bollinger_width', avg ? (upper - lower) / avg * 100 : NaN);
    }
    const atr = atrRaw(bars, 14);
    set(metrics, 'atr14', price ? atr / price * 100 : NaN);
    set(metrics, 'realized_vol20', realizedVol(closes, 20));
    set(metrics, 'realized_vol60', realizedVol(closes, 60));
    if (finite(atr)) {
        const e20 = ema(closes, 20), upper = e20 + 2 * atr, lower = e20 - 2 * atr;
        set(metrics, 'keltner_position', upper > lower ? ((price - lower) / (upper - lower) - .5) * 2 : 0);
        if (finite(metrics.bollinger_width))
            set(metrics, 'squeeze_state', metrics.bollinger_width < (upper - lower) / e20 * 100 ? 1 : -1);
    }
    if (bars.length >= 20) {
        const avgVol = sma(vols, 20), avg5 = sma(vols, 5);
        set(metrics, 'relative_volume', avgVol ? vols.at(-1) / avgVol - 1 : NaN);
        set(metrics, 'volume_dryup', avgVol ? 1 - avg5 / avgVol : NaN);
        set(metrics, 'obv_slope', obvSlope(bars, 20));
        set(metrics, 'cmf20', cmf(bars, 20));
        set(metrics, 'accumulation_distribution', adSlope(bars, 20));
        const prior = bars.slice(-21, -1), ph = Math.max(...prior.map(b => b.high)), pl = Math.min(...prior.map(b => b.low));
        const breakout = price >= ph ? 1 : price <= pl ? -1 : 0;
        set(metrics, 'breakout_state', breakout);
        set(metrics, 'breakout_volume', (metrics.relative_volume ?? 0) * breakout);
        set(metrics, 'support_distance', price ? ((price - pl) / price) * 100 : NaN);
        set(metrics, 'resistance_distance', price ? ((ph - price) / price) * 100 : NaN);
        set(metrics, 'gap_state', bars.length > 1 ? ((bars.at(-1).open / bars.at(-2).close) - 1) * 100 : 0);
        const range = (ph - pl) / price * 100;
        set(metrics, 'base_stage', range < 10 ? 1 : range > 25 ? -1 : 0);
        if (bars.length >= 41) {
            const prev = bars.slice(-41, -21), prevH = Math.max(...prev.map(b => b.high)), prevL = Math.min(...prev.map(b => b.low));
            set(metrics, 'higher_high_low', ph > prevH && pl > prevL ? 1 : ph < prevH && pl < prevL ? -1 : 0);
        }
    }
    set(metrics, 'vwap_distance', vwapDistance(bars, 20));
    if (bars.length >= 60) {
        const recent = bars.slice(-60), hi = Math.max(...recent.map(b => b.high)), lo = Math.min(...recent.map(b => b.low)), range = hi - lo;
        if (range > 0) {
            for (const [name, r] of [['fib_382', .382], ['fib_500', .5], ['fib_618', .618], ['fib_786', .786]]) {
                const level = hi - range * r;
                set(metrics, name, (price - level) / range);
            }
            set(metrics, 'fib_extension_1272', (price - (hi + range * .272)) / range);
            set(metrics, 'fib_extension_1618', (price - (hi + range * .618)) / range);
        }
    }
    if (finite(s200) && finite(metrics.ma_slope))
        set(metrics, 'weinstein_stage', price > s200 && metrics.ma_slope > 0 ? 1 : price < s200 && metrics.ma_slope < 0 ? -1 : 0);
    if (bars.length >= 21) {
        const prior = bars.slice(-21, -1), hi = Math.max(...prior.map(b => b.high)), lo = Math.min(...prior.map(b => b.low));
        set(metrics, 'darvas_box_state', price > hi ? 1 : price < lo ? -1 : 0);
    }
    if (bench.length >= 21 && bars.length >= 21) {
        const bClose = bench.at(-1).close, bPast = bench.at(-21).close, sPast = closes.at(-21);
        const rs = ((price / sPast) - 1 - (bClose / bPast - 1)) * 100;
        set(metrics, 'rs_vs_spy', rs);
        const benchSymbol = bench.at(-1).symbol.toUpperCase();
        if (benchSymbol === 'QQQ')
            set(metrics, 'rs_vs_qqq', rs);
    }
    const regime = benchmarkRegime(bench);
    for (const [k, v] of Object.entries(externalMetrics).sort(([a], [b]) => a.localeCompare(b)))
        if (finite(v))
            metrics[k] = round(v);
    return { metrics: Object.fromEntries(Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b))), regime };
}
