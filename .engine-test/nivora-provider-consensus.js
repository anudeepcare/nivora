"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessQuoteIntegrity = assessQuoteIntegrity;
exports.validateQuoteIdentity = validateQuoteIdentity;
const pctDiff = (a, b) => {
    const mid = (Math.abs(a) + Math.abs(b)) / 2;
    return mid > 0 ? Math.abs(a - b) / mid * 100 : null;
};
function assessQuoteIntegrity(primary, secondary, maxDisagreementPct = .75) {
    const p = primary ?? null, s = secondary ?? null;
    const any = p || s;
    if (!any)
        return { state: "STALE", tradable: false, reason: "No quote provider returned usable market data.", chosen: null, primary: p, secondary: s, disagreementPct: null };
    if (any.session === "CLOSED" || any.session === "OVERNIGHT") {
        return { state: "MARKET_CLOSED", tradable: false, reason: "The U.S. market session is closed; provider trades are context only until a regular close is verified.", chosen: null, primary: p, secondary: s, disagreementPct: p && s ? pctDiff(p.price, s.price) : null };
    }
    const pLive = !!p && p.freshness === "LIVE" && p.ageSeconds != null && p.price > 0;
    const sLive = !!s && s.freshness === "LIVE" && s.ageSeconds != null && s.price > 0;
    const disagreement = p && s && p.price > 0 && s.price > 0 ? pctDiff(p.price, s.price) : null;
    if (pLive && sLive) {
        if (disagreement != null && disagreement > maxDisagreementPct) {
            return { state: "DISAGREEMENT", tradable: false, reason: `Live providers disagree by ${disagreement.toFixed(2)}%, above the ${maxDisagreementPct.toFixed(2)}% integrity limit. AURYN rejected both prices until a provider can be verified.`, chosen: null, primary: p, secondary: s, disagreementPct: +disagreement.toFixed(4) };
        }
        const chosen = (p.ageSeconds ?? Infinity) <= (s.ageSeconds ?? Infinity) ? p : s;
        return { state: "LIVE_VERIFIED", tradable: true, reason: "Independent live providers agree within the configured integrity tolerance.", chosen, primary: p, secondary: s, disagreementPct: disagreement == null ? null : +disagreement.toFixed(4) };
    }
    if (pLive || sLive) {
        const chosen = pLive ? p : s;
        const singleSourceConflictLimit = Math.max(5, maxDisagreementPct * 4);
        if (p && s && disagreement != null && disagreement > singleSourceConflictLimit) {
            return { state: "DISAGREEMENT", tradable: false, reason: `The fresh ${chosen.provider} quote conflicts with another timestamped provider by ${disagreement.toFixed(2)}%, above the ${singleSourceConflictLimit.toFixed(2)}% single-source safety limit. AURYN rejected the price until market truth can be re-verified.`, chosen: null, primary: p, secondary: s, disagreementPct: +disagreement.toFixed(4) };
        }
        return { state: "LIVE_SINGLE_SOURCE", tradable: true, reason: `${chosen.provider} is fresh; the secondary provider is unavailable or stale, so quote confidence is reduced.`, chosen, primary: p, secondary: s, disagreementPct: disagreement == null ? null : +disagreement.toFixed(4) };
    }
    const freshest = [p, s].filter(Boolean).sort((a, b) => (a.ageSeconds ?? Infinity) - (b.ageSeconds ?? Infinity))[0] ?? null;
    const hasTimestamp = !!freshest && freshest.ageSeconds != null;
    return {
        state: hasTimestamp ? "STALE" : "DELAYED",
        tradable: false,
        reason: hasTimestamp ? "All available quotes are older than the tradable freshness policy." : "Provider timestamps are unavailable, so AURYN cannot verify quote freshness.",
        chosen: null,
        primary: p,
        secondary: s,
        disagreementPct: disagreement == null ? null : +disagreement.toFixed(4)
    };
}
function validateQuoteIdentity(expectedSymbol, quote, hint = {}) {
    const expected = String(expectedSymbol || "").trim().toUpperCase();
    const actual = String(quote?.symbol || "").trim().toUpperCase();
    if (!expected || !actual)
        return { ok: false, reason: "Quote symbol identity is unavailable." };
    if (expected !== actual)
        return { ok: false, reason: `Quote symbol mismatch: requested ${expected}, provider returned ${actual}.` };
    const actualExchange = String(quote?.exchange || "").trim().toUpperCase();
    const expectedExchange = String(hint.exchange || "").trim().toUpperCase();
    if (actualExchange && expectedExchange && !actualExchange.includes(expectedExchange) && !expectedExchange.includes(actualExchange))
        return { ok: false, reason: `Quote exchange mismatch: requested ${expectedExchange}, provider returned ${actualExchange}.` };
    const actualCurrency = String(quote?.currency || "").trim().toUpperCase();
    const expectedCurrency = String(hint.currency || "").trim().toUpperCase();
    if (actualCurrency && expectedCurrency && actualCurrency !== expectedCurrency)
        return { ok: false, reason: `Quote currency mismatch: requested ${expectedCurrency}, provider returned ${actualCurrency}.` };
    return { ok: true, reason: "Quote identity matches the requested security." };
}
