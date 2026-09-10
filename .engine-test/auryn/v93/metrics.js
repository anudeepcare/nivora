"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateV93Feature = evaluateV93Feature;
const nivora_statistics_1 = require("../../nivora-statistics");
const statistics_1 = require("../v9/statistics");
const folds_1 = require("./folds");
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const round = (x, d = 6) => +x.toFixed(d);
function stableHash32(text) { let h = 2166136261 >>> 0; for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
} return h >>> 0; }
function edge(row, costMultiplier = 1) {
    const rawAlpha = row.forwardReturnPct - row.benchmarkReturnPct;
    const cost = (finite(row.costBps) ? row.costBps : 0) * costMultiplier / 100;
    return Math.sign(row.signal) * rawAlpha - cost;
}
function groupStability(rows, key, minN) {
    const groups = new Map();
    for (const row of rows) {
        const k = key(row);
        if (!k)
            continue;
        const a = groups.get(k) ?? [];
        a.push(row);
        groups.set(k, a);
    }
    const eligible = [...groups.entries()].filter(([, a]) => a.length >= minN).sort((a, b) => a[0].localeCompare(b[0]));
    if (!eligible.length)
        return { covered: 0, positivePct: null };
    const positive = eligible.filter(([, a]) => mean(a.map(r => edge(r))) > 0).length;
    return { covered: eligible.length, positivePct: round(positive / eligible.length * 100, 1) };
}
function tPValue(xs) {
    if (xs.length < 2)
        return 1;
    const m = mean(xs), sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
    const t = sd > 1e-12 ? m / (sd / Math.sqrt(xs.length)) : m > 0 ? 10 : m < 0 ? -10 : 0;
    return (0, statistics_1.normalTwoSidedP)(t);
}
function evaluateV93Feature(featureId, observations, policy) {
    const rows = observations.filter(r => r.featureId === featureId && finite(r.signal) && Math.abs(r.signal) > 1e-12 && finite(r.forwardReturnPct) && finite(r.benchmarkReturnPct)).sort((a, b) => a.asOf.localeCompare(b.asOf) || a.symbol.localeCompare(b.symbol));
    const horizon = (rows[0]?.horizon ?? null);
    const folds = horizon ? (0, folds_1.createPurgedWalkForwardFolds)(rows, horizon, policy) : [];
    const foldMetrics = folds.map(f => ({ index: f.index, testN: f.testRows.length, meanEdgePct: f.testRows.length ? round(mean(f.testRows.map(r => edge(r))), 6) : null, costStressMeanEdgePct: f.testRows.length ? round(mean(f.testRows.map(r => edge(r, policy.costStressMultiplier))), 6) : null }));
    const validFolds = folds.filter(f => f.testRows.length >= policy.minFoldTestN);
    const seen = new Set();
    const oos = [];
    for (const f of validFolds)
        for (const r of f.testRows) {
            const k = `${r.asOf}|${r.symbol}`;
            if (!seen.has(k)) {
                seen.add(k);
                oos.push(r);
            }
        }
    oos.sort((a, b) => a.asOf.localeCompare(b.asOf) || a.symbol.localeCompare(b.symbol));
    const oosEdges = oos.map(r => edge(r)), stress = oos.map(r => edge(r, policy.costStressMultiplier));
    const rawAlpha = oos.map(r => r.forwardReturnPct - r.benchmarkReturnPct), signals = oos.map(r => r.signal);
    const ci = (0, nivora_statistics_1.bootstrapMeanCI)(oosEdges, policy.bootstrapIterations, policy.bootstrapConfidence, (policy.seed ^ stableHash32(featureId)) >>> 0);
    const regime = groupStability(oos, r => r.regime, policy.minStabilityGroupN);
    const archetype = groupStability(oos, r => r.archetype, policy.minStabilityGroupN);
    const sector = groupStability(oos, r => r.sector ?? null, policy.minStabilityGroupN);
    const dd = oos.map(r => r.maxDrawdownPct).filter(finite);
    const positiveFolds = foldMetrics.filter(f => f.testN >= policy.minFoldTestN && f.meanEdgePct != null && f.meanEdgePct > 0).length;
    const eligibleFoldCount = foldMetrics.filter(f => f.testN >= policy.minFoldTestN).length;
    return {
        featureId,
        horizon,
        totalN: rows.length,
        trainN: Math.max(0, rows.length - oos.length),
        oosN: oos.length,
        validFoldCount: validFolds.length,
        folds: foldMetrics,
        oosAvgEdgePct: oos.length ? round(mean(oosEdges), 6) : null,
        costStressOosAvgEdgePct: oos.length ? round(mean(stress), 6) : null,
        oosConfidence95: ci,
        oosInformationCoefficient: oos.length >= 2 ? (0, statistics_1.pearson)(signals, rawAlpha) : null,
        oosHitRatePct: oos.length ? round(oosEdges.filter(x => x > 0).length / oos.length * 100, 1) : null,
        avgMaxDrawdownPct: dd.length ? round(mean(dd), 3) : null,
        positiveFoldPct: eligibleFoldCount ? round(positiveFolds / eligibleFoldCount * 100, 1) : null,
        regimesCovered: regime.covered,
        regimePositivePct: regime.positivePct,
        archetypesCovered: archetype.covered,
        archetypePositivePct: archetype.positivePct,
        sectorsCovered: sector.covered,
        sectorPositivePct: sector.positivePct,
        pValue: tPValue(oosEdges),
    };
}
