"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAurynV7Analysis = buildAurynV7Analysis;
const version_1 = require("./version");
const trust_audit_1 = require("./trust-audit");
function buildAurynV7Analysis({ v6 }) {
    const v5 = v6.v5;
    const valuation = v5.metrics.find(m => m.id === 'valuation');
    const trust = (0, trust_audit_1.auditCanonicalTrust)({
        snapshotId: v5.snapshotId,
        marketTruth: { snapshotId: v5.marketTruth.snapshotId, decisionPrice: v5.marketTruth.decisionPrice, priceSensitiveAllowed: v5.marketTruth.priceSensitiveAllowed },
        executionPlan: v5.executionPlan,
        scenario: v5.scenario,
        valuationAvailable: Boolean(valuation?.available),
        primaryAction: v5.decision.primaryAction,
    });
    return { version: 'auryn-v7', engineVersion: version_1.AURYN_V7_ENGINE_VERSION, snapshotId: v5.snapshotId, symbol: v5.symbol, asOf: v5.asOf, v6, trust };
}
