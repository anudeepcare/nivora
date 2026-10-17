"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePaperInvalidation = resolvePaperInvalidation;
const validBelow = (x, entry) => {
    const n = Number(x);
    return Number.isFinite(n) && n > 0 && n < entry ? n : null;
};
/**
 * Resolve a reproducible downside reference for PAPER position sizing.
 * This never invents a percentage stop: it only consumes technical levels
 * that were already frozen with the NIVORA decision/evidence.
 */
function resolvePaperInvalidation({ entry, decision, evidence }) {
    if (!Number.isFinite(entry) || entry <= 0)
        return { value: null, source: "none" };
    const v5Invalidation = validBelow(evidence?.v5?.executionPlan?.invalidation, entry);
    if (v5Invalidation != null)
        return { value: v5Invalidation, source: "v5-execution-plan" };
    const risk = Array.isArray(decision?.zones) ? decision.zones.find((z) => z?.kind === "risk") : null;
    const fromDecision = validBelow(risk?.low, entry);
    if (fromDecision != null)
        return { value: fromDecision, source: "decision-risk-zone" };
    const fromEvidence = validBelow(evidence?.levels?.invalidation, entry);
    if (fromEvidence != null)
        return { value: fromEvidence, source: "evidence-invalidation" };
    const majorSupport = validBelow(evidence?.levels?.majorSupport, entry);
    if (majorSupport != null)
        return { value: majorSupport, source: "evidence-major-support" };
    return { value: null, source: "none" };
}
