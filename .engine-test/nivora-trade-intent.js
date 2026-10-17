"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRADING_INTENT_VERSION = void 0;
exports.deriveTradeIntent = deriveTradeIntent;
exports.TRADING_INTENT_VERSION = "v63-trade-intent-1";
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return (h >>> 0).toString(36); };
const entryNotional = (x) => {
    const conviction = Math.max(0, Math.min(100, (x.thesisScore + x.opportunityScore + x.companyScore) / 3));
    return Math.round(1500 + conviction * 35);
};
function deriveTradeIntent(x) {
    if (!x.today)
        return null;
    const a = x.today.action;
    if (x.today.blocked && (a === "BUY" || a === "ADD"))
        return null;
    if (a === "WAIT" || a === "HOLD" || a === "AVOID" || a === "NO ACTION")
        return null;
    const side = a === "SELL" || a === "TRIM" ? "SELL" : "BUY";
    const intentType = a === "BUY" ? "ENTER" : a === "ADD" ? "ADD" : a === "TRIM" ? "TRIM" : "EXIT";
    const rawNotional = side === "BUY" ? entryNotional(x) : 0;
    const key = [exports.TRADING_INTENT_VERSION, x.snapshotId, x.evidenceFingerprint, x.symbol, a, x.observedAt].join("|");
    return { id: `ti_${hash(key)}`, symbol: x.symbol.toUpperCase(), side, intentType, referencePrice: Number(x.price), targetNotional: rawNotional, createdAt: x.observedAt, snapshotId: x.snapshotId, evidenceFingerprint: x.evidenceFingerprint, thesisScore: x.thesisScore, opportunityScore: x.opportunityScore, companyScore: x.companyScore, todayAction: a, todayReason: x.today.reason, requiresApproval: false, version: exports.TRADING_INTENT_VERSION };
}
