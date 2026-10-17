"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceMaxAgeSeconds = void 0;
exports.isDisplayQuoteLive = isDisplayQuoteLive;
exports.selectMarketDisplayQuote = selectMarketDisplayQuote;
const n = (v) => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : null; };
const ms = (v) => { if (!v)
    return NaN; const x = new Date(v).getTime(); return Number.isFinite(x) ? x : NaN; };
const marketPriceMaxAgeSeconds = (session) => session === "REGULAR" ? 180 : (session === "PRE_MARKET" || session === "AFTER_HOURS" ? 900 : session === "CRYPTO_24X7" ? 300 : 900);
exports.marketPriceMaxAgeSeconds = marketPriceMaxAgeSeconds;
/** Cached prices remain useful references, but their LIVE badge must expire. */
function isDisplayQuoteLive(quote, symbol, session, now = Date.now()) {
    if (!quote || quote.symbol !== symbol || quote.session !== session || ['CLOSED', 'OVERNIGHT'].includes(session) || quote.displayState !== 'LIVE' || quote.freshness !== 'LIVE' || n(quote.price) == null)
        return false;
    const observed = ms(quote.providerTimestamp), checked = ms(quote.retrievedAt) || (Number(quote.cachedAt));
    const providerAge = now - observed, requestAge = now - checked;
    return Number.isFinite(now) && Number.isFinite(providerAge) && providerAge >= 0 && providerAge <= (0, exports.marketPriceMaxAgeSeconds)(session) * 1000 && Number.isFinite(requestAge) && requestAge >= 0 && requestAge <= 90000;
}
const maxAgeSeconds = exports.marketPriceMaxAgeSeconds;
const labelFor = (session) => session === "REGULAR" ? "LIVE MARKET PRICE" : session === "PRE_MARKET" ? "PRE-MARKET PRICE" : session === "AFTER_HOURS" ? "AFTER-HOURS PRICE" : session === "CRYPTO_24X7" ? "LIVE MARKET PRICE" : "LAST OFFICIAL CLOSE";
function selectMarketDisplayQuote(input) {
    const symbol = String(input.symbol || "").toUpperCase(), now = ms(input.asOf), limit = input.maxDisagreementPct ?? 1.5;
    if (input.session === "OVERNIGHT" || input.session === "CLOSED") {
        const p = n(input.officialClose?.price);
        if (p != null && Number.isFinite(ms(input.officialClose?.asOf)))
            return { symbol, price: p, session: input.session, label: "LAST OFFICIAL CLOSE", asOf: input.officialClose.asOf, source: input.officialClose.source, freshness: "RECENT", confidence: "VERIFIED", providerAgreementPct: null, reason: "Market closed; displaying the last official close." };
    }
    const validRaw = (input.candidates || []).filter(c => {
        if (String(c.symbol || "").toUpperCase() !== symbol || n(c.price) == null || c.session !== input.session)
            return false;
        const t = ms(c.providerTimestamp);
        if (!Number.isFinite(t) || !Number.isFinite(now) || t > now + 5000)
            return false;
        const age = (now - t) / 1000;
        return age >= 0 && age <= maxAgeSeconds(input.session) && c.freshness !== "STALE";
    }).sort((a, b) => ms(b.providerTimestamp) - ms(a.providerTimestamp));
    const family = (p) => p.startsWith("twelve") || p.startsWith("twelvedata") ? "twelvedata" : p.startsWith("alpaca") ? "alpaca" : p;
    const valid = validRaw.filter((c, i, all) => all.findIndex(x => family(x.provider) === family(c.provider)) === i);
    if (!valid.length) {
        // Active sessions never promote a stale morning/regular-session observation to the primary price.
        // A regular close may be supplied separately as reference context, but not as current pre/after-hours price.
        if (input.session === "PRE_MARKET" || input.session === "AFTER_HOURS")
            return { symbol, price: null, session: input.session, label: "ACTIVE_SESSION_PRICE_UNAVAILABLE", asOf: null, source: null, freshness: "VERIFYING", confidence: "CONTESTED", providerAgreementPct: null, reason: "Active session price unavailable; no fresh session-appropriate quote or trade is available." };
        return { symbol, price: null, session: input.session, label: "PRICE VERIFYING", asOf: null, source: null, freshness: "VERIFYING", confidence: "CONTESTED", providerAgreementPct: null, reason: "No sufficiently fresh session-appropriate market price is available." };
    }
    if (valid.length === 1) {
        const q = valid[0];
        return { symbol, price: Number(q.price), session: input.session, label: labelFor(input.session), asOf: q.providerTimestamp, source: q.provider, freshness: "LIVE", confidence: "SINGLE_SOURCE", providerAgreementPct: null, reason: "One fresh provider is available." };
    }
    const a = valid[0], b = valid[1], mid = (Number(a.price) + Number(b.price)) / 2, gap = mid > 0 ? Math.abs(Number(a.price) - Number(b.price)) / mid * 100 : null;
    if (gap != null && gap > limit)
        return { symbol, price: null, session: input.session, label: "PRICE VERIFYING", asOf: null, source: null, freshness: "VERIFYING", confidence: "CONTESTED", providerAgreementPct: gap, reason: `Fresh providers disagree by ${gap.toFixed(2)}%.` };
    return { symbol, price: Number(a.price), session: input.session, label: labelFor(input.session), asOf: a.providerTimestamp, source: a.provider, freshness: "LIVE", confidence: "VERIFIED", providerAgreementPct: gap, reason: "Fresh providers agree; newest timestamp selected." };
}
