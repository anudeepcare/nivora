"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finiteNumberOrNull = finiteNumberOrNull;
exports.blockedDecisionPriceLeak = blockedDecisionPriceLeak;
exports.canonicalAnalyzeGapPct = canonicalAnalyzeGapPct;
exports.isCanonicalAnalyzeGapCritical = isCanonicalAnalyzeGapCritical;
function finiteNumberOrNull(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}
function blockedDecisionPriceLeak(researchAllowed, rawDecisionPrice) {
    return !researchAllowed && finiteNumberOrNull(rawDecisionPrice) !== null;
}
function canonicalAnalyzeGapPct(canonical, analyzed) {
    const c = finiteNumberOrNull(canonical);
    const a = finiteNumberOrNull(analyzed);
    if (c === null || a === null || Math.abs(c) < 0.01)
        return null;
    const gap = Math.abs(a - c) / Math.max(0.01, Math.abs(c)) * 100;
    return Math.round(gap * 100) / 100;
}
function isCanonicalAnalyzeGapCritical(researchAllowed, canonical, analyzed, thresholdPct = 3) {
    if (!researchAllowed)
        return false;
    const gap = canonicalAnalyzeGapPct(canonical, analyzed);
    return gap !== null && gap > thresholdPct;
}
