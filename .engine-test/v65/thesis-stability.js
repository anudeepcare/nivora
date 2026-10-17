"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stabilizeSlowMetric = stabilizeSlowMetric;
function stabilizeSlowMetric(prior, next) {
    if (prior && prior.evidenceFingerprint === next.evidenceFingerprint) {
        return { value: prior.value, previousValue: prior.value, changed: false, lastMeaningfulChangeAt: prior.lastMeaningfulChangeAt, reason: "Unchanged slow evidence; price-only or fast-market movement cannot rewrite this metric.", changedBecause: [] };
    }
    return { value: next.candidateValue, previousValue: prior?.value ?? next.candidateValue, changed: !prior || prior.value !== next.candidateValue, lastMeaningfulChangeAt: next.now, reason: next.changedBecause.join(" · ") || "New slow evidence.", changedBecause: next.changedBecause };
}
