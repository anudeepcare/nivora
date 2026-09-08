"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTwelveRegularClose = resolveTwelveRegularClose;
exports.normalizeTwelveQuote = normalizeTwelveQuote;
const nivora_market_session_1 = require("./nivora-market-session");
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
function resolveTwelveRegularClose(raw, asOf = new Date()) {
    const session = (0, nivora_market_session_1.marketSessionAt)(asOf);
    const close = num(raw?.close) ?? num(raw?.price);
    const previous = num(raw?.previous_close);
    const extended = Boolean(raw?.is_extended_hours);
    if (session === 'CLOSED' || session === 'OVERNIGHT')
        return extended ? (previous ?? close) : (close ?? previous);
    if (session === 'PRE_MARKET' || session === 'AFTER_HOURS')
        return previous ?? close;
    return previous ?? close;
}
function normalizeTwelveQuote(raw, asOf = new Date()) {
    const ts = num(raw?.timestamp);
    const providerDate = ts != null ? new Date(ts * 1000) : null;
    const providerTimestamp = providerDate && Number.isFinite(providerDate.getTime()) ? providerDate.toISOString() : null;
    const ageSeconds = providerDate ? Math.max(0, Math.round((asOf.getTime() - providerDate.getTime()) / 1000)) : null;
    const session = (0, nivora_market_session_1.marketSessionAt)(asOf);
    const freshness = (0, nivora_market_session_1.quoteFreshness)(ageSeconds ?? Number.POSITIVE_INFINITY, session);
    const price = num(raw?.close) ?? num(raw?.price) ?? 0;
    return { symbol: String(raw?.symbol || "").toUpperCase(), price, regularClose: num(raw?.previous_close), change: num(raw?.change), changePct: num(raw?.percent_change), session, isExtendedHours: Boolean(raw?.is_extended_hours), providerTimestamp, ageSeconds, freshness, provider: "twelvedata", isRealTime: freshness === "LIVE" };
}
