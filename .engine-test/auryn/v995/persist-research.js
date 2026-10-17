"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTONOMOUS_RESEARCH_ENGINE_VERSION = void 0;
exports.persistAutonomousResearch = persistAutonomousResearch;
const provenance_1 = require("../v935/provenance");
const domain_1 = require("../v931/domain");
const research_contract_1 = require("./research-contract");
exports.AUTONOMOUS_RESEARCH_ENGINE_VERSION = domain_1.INTELLIGENCE_POLICY_VERSION;
async function persistAutonomousResearch(client, symbol, result) {
    if (result?.state !== "RESEARCH_READY" || !(0, research_contract_1.validateResearchDecision)(result?.decision))
        throw new Error("AUTONOMOUS_RESEARCH_NOT_READY");
    const d = result.decision, m = result.marketTruth, mi = result.marketIntelligence, observedAt = new Date().toISOString();
    if (typeof m?.decisionPrice !== "number" || !Number.isFinite(m.decisionPrice) || m.decisionPrice <= 0)
        throw new Error("VERIFIED_MARKET_PRICE_REQUIRED");
    const fingerprint = `${domain_1.INTELLIGENCE_POLICY_VERSION}:${d.snapshotId}:${d.newMoneyAction}:${d.evidenceCompleteness}`;
    const canonical = (0, provenance_1.buildV935Provenance)({ symbol, marketSnapshotId: m?.snapshotId ?? null, researchSnapshotId: d?.snapshotId ?? null, fingerprint, generatedAt: observedAt });
    const row = { symbol, observed_at: observedAt, price: Number(m?.decisionPrice), engine_version: exports.AUTONOMOUS_RESEARCH_ENGINE_VERSION, weights_version: domain_1.INTELLIGENCE_POLICY_VERSION, valuation_version: "reported-financial-valuation-2026-10-16", today_policy_version: domain_1.INTELLIGENCE_POLICY_VERSION, evidence_fingerprint: fingerprint, benchmark_symbol: "SPY", sector_benchmark_symbol: null, decision: d, evidence: { v931: d, v934: mi ?? null, v935: canonical, events: Array.isArray(result.events) ? result.events : [], financialEvidence: result.financial ?? null, decisionSnapshot: result.snapshot ?? null, v995: { autonomous: true, policyVersion: domain_1.INTELLIGENCE_POLICY_VERSION, generatedAt: observedAt } } };
    const { error } = await client.from("nivora_v59_decision_snapshots").insert(row);
    if (error)
        throw error;
    return { row, fingerprint, canonicalSnapshotId: canonical.snapshotId };
}
