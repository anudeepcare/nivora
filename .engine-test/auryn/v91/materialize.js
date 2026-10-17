"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCandidateShard = selectCandidateShard;
exports.materializeFeatureShard = materializeFeatureShard;
const feature_registry_1 = require("../v9/feature-registry");
const transforms_1 = require("./transforms");
const contexts_1 = require("./contexts");
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
function selectCandidateShard(options = {}) {
    let catalog = (0, feature_registry_1.generateFeatureCatalog)();
    if (options.family)
        catalog = catalog.filter(x => x.family === options.family);
    if (options.theory)
        catalog = catalog.filter(x => x.theory === options.theory);
    const start = Math.max(0, Math.floor(options.start ?? 0));
    const limit = Math.max(1, Math.min(5000, Math.floor(options.limit ?? 500)));
    return catalog.slice(start, start + limit);
}
function materializeFeatureShard(baseObservations, candidates) {
    const rows = [...baseObservations].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.asOf.localeCompare(b.asOf));
    const observations = [];
    const manifest = { candidateCount: candidates.length, baseRows: rows.length, observations: 0, skippedMissingMetric: 0, skippedMissingOutcome: 0, skippedTransform: 0, skippedMissingContext: 0 };
    let currentSymbol = '';
    let histories = new Map();
    for (const row of rows) {
        if (row.symbol !== currentSymbol) {
            currentSymbol = row.symbol;
            histories = new Map();
        }
        for (const [metric, value] of Object.entries(row.metrics)) {
            if (!finite(value))
                continue;
            const h = histories.get(metric) ?? [];
            h.push({ value, price: row.close, regime: row.regime });
            histories.set(metric, h);
        }
        for (const candidate of candidates) {
            if (!finite(row.metrics[candidate.baseMetric])) {
                manifest.skippedMissingMetric++;
                continue;
            }
            const outcome = row.outcomes[candidate.horizon];
            if (!outcome) {
                manifest.skippedMissingOutcome++;
                continue;
            }
            const history = histories.get(candidate.baseMetric) ?? [];
            const transformed = (0, transforms_1.deriveTransformedSignal)(candidate.transform, history);
            if (!finite(transformed) || Math.abs(transformed) < 1e-12) {
                manifest.skippedTransform++;
                continue;
            }
            const signal = (0, contexts_1.applyResearchContext)(candidate.context, transformed, { regime: row.regime, metrics: row.metrics });
            if (!finite(signal) || Math.abs(signal) < 1e-12) {
                manifest.skippedMissingContext++;
                continue;
            }
            observations.push({ featureId: candidate.id, symbol: row.symbol, asOf: row.asOf, archetype: row.archetype, sector: row.sector, regime: row.regime, horizon: candidate.horizon, signal, forwardReturnPct: outcome.forwardReturnPct, benchmarkReturnPct: outcome.benchmarkReturnPct, maxDrawdownPct: outcome.maxDrawdownPct, costBps: row.costBps });
        }
    }
    observations.sort((a, b) => a.asOf.localeCompare(b.asOf) || a.symbol.localeCompare(b.symbol) || a.featureId.localeCompare(b.featureId));
    manifest.observations = observations.length;
    return { observations, manifest };
}
