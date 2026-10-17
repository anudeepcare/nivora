"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeArenaOutcome = gradeArenaOutcome;
exports.summarizeReliability = summarizeReliability;
const nivora_version_1 = require("./nivora-version");
const pct = (a, b) => a > 0 ? +(((b / a) - 1) * 100).toFixed(2) : 0;
function gradeArenaOutcome(x) {
    const raw = pct(x.startPrice, x.endPrice), bench = pct(x.benchmarkStart, x.benchmarkEnd), sector = x.sectorStart && x.sectorEnd ? pct(x.sectorStart, x.sectorEnd) : null, alpha = +(raw - bench).toFixed(2);
    return { horizon: x.horizon, rawReturnPct: raw, benchmarkReturnPct: bench, sectorReturnPct: sector, alphaPct: alpha, sectorAlphaPct: sector == null ? null : +(raw - sector).toFixed(2), maxDrawdownPct: x.maxDrawdownPct ?? null, hit: alpha > 0 };
}
function summarizeReliability(rows, minimum = nivora_version_1.RELIABILITY_MIN_SAMPLE) {
    const n = rows.length, avg = n ? +(rows.reduce((s, r) => s + r.alphaPct, 0) / n).toFixed(2) : 0, hitRate = n ? +(rows.filter(r => r.hit).length / n * 100).toFixed(1) : 0;
    const status = n < minimum ? "COLLECTING" : "CALIBRATED";
    return { status, label: status === "CALIBRATED" ? "Calibrated" : "Collecting", n, minimum, averageAlphaPct: avg, hitRatePct: hitRate, reliabilityScore: status === "CALIBRATED" ? Math.max(0, Math.min(100, Math.round(50 + avg * 2 + (hitRate - 50) * .6))) : null };
}
