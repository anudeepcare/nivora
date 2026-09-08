"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFeatureTournament = runFeatureTournament;
const evaluation_1 = require("./evaluation");
const statistics_1 = require("./statistics");
const promotion_1 = require("./promotion");
function runFeatureTournament(observations, options = {}) {
    const ids = options.featureIds?.length ? [...new Set(options.featureIds)] : [...new Set(observations.map(x => x.featureId))];
    const metrics = ids.map(id => (0, evaluation_1.evaluateFeature)(id, observations));
    const fdr = (0, statistics_1.benjaminiHochberg)(metrics.map(m => ({ id: m.featureId, pValue: m.pValue })), options.fdrAlpha ?? .05);
    const q = new Map(fdr.map(x => [x.id, x]));
    const results = metrics.map(m => {
        const f = q.get(m.featureId);
        const promotion = (0, promotion_1.assessFeaturePromotion)(m, f.qValue);
        let status = 'REJECTED';
        if (m.totalN === 0)
            status = 'UNTESTED';
        else if (m.outOfSampleN >= 30 && (m.outOfSampleAvgEdgePct ?? -Infinity) > 0 && m.outOfSampleConfidence95.low > 0)
            status = 'OOS_SURVIVOR';
        if (status === 'OOS_SURVIVOR' && m.totalN >= 120 && m.regimesCovered >= 2)
            status = 'SHADOW';
        if (promotion.eligible)
            status = 'PRODUCTION_CANDIDATE';
        return { ...m, qValue: f.qValue, significant: f.significant, status, promotion };
    }).sort((a, b) => { const rank = (s) => s === 'PRODUCTION_CANDIDATE' ? 5 : s === 'SHADOW' ? 4 : s === 'OOS_SURVIVOR' ? 3 : s === 'REJECTED' ? 2 : 1; return rank(b.status) - rank(a.status) || (b.outOfSampleAvgEdgePct ?? -Infinity) - (a.outOfSampleAvgEdgePct ?? -Infinity) || a.featureId.localeCompare(b.featureId); });
    return { testedFeatureCount: results.filter(x => x.totalN > 0).length, productionCandidateCount: results.filter(x => x.status === 'PRODUCTION_CANDIDATE').length, shadowCount: results.filter(x => x.status === 'SHADOW').length, oosSurvivorCount: results.filter(x => x.status === 'OOS_SURVIVOR').length, rejectedCount: results.filter(x => x.status === 'REJECTED').length, results };
}
