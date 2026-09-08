"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pct = exports.rnd = exports.sma = exports.avg = exports.clamp = void 0;
exports.ema = ema;
exports.rsi = rsi;
exports.atr = atr;
exports.stddev = stddev;
exports.macd = macd;
exports.obv = obv;
exports.slope = slope;
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
exports.clamp = clamp;
const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
exports.avg = avg;
const sma = (a, n) => (0, exports.avg)(a.slice(-Math.min(n, a.length)));
exports.sma = sma;
const rnd = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
exports.rnd = rnd;
const pct = (now, prior) => prior ? ((now / prior) - 1) * 100 : 0;
exports.pct = pct;
function ema(values, period) {
    if (!values.length)
        return [];
    const k = 2 / (period + 1);
    const out = [values[0]];
    for (let i = 1; i < values.length; i++)
        out.push(values[i] * k + out[i - 1] * (1 - k));
    return out;
}
function rsi(values, period = 14) {
    if (values.length <= period)
        return 50;
    const changes = values.slice(1).map((v, i) => v - values[i]);
    let avgGain = 0, avgLoss = 0;
    for (const ch of changes.slice(0, period)) {
        if (ch > 0)
            avgGain += ch;
        else
            avgLoss -= ch;
    }
    avgGain /= period;
    avgLoss /= period;
    for (const ch of changes.slice(period)) {
        const gain = ch > 0 ? ch : 0, loss = ch < 0 ? -ch : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (avgLoss === 0)
        return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}
function atr(rows, period = 14) {
    const tr = rows.map((x, i) => {
        const h = +x.high, l = +x.low, pc = i ? +rows[i - 1].close : +x.close;
        return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    });
    if (!tr.length)
        return 0;
    if (tr.length <= period)
        return (0, exports.avg)(tr);
    let a = (0, exports.avg)(tr.slice(0, period));
    for (const v of tr.slice(period))
        a = (a * (period - 1) + v) / period;
    return a;
}
function stddev(values, period = 20) {
    const x = values.slice(-Math.min(period, values.length));
    if (!x.length)
        return 0;
    const m = (0, exports.avg)(x);
    return Math.sqrt((0, exports.avg)(x.map(v => (v - m) ** 2)));
}
function macd(values) {
    const e12 = ema(values, 12), e26 = ema(values, 26);
    const line = values.map((_, i) => (e12[i] ?? 0) - (e26[i] ?? 0));
    const signal = ema(line, 9);
    const last = line.at(-1) ?? 0, sig = signal.at(-1) ?? 0;
    return { line: last, signal: sig, hist: last - sig };
}
function obv(closes, volumes) {
    let v = 0;
    const out = [0];
    for (let i = 1; i < closes.length; i++) {
        v += closes[i] > closes[i - 1] ? volumes[i] : closes[i] < closes[i - 1] ? -volumes[i] : 0;
        out.push(v);
    }
    return out;
}
function slope(values, period = 10) {
    const x = values.slice(-Math.min(period, values.length));
    if (x.length < 2)
        return 0;
    return (x.at(-1) - x[0]) / (x.length - 1);
}
