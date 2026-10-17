"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTwelveRegularClose = resolveTwelveRegularClose;
exports.normalizeTwelveQuote = normalizeTwelveQuote;
const nivora_market_session_1 = require("./nivora-market-session");
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const isoFromEpoch = (v) => { const n = num(v); if (n == null)
    return null; const d = new Date(n * 1000); return Number.isFinite(d.getTime()) ? d.toISOString() : null; };
/**
 * Twelve Data has two quote shapes in the wild:
 * 1) split extended fields: close=current regular-session close, extended_price=pre/post price
 * 2) legacy extended row: close=extended price, previous_close=regular-session close, is_extended_hours=true
 * Never blindly use previous_close after the closing bell: in split-field responses it is the PRIOR trading day.
 */
function resolveTwelveRegularClose(raw, asOf = new Date()) {
    const session = (0, nivora_market_session_1.marketSessionAt)(asOf);
    const close = num(raw?.close) ?? num(raw?.price);
    const previous = num(raw?.previous_close);
    const legacyExtended = Boolean(raw?.is_extended_hours);
    const hasSeparateExtended = num(raw?.extended_price) != null || num(raw?.extended_timestamp) != null;
    if (session === 'REGULAR')
        return previous ?? close;
    if (hasSeparateExtended)
        return close ?? previous;
    if (legacyExtended && (session === 'PRE_MARKET' || session === 'AFTER_HOURS' || session === 'CLOSED' || session === 'OVERNIGHT'))
        return previous ?? close;
    return close ?? previous;
}
function normalizeTwelveQuote(raw, asOf = new Date()) {
    const session = (0, nivora_market_session_1.marketSessionAt)(asOf);
    const regularClose = resolveTwelveRegularClose(raw, asOf);
    const close = num(raw?.close) ?? num(raw?.price) ?? 0;
    const extendedPrice = num(raw?.extended_price);
    const extendedTimestamp = isoFromEpoch(raw?.extended_timestamp);
    const regularTimestamp = isoFromEpoch(raw?.timestamp);
    const splitExtended = extendedPrice != null && extendedPrice > 0 && extendedTimestamp != null;
    const legacyExtended = Boolean(raw?.is_extended_hours);
    const useExtended = (session === 'PRE_MARKET' || session === 'AFTER_HOURS' || session === 'CLOSED' || session === 'OVERNIGHT') && (splitExtended || legacyExtended);
    const price = useExtended && splitExtended ? extendedPrice : close;
    const providerTimestamp = useExtended && splitExtended ? extendedTimestamp : regularTimestamp;
    const providerDate = providerTimestamp ? new Date(providerTimestamp) : null;
    const ageSeconds = providerDate && Number.isFinite(providerDate.getTime()) ? Math.max(0, Math.round((asOf.getTime() - providerDate.getTime()) / 1000)) : null;
    const freshness = (0, nivora_market_session_1.quoteFreshness)(ageSeconds ?? Number.POSITIVE_INFINITY, session);
    const change = useExtended && splitExtended ? (num(raw?.extended_change) ?? (regularClose != null ? price - regularClose : null)) : num(raw?.change);
    const changePct = useExtended && splitExtended ? (num(raw?.extended_percent_change) ?? (regularClose && regularClose > 0 ? ((price / regularClose) - 1) * 100 : null)) : num(raw?.percent_change);
    return { symbol: String(raw?.symbol || "").toUpperCase(), price, regularClose, change, changePct, session, isExtendedHours: useExtended, providerTimestamp, ageSeconds, freshness, provider: "twelvedata", isRealTime: freshness === "LIVE" };
}
