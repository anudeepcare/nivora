"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emaN = exports.smaN = void 0;
exports.emaSeries = emaSeries;
exports.computeRsi14 = computeRsi14;
exports.computeMacd = computeMacd;
exports.computeStochastic = computeStochastic;
exports.computeCci = computeCci;
exports.computeWilliamsR = computeWilliamsR;
exports.computeRoc = computeRoc;
exports.computeMomentum = computeMomentum;
exports.computeAtr = computeAtr;
exports.computeAdx = computeAdx;
exports.computeRealizedVol = computeRealizedVol;
exports.computeObv = computeObv;
exports.linearSlope = linearSlope;
exports.typicalPriceVwap = typicalPriceVwap;
const avg = (x) => x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0;
const smaN = (x, n) => x.length >= n ? avg(x.slice(-n)) : null;
exports.smaN = smaN;
function emaSeries(x, n) {
    if (!x.length)
        return [];
    const out = [];
    const k = 2 / (n + 1);
    let e = x[0];
    out.push(e);
    for (let i = 1; i < x.length; i++) {
        e = x[i] * k + e * (1 - k);
        out.push(e);
    }
    return out;
}
const emaN = (x, n) => x.length >= n ? (emaSeries(x, n).at(-1) ?? null) : null;
exports.emaN = emaN;
function computeRsi14(x, period = 14) {
    if (x.length <= period)
        return 50;
    let gain = 0, loss = 0;
    for (let i = 1; i <= period; i++) {
        const d = x[i] - x[i - 1];
        if (d > 0)
            gain += d;
        else
            loss -= d;
    }
    gain /= period;
    loss /= period;
    for (let i = period + 1; i < x.length; i++) {
        const d = x[i] - x[i - 1], g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
        gain = (gain * (period - 1) + g) / period;
        loss = (loss * (period - 1) + l) / period;
    }
    if (loss === 0)
        return 100;
    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
}
function computeMacd(x) {
    if (x.length < 26)
        return { line: 0, signal: 0, histogram: 0 };
    const e12 = emaSeries(x, 12), e26 = emaSeries(x, 26), line = x.map((_, i) => e12[i] - e26[i]);
    const signal = emaSeries(line, 9);
    const l = line.at(-1) ?? 0, s = signal.at(-1) ?? 0;
    return { line: l, signal: s, histogram: l - s };
}
function computeStochastic(rows, period = 14, smooth = 3) {
    if (rows.length < period)
        return { k: 50, d: 50 };
    const ks = [];
    for (let i = Math.max(period - 1, rows.length - smooth - period); i < rows.length; i++) {
        const w = rows.slice(Math.max(0, i - period + 1), i + 1), hh = Math.max(...w.map(x => x.high)), ll = Math.min(...w.map(x => x.low)), c = rows[i].close;
        ks.push(hh === ll ? 50 : (c - ll) / (hh - ll) * 100);
    }
    const k = avg(ks.slice(-smooth)), d = avg(ks.slice(-smooth * 2, -smooth).length ? ks.slice(-smooth * 2, -smooth) : ks.slice(-smooth));
    return { k, d };
}
function computeCci(rows, period = 20) {
    if (rows.length < period)
        return 0;
    const t = rows.map(x => (x.high + x.low + x.close) / 3), w = t.slice(-period), m = avg(w), md = avg(w.map(v => Math.abs(v - m)));
    return md === 0 ? 0 : (w.at(-1) - m) / (.015 * md);
}
function computeWilliamsR(rows, period = 14) {
    if (rows.length < period)
        return -50;
    const w = rows.slice(-period), hh = Math.max(...w.map(x => x.high)), ll = Math.min(...w.map(x => x.low)), c = w.at(-1).close;
    return hh === ll ? -50 : -100 * (hh - c) / (hh - ll);
}
function computeRoc(x, period = 12) { if (x.length <= period)
    return 0; const p = x.at(-1), b = x.at(-1 - period); return b ? ((p / b) - 1) * 100 : 0; }
function computeMomentum(x, period = 10) { if (x.length <= period)
    return 0; return x.at(-1) - x.at(-1 - period); }
function computeAtr(rows, period = 14) {
    if (!rows.length)
        return 0;
    const tr = rows.map((x, i) => { const pc = i ? rows[i - 1].close : x.close; return Math.max(x.high - x.low, Math.abs(x.high - pc), Math.abs(x.low - pc)); });
    if (tr.length <= period)
        return avg(tr);
    let a = avg(tr.slice(0, period));
    for (const v of tr.slice(period))
        a = (a * (period - 1) + v) / period;
    return a;
}
function computeAdx(rows, period = 14) {
    if (rows.length < period * 2 + 1)
        return { adx: 0, plusDi: 0, minusDi: 0 };
    const trs = [], plus = [], minus = [];
    for (let i = 1; i < rows.length; i++) {
        const cur = rows[i], prev = rows[i - 1], up = cur.high - prev.high, down = prev.low - cur.low;
        plus.push(up > down && up > 0 ? up : 0);
        minus.push(down > up && down > 0 ? down : 0);
        trs.push(Math.max(cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close)));
    }
    let tr = trs.slice(0, period).reduce((a, b) => a + b, 0), pdm = plus.slice(0, period).reduce((a, b) => a + b, 0), mdm = minus.slice(0, period).reduce((a, b) => a + b, 0);
    const dx = [];
    for (let i = period; i < trs.length; i++) {
        tr = tr - tr / period + trs[i];
        pdm = pdm - pdm / period + plus[i];
        mdm = mdm - mdm / period + minus[i];
        const p = tr ? 100 * pdm / tr : 0, m = tr ? 100 * mdm / tr : 0;
        dx.push(p + m ? 100 * Math.abs(p - m) / (p + m) : 0);
    }
    const adx = dx.length >= period ? avg(dx.slice(-period)) : avg(dx);
    const p = tr ? 100 * pdm / tr : 0, m = tr ? 100 * mdm / tr : 0;
    return { adx, plusDi: p, minusDi: m };
}
function computeRealizedVol(x, annualization = 252, period = 20) {
    if (x.length < period + 1)
        return null;
    const r = x.slice(1).map((v, i) => Math.log(v / x[i])).slice(-period), m = avg(r), sd = Math.sqrt(avg(r.map(v => (v - m) ** 2)));
    return sd * Math.sqrt(annualization) * 100;
}
function computeObv(rows) { let v = 0; const out = [0]; for (let i = 1; i < rows.length; i++) {
    v += rows[i].close > rows[i - 1].close ? rows[i].volume : rows[i].close < rows[i - 1].close ? -rows[i].volume : 0;
    out.push(v);
} return out; }
function linearSlope(x, period = 10) { const w = x.slice(-Math.min(period, x.length)); return w.length < 2 ? 0 : (w.at(-1) - w[0]) / (w.length - 1); }
function typicalPriceVwap(rows, fromIndex = 0) { let pv = 0, v = 0; for (const r of rows.slice(Math.max(0, fromIndex))) {
    const tp = (r.high + r.low + r.close) / 3;
    pv += tp * r.volume;
    v += r.volume;
} return v ? pv / v : null; }
