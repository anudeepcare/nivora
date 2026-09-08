"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionFeatureRegistry = createProductionFeatureRegistry;
function createProductionFeatureRegistry(input) {
    const approved = new Set(input.approvedFeatureIds);
    const featureIds = input.candidates.filter(c => approved.has(c.featureId) && c.status === 'PRODUCTION_CANDIDATE' && c.promotion?.eligible === true).map(c => c.featureId).sort();
    return { version: input.version, featureIds, featureCount: featureIds.length, autoPromoted: false, createdFromExplicitApprovals: true };
}
