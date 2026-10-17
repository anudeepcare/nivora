"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factorCorrelationAudit = factorCorrelationAudit;
exports.uniqueInformationBudget = uniqueInformationBudget;
const finite = (x) => x !== null && x !== undefined && x !== "" && typeof x !== "boolean" && Number.isFinite(Number(x));
function corr(x, y) { const n = Math.min(x.length, y.length); if (n < 8)
    return null; const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n; let c = 0, vx = 0, vy = 0; for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    c += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
} return vx && vy ? c / Math.sqrt(vx * vy) : null; }
function factorCorrelationAudit(rows, keys, threshold = .55) {
    const out = [];
    for (let i = 0; i < keys.length; i++)
        for (let j = i + 1; j < keys.length; j++) {
            const a = [], b = [];
            for (const r of rows) {
                if (finite(r[keys[i]]) && finite(r[keys[j]])) {
                    a.push(Number(r[keys[i]]));
                    b.push(Number(r[keys[j]]));
                }
            }
            const c = corr(a, b);
            if (c == null)
                continue;
            const ac = Math.abs(c);
            if (ac >= threshold)
                out.push({ a: keys[i], b: keys[j], correlation: +c.toFixed(3), n: a.length, severity: ac >= .8 ? "HIGH" : ac >= .65 ? "WATCH" : "LOW" });
        }
    return out.sort((x, y) => Math.abs(y.correlation) - Math.abs(x.correlation));
}
function uniqueInformationBudget(correlations) {
    const penalty = new Map();
    for (const c of correlations) {
        const p = Math.max(0, Math.abs(c.correlation) - .5);
        penalty.set(c.a, (penalty.get(c.a) || 0) + p / 2);
        penalty.set(c.b, (penalty.get(c.b) || 0) + p / 2);
    }
    return Object.fromEntries([...penalty.entries()].map(([k, p]) => [k, +Math.max(.45, 1 - Math.min(.55, p)).toFixed(2)]));
}
