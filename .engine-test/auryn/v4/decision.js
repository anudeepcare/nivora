"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveV4Decision = resolveV4Decision;
const HORIZONS = ["NOW", "SWING", "SIX_TO_TWELVE_MONTHS", "THREE_TO_FIVE_YEARS"];
const weighted = (parts) => {
    const usable = parts.filter(([v, w]) => v != null && Number.isFinite(v) && w > 0);
    const w = usable.reduce((s, [, weight]) => s + weight, 0);
    return w ? usable.reduce((s, [v, weight]) => s + v * weight, 0) / w : 50;
};
const actionFromScore = (score) => score >= 80 ? "STRONG_BUY" : score >= 66 ? "BUY" : score >= 50 ? "HOLD" : "REDUCE";
const fixed = (action, confidence, reason, ownerAction = action) => ({
    primaryAction: action, ownerAction, reasonCodes: [reason], horizonDecisions: HORIZONS.map(horizon => ({ horizon, action, confidence, reasonCodes: [reason] }))
});
const buy = (a) => a === "BUY" || a === "STRONG_BUY";
function applyHorizonGuards(horizon, action, input) {
    let out = action;
    if (input.riskScore != null && input.riskScore >= 85 && buy(out))
        out = "HOLD";
    if (input.thesis.direction === "WEAKENING" && out === "STRONG_BUY")
        out = "BUY";
    if (input.thesis.direction === "WEAKENING" && input.thesis.strength != null && input.thesis.strength < 58 && out === "BUY")
        out = "HOLD";
    if (input.modelSuitability < .60 && out === "STRONG_BUY")
        out = "BUY";
    if (input.modelSuitability < .60 && out === "BUY")
        out = "HOLD";
    if (input.softConstraints.includes("TECHNICAL_INSTABILITY") && (horizon === "NOW" || horizon === "SWING")) {
        if (buy(out))
            out = "HOLD";
        else if (out === "REDUCE" && input.slowScore != null && input.slowScore >= 65)
            out = "HOLD";
    }
    if (input.valuationScore == null && (horizon === "SIX_TO_TWELVE_MONTHS" || horizon === "THREE_TO_FIVE_YEARS") && buy(out))
        out = "HOLD";
    if (input.softConstraints.includes("EXTREME_VALUATION") && horizon === "SIX_TO_TWELVE_MONTHS" && buy(out))
        out = "HOLD";
    if (input.softConstraints.includes("NEAR_BINARY_EVENT") && horizon === "NOW" && input.businessModel !== "BIOTECH_PHARMA" && buy(out))
        out = "HOLD";
    return out;
}
function reasons(input, primary) {
    const out = [];
    if (input.thesis.strength != null && input.thesis.strength >= 75)
        out.push("LONG_TERM_THESIS_STRONG");
    if (input.softConstraints.includes("TECHNICAL_INSTABILITY"))
        out.push("TECHNICAL_WEAKNESS_LIMITS_TIMING");
    if (input.valuationScore == null || input.missingRequired.includes("VALUATION"))
        out.push("VALUATION_UNAVAILABLE_CAP");
    if (input.softConstraints.includes("EXTREME_VALUATION"))
        out.push("VALUATION_CAPS_NEW_RISK");
    if (input.riskScore != null && input.riskScore >= 85)
        out.push("RISK_CAP_ACTIVE");
    if (input.modelSuitability < .60)
        out.push("MODEL_SUITABILITY_CAP");
    if (primary === "SELL" && input.thesis.direction === "BROKEN")
        out.push("THESIS_BROKEN");
    if (!out.length)
        out.push(primary === "STRONG_BUY" ? "MULTI_HORIZON_CONVICTION" : "MULTI_HORIZON_RESOLUTION");
    return [...new Set(out)];
}
function resolveV4Decision(input) {
    const insufficient = (reason) => fixed("INSUFFICIENT_EVIDENCE", input.confidence, reason, "HOLD");
    const sellAll = (reason) => fixed("SELL", input.confidence, reason, "SELL");
    const criticalMissing = input.missingRequired.filter(factor => factor !== "VALUATION");
    if (criticalMissing.length || input.modelSuitability < .40 || input.thesis.strength == null || input.slowScore == null || input.riskScore == null)
        return insufficient("CRITICAL_EVIDENCE_MISSING");
    if (input.hardVetoes.includes("FRAUD_OR_GOVERNANCE_FAILURE"))
        return sellAll("HARD_VETO_GOVERNANCE");
    if (input.hardVetoes.includes("SOLVENCY_OR_FINANCING_FAILURE"))
        return sellAll("HARD_VETO_SOLVENCY");
    if (input.thesis.direction === "BROKEN" || input.thesis.strength < 30)
        return sellAll("THESIS_BROKEN");
    const nowScore = weighted([[input.technicalScore, .45], [input.catalystScore, .20], [input.sectorScore, .15], [100 - input.riskScore, .20]]);
    const swingScore = weighted([[input.technicalScore, .30], [input.opportunityScore, .25], [input.catalystScore, .15], [input.slowScore, .20], [100 - input.riskScore, .10]]);
    const mediumScore = weighted([[input.slowScore, .40], [input.valuationScore, .20], [input.opportunityScore, .20], [input.sectorScore, .10], [100 - input.riskScore, .10]]);
    const longScore = weighted([[input.slowScore, .50], [input.moat.score, .20], [input.valuationScore, .15], [input.opportunityScore, .10], [100 - input.riskScore, .05]]);
    const scoreByHorizon = { NOW: nowScore, SWING: swingScore, SIX_TO_TWELVE_MONTHS: mediumScore, THREE_TO_FIVE_YEARS: longScore };
    const guardedByHorizon = Object.fromEntries(HORIZONS.map(h => [h, applyHorizonGuards(h, actionFromScore(scoreByHorizon[h]), input)]));
    if (input.softConstraints.includes("EXTREME_VALUATION")) {
        const canRemainLongBuy = input.slowScore >= 85 && input.moat.score != null && input.moat.score >= 80 && input.riskScore < 65;
        if (!canRemainLongBuy && buy(guardedByHorizon.THREE_TO_FIVE_YEARS))
            guardedByHorizon.THREE_TO_FIVE_YEARS = "HOLD";
        else if (canRemainLongBuy && guardedByHorizon.THREE_TO_FIVE_YEARS === "STRONG_BUY")
            guardedByHorizon.THREE_TO_FIVE_YEARS = "BUY";
    }
    const medium = guardedByHorizon.SIX_TO_TWELVE_MONTHS;
    const long = guardedByHorizon.THREE_TO_FIVE_YEARS;
    const intactLongThesis = input.thesis.direction !== "WEAKENING" && input.thesis.strength != null && input.thesis.strength >= 62;
    let primary = medium;
    if (medium === "STRONG_BUY" && long === "STRONG_BUY")
        primary = "STRONG_BUY";
    else if (["BUY", "STRONG_BUY"].includes(medium) && ["BUY", "STRONG_BUY"].includes(long))
        primary = "BUY";
    else if (intactLongThesis && ["BUY", "STRONG_BUY"].includes(long) && medium === "REDUCE")
        primary = "HOLD";
    else if (intactLongThesis && long === "HOLD" && medium === "REDUCE")
        primary = "HOLD";
    else if (medium === "REDUCE" && long === "REDUCE")
        primary = "REDUCE";
    else if (medium === "REDUCE" || long === "REDUCE")
        primary = input.thesis.direction === "WEAKENING" || input.slowScore < 50 ? "REDUCE" : "HOLD";
    else
        primary = "HOLD";
    if (input.softConstraints.includes("TECHNICAL_INSTABILITY") && primary === "STRONG_BUY")
        primary = "BUY";
    if (input.valuationScore == null && buy(primary))
        primary = "HOLD";
    if (input.softConstraints.includes("EXTREME_VALUATION") && buy(primary))
        primary = "HOLD";
    if (input.riskScore >= 85 && buy(primary))
        primary = "HOLD";
    if (input.modelSuitability < .60 && buy(primary))
        primary = "HOLD";
    let ownerAction = primary;
    if (input.thesis.direction === "WEAKENING" && input.thesis.strength != null && input.thesis.strength < 58)
        ownerAction = "REDUCE";
    else if (primary === "REDUCE" && input.thesis.direction !== "WEAKENING" && input.thesis.strength != null && input.thesis.strength >= 55)
        ownerAction = "HOLD";
    const reasonCodes = reasons(input, primary);
    const horizonDecisions = HORIZONS.map(horizon => ({ horizon, action: guardedByHorizon[horizon], confidence: input.confidence, reasonCodes: [...reasonCodes] }));
    return { primaryAction: primary, ownerAction, horizonDecisions, reasonCodes };
}
