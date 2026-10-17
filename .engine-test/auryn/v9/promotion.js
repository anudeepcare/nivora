"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessFeaturePromotion = assessFeaturePromotion;
function assessFeaturePromotion(m, qValue) {
    const checks = { sample: m.totalN >= 200, oosSample: m.outOfSampleN >= 60, oosAlpha: m.outOfSampleAvgEdgePct != null && m.outOfSampleAvgEdgePct > 0, oosConfidence: m.outOfSampleConfidence95.low > 0, informationCoefficient: m.informationCoefficient != null && m.informationCoefficient >= .02, regimeBreadth: m.regimesCovered >= 2, regimeStability: m.regimeStabilityPct != null && m.regimeStabilityPct >= 60, drawdown: m.avgMaxDrawdownPct == null || m.avgMaxDrawdownPct >= -20, falseDiscovery: Number.isFinite(qValue) && qValue <= .05 };
    const names = { sample: 'Need at least 200 point-in-time observations.', oosSample: 'Need at least 60 chronological out-of-sample observations.', oosAlpha: 'Out-of-sample cost-adjusted alpha is not positive.', oosConfidence: 'Out-of-sample 95% alpha confidence interval does not stay above zero.', informationCoefficient: 'Information coefficient is below the minimum threshold.', regimeBreadth: 'Evidence must cover at least two market regimes.', regimeStability: 'Positive edge is not stable across enough regimes.', drawdown: 'Average drawdown breaches the -20% research guardrail.', falseDiscovery: 'Candidate does not pass the tournament false-discovery gate.' };
    const blockers = Object.keys(checks).filter(k => !checks[k]).map(k => names[k]);
    return { eligible: blockers.length === 0, checks, blockers };
}
