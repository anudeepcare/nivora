"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureOutcome = measureOutcome;
exports.scoreBucket = scoreBucket;
const pct = (a, b) => b ? ((a / b) - 1) * 100 : 0;
function measureOutcome(x) {
    const rawReturnPct = +(pct(x.endPrice, x.entryPrice)).toFixed(2);
    const benchmarkReturnPct = +(pct(x.benchmarkEnd, x.benchmarkStart)).toFixed(2);
    const alphaPct = +(rawReturnPct - benchmarkReturnPct).toFixed(2);
    let peak = x.entryPrice, maxDd = 0;
    for (const p of x.pathPrices) {
        if (!Number.isFinite(p) || p <= 0)
            continue;
        peak = Math.max(peak, p);
        maxDd = Math.min(maxDd, (p / peak - 1) * 100);
    }
    return { rawReturnPct, benchmarkReturnPct, alphaPct, maxDrawdownPct: +maxDd.toFixed(2), hit: alphaPct > 0 };
}
function scoreBucket(score) {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    if (s >= 90)
        return "90-100";
    if (s >= 80)
        return "80-89";
    if (s >= 70)
        return "70-79";
    if (s >= 60)
        return "60-69";
    if (s >= 50)
        return "50-59";
    return "0-49";
}
