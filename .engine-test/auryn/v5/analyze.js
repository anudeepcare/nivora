"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAurynV5Analysis = buildAurynV5Analysis;
const version_1 = require("./version");
const metrics_1 = require("./metrics");
const technical_patterns_1 = require("./technical-patterns");
const scenarios_1 = require("./scenarios");
const execution_plan_1 = require("./execution-plan");
const cio_1 = require("./cio");
function buildAurynV5Analysis({ symbol, marketTruth, v4, technical, bars }) {
    const metrics = (0, metrics_1.buildProfessionalMetrics)({ technical, v4, bars });
    const patterns = (0, technical_patterns_1.analyzeTechnicalPatterns)(bars, technical);
    const decision = (0, cio_1.resolveV5CioDecision)({ v4, technical, marketTruth });
    const vf = v4.factors.VALUATION;
    const valuationDecisionGrade = Boolean(vf && vf.score != null && !(vf.validationState !== 'MEASURED' && /preliminary|not allowed|unsupported|unavailable/i.test(String(vf.reason || ''))));
    const executionPlan = (0, execution_plan_1.buildExecutionPlan)({ marketTruth, technical, thesis: v4.thesis, riskScore: v4.factors.RISK?.score ?? null, primaryAction: decision.primaryAction, ownerAction: decision.ownerAction, valuationDecisionGrade });
    const scenario = (0, scenarios_1.buildScenarioMap)({ technical, patterns, executionPlan });
    return { version: 'auryn-v5', engineVersion: version_1.AURYN_V5_ENGINE_VERSION, snapshotId: marketTruth.snapshotId, symbol: String(symbol).toUpperCase(), asOf: marketTruth.asOf, marketTruth, v4, technical, bars, metrics, patterns, scenario, executionPlan, decision };
}
