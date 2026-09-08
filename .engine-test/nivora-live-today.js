"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLiveQuoteToToday = applyLiveQuoteToToday;
const nivora_version_1 = require("./nivora-version");
function applyLiveQuoteToToday(today, quote, owns) {
    if (!today)
        return undefined;
    if (!quote)
        return today;
    if (quote.integrityTradable === false && (today.action === "BUY" || today.action === "ADD")) {
        return { ...today, action: owns ? "HOLD" : "WAIT", blocked: false, reason: `Market-data integrity is ${quote.integrityState || "not verified"}. NIVORA will not add risk until a fresh trustworthy quote is available.`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    }
    if (quote.freshness !== "LIVE" && (today.action === "BUY" || today.action === "ADD")) {
        return { ...today, action: owns ? "HOLD" : "WAIT", blocked: false, reason: "The current quote is stale or last-trade context. NIVORA requires a fresh quote before adding risk.", policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    }
    if (quote.freshness !== "LIVE")
        return { ...today, policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    const extended = quote.session === "PRE_MARKET" || quote.session === "AFTER_HOURS";
    const gap = Math.abs(Number(quote.changePct || 0));
    if (extended && gap >= 8 && (today.action === "BUY" || today.action === "ADD")) {
        return { ...today, action: owns ? "HOLD" : "WAIT", blocked: false, reason: `Extended-hours move is ${quote.changePct >= 0 ? "+" : ""}${quote.changePct?.toFixed(1)}%. NIVORA will not chase a large gap before regular-session liquidity confirms the price.`, policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
    }
    return { ...today, policyVersion: nivora_version_1.TODAY_POLICY_VERSION };
}
