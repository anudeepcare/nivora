"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveTodayAction = deriveTodayAction;
const nivora_version_1 = require("./nivora-version");
const nivora_buy_calibration_1 = require("./nivora-buy-calibration");
function deriveTodayAction(d, owns) {
    const vetoes = d.vetoes || [], consistent = d.consistency?.ok !== false;
    if (!owns && vetoes.length > 0)
        return { action: "AVOID", blocked: true, reason: `Hard veto blocks new capital: ${vetoes[0]}`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit: (0, nivora_buy_calibration_1.evaluateBuyCalibration)(d) };
    if (d.thesisState === "Broken" || d.thesisScore < 29 || vetoes.length >= 2 || !consistent) {
        return { action: owns ? "SELL" : "AVOID", blocked: true, reason: !consistent ? `Decision blocked by consistency gate${d.consistency?.notes?.[0] ? `: ${d.consistency.notes[0]}` : "."}` : "Long-term thesis/veto evidence blocks new risk.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    }
    if (d.thesisLabel === "BEARISH" && Number(d.strategicScore ?? 0) < 50 && Number(d.longTermScore ?? d.thesisScore) < 50)
        return { action: owns ? "SELL" : "AVOID", blocked: true, reason: "Long-term, strategic and fundamental evidence are aligned negatively enough to block new capital.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    const timing = d.timing?.label || "WAIT";
    const buyAudit = (0, nivora_buy_calibration_1.evaluateBuyCalibration)(d);
    if (owns) {
        if (d.thesisState === "Weakening" && d.thesisScore < 50 && Number(d.strategicScore ?? 0) < 50 && Number(d.longTermScore ?? d.thesisScore) < 50)
            return { action: "TRIM", blocked: false, reason: "Long-term, strategic and current thesis evidence are all weakening enough to reduce exposure while evidence is reassessed.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
        if (d.valuationLabel === "Expensive" && timing === "OVEREXTENDED" && d.thesisScore < 72)
            return { action: "TRIM", blocked: false, reason: "Valuation and extension are elevated relative to conviction.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
        if (buyAudit.eligible)
            return { action: "ADD", blocked: false, reason: `${buyAudit.tier === "CONFIRMED" ? "Confirmed" : "Starter"} ${buyAudit.path.replaceAll("_", " ").toLowerCase()} pathway supports staged additional capital.`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyPath: buyAudit.path, buyTier: buyAudit.tier, buyAudit };
        return { action: "HOLD", blocked: false, reason: "The position remains investable but does not require a change today.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
    }
    if (buyAudit.eligible)
        return { action: "BUY", blocked: false, reason: `${buyAudit.tier === "CONFIRMED" ? "Confirmed" : "Starter"} ${buyAudit.path.replaceAll("_", " ").toLowerCase()} pathway is satisfied for staged new capital.`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyPath: buyAudit.path, buyTier: buyAudit.tier, buyAudit };
    if (timing === "OVEREXTENDED" || timing === "WEAK")
        return { action: "WAIT", blocked: false, reason: buyAudit.primaryBlocker || (timing === "OVEREXTENDED" ? "Thesis may be valid, but price is too extended to chase." : "Price has not stabilized enough for a new position."), policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
    if (d.thesisLabel === "BULLISH")
        return { action: "WAIT", blocked: false, reason: `Closest BUY path ${String(buyAudit.closestPath || "STANDARD").replaceAll("_", " ")} is not ready: ${buyAudit.primaryBlocker || "insufficient edge."}`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
    return { action: "NO ACTION", blocked: false, reason: `Evidence is mixed and does not justify deploying new capital today${buyAudit.primaryBlocker ? `: ${buyAudit.primaryBlocker}` : "."}`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION, buyAudit };
}
