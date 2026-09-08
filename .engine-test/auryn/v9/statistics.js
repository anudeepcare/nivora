"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.benjaminiHochberg = benjaminiHochberg;
exports.normalTwoSidedP = normalTwoSidedP;
exports.pearson = pearson;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function benjaminiHochberg(rows, alpha = .05) {
    const sorted = rows.map(x => ({ ...x, pValue: clamp(Number.isFinite(x.pValue) ? x.pValue : 1) })).sort((a, b) => a.pValue - b.pValue || a.id.localeCompare(b.id));
    const m = sorted.length;
    let next = 1;
    const adjusted = new Array(m);
    for (let i = m - 1; i >= 0; i--) {
        const raw = sorted[i].pValue * m / (i + 1);
        next = Math.min(next, raw);
        adjusted[i] = { ...sorted[i], qValue: +clamp(next).toFixed(6), significant: clamp(next) <= alpha };
    }
    return adjusted;
}
function erf(x) { const sign = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + .3275911 * a); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-a * a); return sign * y; }
function normalTwoSidedP(z) { if (!Number.isFinite(z))
    return 1; const cdf = .5 * (1 + erf(Math.abs(z) / Math.SQRT2)); return +clamp(2 * (1 - cdf)).toFixed(8); }
function pearson(a, b) { const n = Math.min(a.length, b.length); if (n < 2)
    return null; const x = a.slice(0, n), y = b.slice(0, n), mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n; let num = 0, dx = 0, dy = 0; for (let i = 0; i < n; i++) {
    const xv = x[i] - mx, yv = y[i] - my;
    num += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
} return dx && dy ? +(num / Math.sqrt(dx * dy)).toFixed(6) : null; }
