"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeV93Tournament = finalizeV93Tournament;
const statistics_1 = require("../v9/statistics");
const promotion_1 = require("./promotion");
function emptyMetric(id, horizon) {
    return { featureId: id, horizon, totalN: 0, trainN: 0, oosN: 0, validFoldCount: 0, folds: [], oosAvgEdgePct: null, costStressOosAvgEdgePct: null, oosConfidence95: { mean: 0, low: 0, high: 0, iterations: 0 }, oosInformationCoefficient: null, oosHitRatePct: null, avgMaxDrawdownPct: null, positiveFoldPct: null, regimesCovered: 0, regimePositivePct: null, archetypesCovered: 0, archetypePositivePct: null, sectorsCovered: 0, sectorPositivePct: null, pValue: 1 };
}
function finalizeV93Tournament(catalog, metrics, policy) {
    const sortedCatalog = catalog.slice().sort((a, b) => a.id.localeCompare(b.id));
    const catalogIds = new Set(sortedCatalog.map(x => x.id));
    const seen = new Set();
    const duplicateMetricFeatureIds = [];
    const unknownMetricFeatureIds = [];
    const metricMap = new Map();
    for (const metric of metrics.slice().sort((a, b) => a.featureId.localeCompare(b.featureId))) {
        if (!catalogIds.has(metric.featureId)) {
            unknownMetricFeatureIds.push(metric.featureId);
            continue;
        }
        if (seen.has(metric.featureId)) {
            duplicateMetricFeatureIds.push(metric.featureId);
            continue;
        }
        seen.add(metric.featureId);
        metricMap.set(metric.featureId, metric);
    }
    const complete = sortedCatalog.map(c => metricMap.get(c.id) ?? emptyMetric(c.id, c.horizon));
    const fdr = (0, statistics_1.benjaminiHochberg)(complete.map(m => ({ id: m.featureId, pValue: m.pValue })), policy.fdrAlpha);
    const fdrMap = new Map(fdr.map(x => [x.id, x]));
    const results = complete.map(m => {
        const f = fdrMap.get(m.featureId);
        const promotion = (0, promotion_1.assessV93Promotion)(m, f.qValue, policy);
        const disposition = (0, promotion_1.dispositionFor)(m, promotion);
        return { ...m, qValue: f.qValue, significant: f.significant, disposition, promotion };
    }).sort((a, b) => a.featureId.localeCompare(b.featureId));
    const counts = Object.fromEntries([...new Set(results.map(x => x.disposition))].sort().map(d => [d, results.filter(x => x.disposition === d).length]));
    return {
        catalogCount: sortedCatalog.length,
        dispositionCount: results.length,
        fdrScopeCount: complete.length,
        v94CandidateCount: results.filter(x => x.disposition === 'V94_CANDIDATE').length,
        duplicateMetricFeatureIds: [...new Set(duplicateMetricFeatureIds)].sort(),
        unknownMetricFeatureIds: [...new Set(unknownMetricFeatureIds)].sort(),
        counts,
        results,
    };
}
