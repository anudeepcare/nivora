"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyDecisionTransition = classifyDecisionTransition;
exports.decisionStabilityMetrics = decisionStabilityMetrics;
function classifyDecisionTransition(previousAction, currentAction, materialEvidenceChanged) {
    if (previousAction === currentAction)
        return "STABLE";
    return materialEvidenceChanged ? "EVIDENCE_CHANGE" : "NOISE_FLIP";
}
function decisionStabilityMetrics(rows) {
    let transitions = 0, flips = 0, unexplainedFlips = 0;
    for (let i = 1; i < rows.length; i++) {
        transitions++;
        if (rows[i - 1].action !== rows[i].action) {
            flips++;
            if (!rows[i].materialEvidenceChanged)
                unexplainedFlips++;
        }
    }
    const pct = (n) => transitions ? Math.round(n / transitions * 1000) / 10 : 0;
    return { transitions, flips, unexplainedFlips, flipRatePct: pct(flips), unexplainedFlipRatePct: pct(unexplainedFlips) };
}
