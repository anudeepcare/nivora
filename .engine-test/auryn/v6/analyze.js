"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAurynV6Analysis = buildAurynV6Analysis;
const version_1 = require("./version");
const proof_1 = require("./proof");
const timeframes_1 = require("./timeframes");
const valuation_registry_1 = require("./valuation-registry");
const portfolio_cio_1 = require("./portfolio-cio");
function buildAurynV6Analysis({ v5, modelProof, portfolioRisk, owns = false, currentPositionPct = 0, sameArchetypeExposurePct = 0 }) {
    const proof = modelProof ?? (0, proof_1.summarizeModelProof)([]);
    const multiTimeframe = (0, timeframes_1.buildMultiTimeframeTechnical)(v5.bars, v5.technical);
    const valuation = (0, valuation_registry_1.resolveValuationMethod)(v5.v4.classification, v5.v4.factors.VALUATION);
    const evidenceConfidence = { score: v5.v4.confidence.score, label: v5.v4.confidence.label, note: 'Current evidence quality, freshness, model suitability and agreement. This is not a probability of profit.' };
    const decisionStrength = { score: v5.decision.confidenceScore, label: v5.decision.confidenceLabel, note: 'Current decision conviction after thesis, valuation, timing and risk resolution; not a historical win probability.' };
    const portfolio = portfolioRisk ? (0, portfolio_cio_1.applyPortfolioCioOverlay)({ independentAction: v5.decision.primaryAction, portfolioRisk, owns, currentPositionPct, sameArchetypeExposurePct }) : null;
    return { version: 'auryn-v6', engineVersion: version_1.AURYN_V6_ENGINE_VERSION, snapshotId: v5.snapshotId, symbol: v5.symbol, asOf: v5.asOf, v5, evidenceConfidence, decisionStrength, modelProof: proof, multiTimeframe, valuation, portfolio };
}
