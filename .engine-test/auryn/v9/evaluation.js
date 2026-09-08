"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFeature = evaluateFeature;
const nivora_statistics_1 = require("../../nivora-statistics");
const statistics_1 = require("./statistics");
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const round = (x, d = 3) => +x.toFixed(d);
function evaluateFeature(featureId, observations, options = {}) {
    const rows = observations.filter(r => r.featureId === featureId && finite(r.signal) && finite(r.forwardReturnPct) && finite(r.benchmarkReturnPct) && Math.abs(r.signal) > .0001).sort((a, b) => a.asOf.localeCompare(b.asOf) || a.symbol.localeCompare(b.symbol));
    const enriched = rows.map(r => { const rawAlpha = r.forwardReturnPct - r.benchmarkReturnPct; const cost = (finite(r.costBps) ? r.costBps : 0) / 100; const edge = Math.sign(r.signal) * rawAlpha - cost; return { ...r, rawAlpha, edge }; });
    const cut = Math.floor(enriched.length * Math.max(.1, Math.min(.9, options.inSampleFraction ?? .6))), ins = enriched.slice(0, cut), oos = enriched.slice(cut);
    const edges = enriched.map(x => x.edge), oosEdges = oos.map(x => x.edge), signals = enriched.map(x => x.signal), rawAlpha = enriched.map(x => x.rawAlpha);
    const ci = (0, nivora_statistics_1.bootstrapMeanCI)(oosEdges, Math.min(2000, Math.max(500, oosEdges.length * 20)), .95, 909);
    const sd = edges.length > 1 ? Math.sqrt(edges.reduce((s, x) => s + (x - mean(edges)) ** 2, 0) / (edges.length - 1)) : 0;
    const t = sd > 0 ? mean(edges) / (sd / Math.sqrt(edges.length)) : mean(edges) > 0 ? 10 : mean(edges) < 0 ? -10 : 0;
    const regimes = [...new Set(enriched.map(x => x.regime).filter(Boolean))], archetypes = [...new Set(enriched.map(x => x.archetype).filter(Boolean))];
    const stable = regimes.map(reg => { const xs = enriched.filter(x => x.regime === reg).map(x => x.edge); return xs.length >= 5 ? mean(xs) > 0 : null; }).filter((x) => x !== null);
    const dd = enriched.map(x => x.maxDrawdownPct).filter(finite);
    return { featureId, totalN: enriched.length, inSampleN: ins.length, outOfSampleN: oos.length, avgEdgePct: enriched.length ? round(mean(edges)) : null, outOfSampleAvgEdgePct: oos.length ? round(mean(oosEdges)) : null, outOfSampleConfidence95: ci, informationCoefficient: (0, statistics_1.pearson)(signals, rawAlpha), hitRatePct: enriched.length ? round(edges.filter(x => x > 0).length / enriched.length * 100, 1) : null, avgMaxDrawdownPct: dd.length ? round(mean(dd)) : null, regimesCovered: regimes.length, archetypesCovered: archetypes.length, regimeStabilityPct: stable.length ? round(stable.filter(Boolean).length / stable.length * 100, 1) : null, pValue: (0, statistics_1.normalTwoSidedP)(t) };
}
