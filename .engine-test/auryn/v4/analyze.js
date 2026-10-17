"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAurynV4CoreAnalysis = buildAurynV4CoreAnalysis;
const classification_1 = require("./classification");
const model_registry_1 = require("./model-registry");
const factors_1 = require("./factors");
const moat_1 = require("./moat");
const thesis_1 = require("./thesis");
const narrative_1 = require("./narrative");
const confidence_1 = require("./confidence");
const decision_1 = require("./decision");
const version_1 = require("./version");
function buildAurynV4CoreAnalysis(bundle) {
    const classification = (0, classification_1.classifyV4Security)({ ...bundle.classificationInput, evidence: bundle.evidenceRefs });
    const selected = (0, model_registry_1.selectAnalystModel)(classification);
    const factorResult = (0, factors_1.evaluateV4Factors)(bundle.observations, selected.definition);
    const moatFingerprint = JSON.stringify(bundle.moatSignals.map(x => [x.factor, x.score, [...x.evidenceIds].sort()]));
    const moat = (0, moat_1.buildMoatAssessment)({ signals: bundle.moatSignals, prior: bundle.priorMoat, evidenceFingerprint: moatFingerprint, now: bundle.asOf, drivers: bundle.moatReasons.drivers, threats: bundle.moatReasons.threats });
    const thesis = (0, thesis_1.buildInvestmentThesis)({ slowScore: factorResult.slowScore, slowEvidenceFingerprint: bundle.slowEvidenceFingerprint, prior: bundle.priorThesis, now: bundle.asOf, companyState: `${classification.businessModel} · ${classification.lifecycle}`, positive: bundle.thesisReasons.positive, negative: bundle.thesisReasons.negative, marketMayBeMissing: bundle.thesisReasons.marketMayBeMissing, invalidators: bundle.thesisInvalidators });
    const narrative = (0, narrative_1.buildNarrativeAssessment)(bundle.narrative);
    const sourceQualityScore = bundle.evidenceRefs.length ? bundle.evidenceRefs.reduce((s, e) => s + (0, confidence_1.sourceQuality)(e.source), 0) / bundle.evidenceRefs.length : 35;
    const freshnessScore = bundle.evidenceRefs.length ? bundle.evidenceRefs.reduce((s, e) => s + (0, confidence_1.evidenceFreshness)(bundle.asOf, e.asOf, e.scope), 0) / bundle.evidenceRefs.length : 35;
    const agreementScore = Math.max(40, 100 - bundle.evidenceConflicts.length * 20);
    const confidence = (0, confidence_1.buildDecisionConfidence)({ coverage: factorResult.coverage, freshness: freshnessScore, sourceQuality: sourceQualityScore, modelSuitability: selected.suitability * 100, agreement: agreementScore, validationState: factorResult.validationState });
    const score = (key) => factorResult.assessments[key]?.score ?? null;
    const decision = (0, decision_1.resolveV4Decision)({ businessModel: classification.businessModel, slowScore: factorResult.slowScore, opportunityScore: factorResult.opportunityScore, riskScore: factorResult.riskScore, technicalScore: score("TECHNICALS"), valuationScore: score("VALUATION"), catalystScore: score("CATALYSTS"), sectorScore: score("SECTOR_INDUSTRY"), thesis, moat, confidence, missingRequired: factorResult.missingRequired, hardVetoes: bundle.hardVetoes, softConstraints: bundle.softConstraints, modelSuitability: selected.suitability });
    return { version: "auryn-v4", engineVersion: version_1.AURYN_V4_ENGINE_VERSION, symbol: bundle.symbol, classification, analystModel: { id: selected.definition.id, version: selected.definition.version, suitability: selected.suitability }, factors: factorResult.assessments, thesis, moat, narrative, primaryAction: decision.primaryAction, ownerAction: decision.ownerAction, horizonDecisions: decision.horizonDecisions, confidence, reasonCodes: decision.reasonCodes };
}
