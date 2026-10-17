"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalAssessment = buildCanonicalAssessment;
const decision_snapshot_1 = require("./decision-snapshot");
const decision_kernel_1 = require("./decision-kernel");
const domain_1 = require("./domain");
const decision_bridge_1 = require("../v934/decision-bridge");
const research_financial_assessment_1 = require("../../research-financial-assessment");
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
/** The browser and scheduled worker share this adapter. Price refreshes never enter business scoring. */
function buildCanonicalAssessment(input) {
    const { symbol, marketTruth, v5, company, context, marketData: d } = input;
    const financial = (0, research_financial_assessment_1.buildFinancialAssessment)({ symbol, company, businessModel: v5?.v4?.classification?.businessModel,
        lifecycle: v5?.v4?.classification?.lifecycle, asOf: marketTruth.asOf, currentPrice: number(marketTruth.decisionPrice), priceAsOf: marketTruth.decisionPriceAsOf,
        priceCurrency: marketTruth.currency ?? context?.profile?.currency });
    const metric = (id) => v5.metrics.find((m) => m.id === id);
    const value = (id) => metric(id)?.available ? number(metric(id)?.value) : null;
    const confirmed = Object.fromEntries(['1D', '1W', '4H', '1H'].map(key => [key, d?.marketIntelligence?.confirmed?.[key]]).filter(([, bar]) => number(bar?.price) != null && number(bar?.trend?.score) != null && number(bar?.momentum?.score) != null && number(bar?.participation?.score) != null && number(bar?.score) != null));
    const bridge = Object.keys(confirmed).length ? (0, decision_bridge_1.deriveV934DecisionTechnical)({ ...d.marketIntelligence, confirmed }) : null;
    const ts = v5.technical?.technicalState;
    const px = number(marketTruth.decisionPrice), resistance = number(v5.technical?.levels?.resistance), invalidation = number(v5.technical?.levels?.invalidation);
    const technical = bridge ? { trend: bridge.trend, momentum: bridge.momentum, flow: bridge.flow, flowAvailable: bridge.flowAvailable, structure: bridge.structure, nearResistance: bridge.nearResistance, confirmedBreakout: bridge.confirmedBreakout, structuralBreak: bridge.structuralBreak, reclaimLevel: bridge.reclaimLevel, invalidation: bridge.invalidation } : {
        trend: ts?.trend ?? 50, momentum: ts?.momentum ?? 50, flow: ts?.participation ?? 50, flowAvailable: v5.technical?.coverage?.volume !== false && v5.technical?.technicalCoverage?.volume !== false && number(ts?.participation) != null, structure: ts?.structure ?? 50,
        nearResistance: px != null && resistance != null && px >= resistance * .94 && px <= resistance * 1.03,
        confirmedBreakout: px != null && resistance != null && px > resistance && (ts?.participation ?? 0) >= 60,
        structuralBreak: px != null && invalidation != null && px < invalidation, reclaimLevel: resistance, invalidation
    };
    const contextMetrics = ['catalysts', 'macro', 'sector'].map(metric).filter((m) => m?.available && number(m.value) != null);
    const risk = value('riskPressure');
    const scores = { business: financial.businessScore, earningsRevisions: null, valuation: financial.valuationScore,
        marketStructure: bridge?.marketStructureScore ?? number(ts?.strength),
        catalystsRegime: contextMetrics.length ? contextMetrics.reduce((sum, m) => sum + m.value, 0) / contextMetrics.length : null,
        riskAsymmetry: risk == null ? null : 100 - risk };
    const metricEvidence = Object.fromEntries(v5.metrics.map((m) => [m.id, { value: m.value, state: m.state, available: m.available, source: m.source, timeframe: m.timeframe ?? null }]));
    const snapshot = (0, decision_snapshot_1.buildDecisionSnapshot)({ symbol, asOf: marketTruth.asOf, marketTruth,
        completedDailyBarCutoff: d?.analysisAnchorAsOf ?? null, fundamentalsAsOf: financial.evidenceAsOf,
        earningsAsOf: company?.freshness?.latestFiledAt ?? company?.dataQuality?.latestFiledAt ?? null,
        estimatesAsOf: context?.estimatesAsOf ?? null, newsCutoff: context?.asOf ?? null, macroAsOf: d?.analysisAnchorAsOf ?? null,
        featureVersion: 'reported-financials-and-completed-bars-2026-10-16', modelVersion: domain_1.INTELLIGENCE_POLICY_VERSION,
        policyVersion: domain_1.INTELLIGENCE_POLICY_VERSION, evidence: { metrics: metricEvidence, financial, technical } });
    const financialWhy = (label, score) => score == null ? `${label} is unassessed: the required source-backed, business-specific evidence is incomplete.` : `${label} ${Math.round(score)}/100 from reported financial evidence. This is an uncalibrated research assessment, not a return probability.`;
    const decision = (0, decision_kernel_1.buildInstitutionalDecisionKernel)({ snapshotId: snapshot.snapshotId, symbol, marketPrice: px,
        executionTradable: Boolean(marketTruth.executionTradable), previousSetupState: null, scores, technical,
        evidenceCompleteness: Object.values(scores).filter(v => v != null).length / 6 * 100,
        canonicalAction: v5.decision.primaryAction, canonicalOwnerAction: v5.decision.ownerAction,
        pillarEvidence: {
            business: { why: financial.businessWhy || financialWhy('Business quality', scores.business), evidenceIds: financial.evidenceIds, asOf: financial.evidenceAsOf },
            earningsRevisions: { why: 'Reported operating metrics are already counted in business quality. Independent dated forward or management-execution evidence is not yet available; this vote is withheld to avoid double-counting.', evidenceIds: [], asOf: null },
            valuation: { why: financial.valuation.why || financialWhy('Independent valuation', scores.valuation), evidenceIds: financial.valuation.evidenceIds, asOf: financial.valuation.evidenceAsOf ?? null },
            marketStructure: { why: bridge?.why ?? 'Completed-bar price structure; it does not establish a business thesis.', evidenceIds: bridge ? ['v934.completed-bars'] : [], asOf: d?.analysisAnchorAsOf ?? null },
            catalystsRegime: { why: contextMetrics.length ? contextMetrics.map((m) => `${m.label}: ${m.interpretation}`).join(' ') : 'Dated catalyst evidence is unavailable.', evidenceIds: contextMetrics.map((m) => `metric.${m.id}`), asOf: context?.asOf ?? null },
            riskAsymmetry: { why: risk == null ? 'Allocation-risk inputs are unavailable.' : 'Price-derived risk pressure influences deployment, never long-term business quality.', evidenceIds: risk == null ? [] : ['metric.riskPressure'], asOf: d?.analysisAnchorAsOf ?? null },
        } });
    return { decision, snapshot, financial };
}
