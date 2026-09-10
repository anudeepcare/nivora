"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditCrossSurfaceDecision = auditCrossSurfaceDecision;
exports.auditDecisionTransition = auditDecisionTransition;
exports.auditDeterministicFingerprints = auditDeterministicFingerprints;
function auditCrossSurfaceDecision(rows) { const issues = []; if (rows.length < 2)
    return { ok: true, issues }; const base = rows[0]; for (const x of rows.slice(1)) {
    for (const k of ['snapshotId', 'price', 'action', 'ownerAction', 'setupState'])
        if (x[k] !== base[k])
            issues.push(`${x.surface}.${k}=${String(x[k])} differs from ${base.surface}.${k}=${String(base[k])}.`);
} return { ok: issues.length === 0, issues }; }
function auditDecisionTransition(input) { const changed = input.previousAction !== input.nextAction; const issues = []; if (changed && !input.changedEvidence.length)
    issues.push('Decision changed without changed evidence.'); if (changed && !input.trigger)
    issues.push('Decision changed without a causal trigger.'); return { ok: issues.length === 0, issues }; }
function auditDeterministicFingerprints(fingerprints) { const unique = [...new Set(fingerprints)]; return { ok: unique.length <= 1, issues: unique.length <= 1 ? [] : [`Determinism violation: ${unique.length} fingerprints from identical input.`] }; }
