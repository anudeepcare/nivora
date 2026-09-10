"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runV93TournamentFromBaseObservations = runV93TournamentFromBaseObservations;
const feature_registry_1 = require("../v9/feature-registry");
const materialize_1 = require("../v91/materialize");
const metrics_1 = require("./metrics");
const policy_1 = require("./policy");
const tournament_1 = require("./tournament");
const report_1 = require("./report");
const version_1 = require("./version");
function runV93TournamentFromBaseObservations(baseObservations, manifest, options = {}) {
    const policy = options.policy ?? policy_1.V93_POLICY;
    const canonical = (0, feature_registry_1.generateFeatureCatalog)();
    const start = Math.max(0, Math.floor(options.candidateStart ?? 0));
    const requested = options.candidateLimit == null ? canonical.length - start : Math.max(0, Math.floor(options.candidateLimit));
    const selected = canonical.slice(start, start + requested);
    const shardSize = Math.max(1, Math.min(2000, Math.floor(options.shardSize ?? 256)));
    const metrics = [];
    for (let i = 0; i < selected.length; i += shardSize) {
        const shard = selected.slice(i, i + shardSize);
        const materialized = (0, materialize_1.materializeFeatureShard)(baseObservations, shard);
        const byFeature = new Map();
        for (const row of materialized.observations) {
            const a = byFeature.get(row.featureId) ?? [];
            a.push(row);
            byFeature.set(row.featureId, a);
        }
        for (const candidate of shard)
            metrics.push((0, metrics_1.evaluateV93Feature)(candidate.id, byFeature.get(candidate.id) ?? [], policy));
    }
    metrics.sort((a, b) => a.featureId.localeCompare(b.featureId));
    const tournament = (0, tournament_1.finalizeV93Tournament)(selected, metrics, policy);
    const completeCatalog = start === 0 && selected.length === canonical.length;
    const reportCore = {
        version: version_1.AURYN_V93_VERSION,
        policy,
        upstream: {
            observationVersion: manifest.version,
            datasetId: manifest.datasetId,
            datasetVersion: manifest.datasetVersion,
            source: manifest.source,
            quality: manifest.quality,
            survivorshipSafe: manifest.survivorshipSafe,
            adjustedPricesVerified: manifest.adjustedPricesVerified,
            baseObservations: baseObservations.length,
        },
        catalog: { canonicalCount: canonical.length, selectedCount: selected.length, candidateStart: start, completeCatalog },
        tournament,
        safety: { researchOnly: true, productionRegistryMutated: false, cioMutated: false, marketTruthMutated: false, brokerPermissionsMutated: false },
    };
    const report = { ...reportCore, deterministicFingerprint: (0, report_1.deterministicFingerprint)(reportCore) };
    const survivors = tournament.results.filter(x => x.disposition === 'V94_CANDIDATE').map(x => ({
        featureId: x.featureId, qValue: x.qValue, oosN: x.oosN, oosAvgEdgePct: x.oosAvgEdgePct, costStressOosAvgEdgePct: x.costStressOosAvgEdgePct, oosConfidence95: x.oosConfidence95, oosInformationCoefficient: x.oosInformationCoefficient, oosHitRatePct: x.oosHitRatePct, positiveFoldPct: x.positiveFoldPct, regimePositivePct: x.regimePositivePct, archetypePositivePct: x.archetypePositivePct, sectorPositivePct: x.sectorPositivePct, blockers: x.promotion.blockers,
    }));
    const survivorRegistry = { version: version_1.AURYN_V93_VERSION, sourceFingerprint: report.deterministicFingerprint, researchOnly: true, autoProductionPromotion: false, featureCount: survivors.length, featureIds: survivors.map(x => x.featureId), survivors };
    const rejections = tournament.results.filter(x => x.disposition !== 'V94_CANDIDATE').map(x => ({ featureId: x.featureId, disposition: x.disposition, blockers: x.promotion.blockers, qValue: x.qValue, totalN: x.totalN, oosN: x.oosN }));
    return { report, survivorRegistry, rejections };
}
