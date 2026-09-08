"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freezeDecision = freezeDecision;
const nivora_version_1 = require("./nivora-version");
const canonical = (x) => {
    if (x === null || typeof x !== "object")
        return JSON.stringify(x);
    if (Array.isArray(x))
        return `[${x.map(canonical).join(",")}]`;
    return `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(",")}}`;
};
const fnv1a = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
} return (h >>> 0).toString(16).padStart(8, "0"); };
function freezeDecision(input) {
    const normalizedEvidence = canonical(input.evidence ?? {});
    return { snapshotSchemaVersion: nivora_version_1.SNAPSHOT_SCHEMA_VERSION, arenaSchemaVersion: nivora_version_1.ARENA_SCHEMA_VERSION, engineVersion: nivora_version_1.ENGINE_VERSION, weightsVersion: nivora_version_1.WEIGHTS_VERSION, valuationVersion: nivora_version_1.VALUATION_VERSION, todayPolicyVersion: nivora_version_1.TODAY_POLICY_VERSION, symbol: String(input.symbol || "").toUpperCase(), observedAt: input.observedAt, price: Number(input.price), benchmarkSymbol: input.benchmarkSymbol || "SPY", sectorBenchmarkSymbol: input.sectorBenchmarkSymbol || null, evidenceFingerprint: fnv1a(normalizedEvidence), decision: input.decision, evidence: input.evidence };
}
