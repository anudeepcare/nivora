"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V935_CANONICAL_VERSION = exports.V935_CANONICAL_CONTRACT = void 0;
exports.buildV935Provenance = buildV935Provenance;
exports.V935_CANONICAL_CONTRACT = "AURYN_V9_3_5_CANONICAL_SNAPSHOT";
exports.V935_CANONICAL_VERSION = "auryn-v9.3.5";
function hashText(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
} return h.toString(36); }
function buildV935Provenance(input) {
    const symbol = String(input.symbol || "").trim().toUpperCase();
    const basis = JSON.stringify({ symbol, market: input.marketSnapshotId ?? null, research: input.researchSnapshotId ?? input.fingerprint ?? null });
    return { contract: exports.V935_CANONICAL_CONTRACT, version: exports.V935_CANONICAL_VERSION, snapshotId: `${symbol}-v935-${hashText(basis)}`, generatedAt: input.generatedAt || new Date().toISOString(), marketSnapshotId: input.marketSnapshotId ?? null, researchSnapshotId: input.researchSnapshotId ?? null };
}
