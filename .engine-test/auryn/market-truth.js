"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalMarketSnapshot = buildCanonicalMarketSnapshot;
exports.buildMarketTruth = buildMarketTruth;
exports.formatLocalTime = formatLocalTime;
exports.formatAge = formatAge;
exports.formatMarketTruth = formatMarketTruth;
const nivora_provider_consensus_1 = require("../nivora-provider-consensus");
const nivora_market_session_1 = require("../nivora-market-session");
const finitePrice = (x) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : null; };
const round4 = (n) => Math.round(n * 10000) / 10000;
const fingerprint = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return (h >>> 0).toString(36); };
function buildCanonicalMarketSnapshot(input) {
    const asOf = input.asOf ?? new Date(), symbol = String(input.symbol || "").toUpperCase();
    const calendar = (0, nivora_market_session_1.marketCalendarAt)(asOf), regularClose = finitePrice(input.regularClose), maxGap = input.maxDisagreementPct ?? 1;
    const regularCloseAsOf = input.regularCloseTimestamp ?? null;
    const integrity = (0, nivora_provider_consensus_1.assessQuoteIntegrity)(input.primary ?? null, input.secondary ?? null, maxGap);
    const sources = [input.primary, input.secondary].filter((x) => Boolean(x)).map(x => ({ provider: x.provider, price: x.price, providerTimestamp: x.providerTimestamp, ageSeconds: x.ageSeconds, freshness: x.freshness }));
    const rawProviderGapPct = integrity.disagreementPct == null ? null : round4(integrity.disagreementPct);
    let providerAgreementPct = (calendar.session === "REGULAR" || calendar.session === "PRE_MARKET" || calendar.session === "AFTER_HOURS") ? rawProviderGapPct : null;
    const contextProviderGapPct = rawProviderGapPct;
    let priceState = "UNAVAILABLE", decisionPrice = null, displayPrice = null, extendedPrice = null, decisionPriceAsOf = null;
    let liveMarketPrice = null, liveMarketPriceAsOf = null, executionPrice = null, executionPriceAsOf = null;
    let decisionPriceRole = "NONE", priceSensitiveAllowed = false, executionTradable = false;
    let priceUse = "BLOCKED";
    let reason = "No verified market price is available.";
    const useRegularClose = (why) => {
        if (regularClose == null)
            return false;
        // An open-session fallback needs dated evidence; an undated numeric close is not verified.
        if (calendar.session === "REGULAR" && (!regularCloseAsOf || !Number.isFinite(Date.parse(regularCloseAsOf))))
            return false;
        priceState = "OFFICIAL_CLOSE";
        decisionPrice = regularClose;
        displayPrice = regularClose;
        decisionPriceAsOf = regularCloseAsOf;
        decisionPriceRole = "REGULAR_CLOSE";
        priceSensitiveAllowed = true;
        executionTradable = false;
        priceUse = "RESEARCH_CLOSE";
        providerAgreementPct = null;
        reason = why;
        return true;
    };
    const useLive = (singleSource, extended) => {
        const chosen = integrity.chosen;
        priceState = singleSource ? "LIVE_SINGLE_SOURCE" : "LIVE_VERIFIED";
        decisionPrice = chosen.price;
        displayPrice = chosen.price;
        decisionPriceAsOf = chosen.providerTimestamp ?? asOf.toISOString();
        decisionPriceRole = "LIVE_MARKET";
        liveMarketPrice = chosen.price;
        liveMarketPriceAsOf = decisionPriceAsOf;
        priceSensitiveAllowed = true;
        if (extended) {
            extendedPrice = chosen.price;
            executionTradable = false;
            priceUse = "RESEARCH_EXTENDED";
            reason = singleSource ? "One fresh extended-hours provider is available; AURYN uses it for research context only and keeps execution blocked." : "Independent fresh extended-hours providers agree; AURYN uses the extended-hours price for research context only and keeps execution blocked.";
        }
        else if (singleSource) {
            executionTradable = false;
            priceUse = "RESEARCH_LIVE_SINGLE_SOURCE";
            reason = "One fresh provider is available without a contradictory fresh provider; research is allowed, but execution requires independent live verification.";
        }
        else {
            executionTradable = true;
            executionPrice = chosen.price;
            executionPriceAsOf = decisionPriceAsOf;
            priceUse = "LIVE_EXECUTION";
            reason = "Independent fresh providers agree within the market-truth tolerance.";
        }
    };
    if (calendar.session === "REGULAR") {
        if (integrity.state === "LIVE_VERIFIED" && integrity.chosen)
            useLive(false, false);
        else if (integrity.state === "LIVE_SINGLE_SOURCE" && integrity.chosen) {
            const closeGap = regularClose == null ? null : Math.abs(integrity.chosen.price - regularClose) / regularClose * 100;
            if (closeGap != null && closeGap > 30) {
                priceState = "UNVERIFIED";
                reason = `The only fresh provider is ${closeGap.toFixed(2)}% away from the last regular close. AURYN requires an independent confirming source before accepting an extreme discontinuity.`;
            }
            else
                useLive(true, false);
        }
        else if (integrity.state === "DISAGREEMENT") {
            priceState = "UNVERIFIED";
            reason = `Fresh providers disagree materially${providerAgreementPct == null ? "" : ` (${providerAgreementPct.toFixed(2)}%)`}; AURYN blocked the live decision price.`;
        }
        else if (!useRegularClose(`Regular-session quotes are stale or timestamp-unverified; AURYN uses the last verified regular close for research and keeps execution blocked until a fresh live quote is verified.`)) {
            priceState = sources.length ? "UNVERIFIED" : "UNAVAILABLE";
            reason = sources.length ? "Available regular-session provider quotes are stale or timestamp-unverified and no verified regular close is available." : "No provider returned a usable regular-session market price and no verified regular close is available.";
        }
    }
    else if (calendar.session === "PRE_MARKET" || calendar.session === "AFTER_HOURS") {
        const sessionLabel = calendar.session === "PRE_MARKET" ? "Pre-market" : "After-hours";
        if (integrity.state === "LIVE_VERIFIED" && integrity.chosen)
            useLive(false, true);
        else if (integrity.state === "LIVE_SINGLE_SOURCE" && integrity.chosen) {
            const closeGap = regularClose == null ? null : Math.abs(integrity.chosen.price - regularClose) / regularClose * 100;
            if (closeGap == null || closeGap <= 30)
                useLive(true, true);
            else if (!useRegularClose(`${sessionLabel} has an unconfirmed ${closeGap.toFixed(2)}% discontinuity; AURYN is anchored to the last verified regular close for research and keeps execution blocked.`)) {
                priceState = "UNVERIFIED";
                reason = `${sessionLabel} has an unconfirmed ${closeGap.toFixed(2)}% discontinuity and no verified regular close is available.`;
            }
        }
        else if (integrity.state === "DISAGREEMENT") {
            if (!useRegularClose(`${sessionLabel} providers disagree materially; AURYN is anchored to the last verified regular close for research and keeps execution blocked.`)) {
                priceState = "UNVERIFIED";
                reason = `${sessionLabel} providers disagree materially and a verified regular close is unavailable.`;
            }
        }
        else if (!useRegularClose(`${sessionLabel} quotes are stale, delayed, or timestamp-unverified; AURYN is anchored to the last verified regular close for continuous research and keeps execution blocked.`)) {
            priceState = sources.length ? "UNVERIFIED" : "UNAVAILABLE";
            reason = `${sessionLabel} market data is not independently usable and a verified regular close is unavailable.`;
        }
    }
    else if (regularClose != null) {
        useRegularClose(calendar.calendarState === "HOLIDAY" ? "U.S. equities are closed for an exchange holiday; AURYN is anchored to the last verified regular close." : "The market is closed; AURYN is anchored to the last verified regular close.");
        const recent = sources.filter(s => s.price > 0).sort((a, b) => (a.ageSeconds ?? Infinity) - (b.ageSeconds ?? Infinity))[0];
        extendedPrice = recent && Math.abs(recent.price - regularClose) / regularClose < .35 ? recent.price : null;
    }
    else {
        priceState = sources.length ? "UNVERIFIED" : "UNAVAILABLE";
        reason = "The market is closed and a verified regular close is unavailable; price-sensitive analysis is blocked.";
    }
    const snapshotId = `${symbol}-${calendar.date}-${fingerprint(JSON.stringify({ priceState, priceUse, decisionPrice, decisionPriceRole, regularClose, regularCloseAsOf, providerAgreementPct, sources: sources.map(s => [s.provider, s.price, s.providerTimestamp]) }))}`;
    return { snapshotId, symbol, asOf: asOf.toISOString(), session: calendar.session, calendarState: calendar.calendarState, priceState, decisionPrice, displayPrice, decisionPriceAsOf, decisionPriceRole, regularClose, regularClosePrice: regularClose, regularCloseAsOf, liveMarketPrice, liveMarketPriceAsOf, executionPrice, executionPriceAsOf, extendedPrice, providerAgreementPct, contextProviderGapPct, sources, priceSensitiveAllowed, decisionAllowed: priceSensitiveAllowed, executionTradable, priceUse, reason };
}
const age = (stamp, checked) => { if (!stamp)
    return null; const a = (new Date(checked).getTime() - new Date(stamp).getTime()) / 1000; return Number.isFinite(a) ? Math.max(0, Math.round(a)) : null; };
function buildMarketTruth(q, canonical, checkedAt = new Date().toISOString()) {
    const price = Number.isFinite(Number(q?.price)) ? Number(q.price) : null, priceTimestamp = q?.providerTimestamp || q?.retrievedAt || canonical?.decisionPriceAsOf || canonical?.asOf || null;
    const session = String(q?.session || canonical?.session || "CLOSED"), a = age(priceTimestamp, checkedAt), raw = String(q?.label || "");
    let freshness = "VERIFYING", label = "PRICE VERIFYING";
    if ((session === "AFTER_HOURS" || session === "PRE_MARKET") && price == null) {
        freshness = "VERIFYING";
        label = session === "AFTER_HOURS" ? "AFTER-HOURS PRICE UNAVAILABLE" : "PRE-MARKET PRICE UNAVAILABLE";
    }
    else if (session === "CRYPTO_24X7") {
        freshness = "CRYPTO_24X7";
        label = "24/7 LIVE";
    }
    else if (price != null && raw === "PRE-MARKET PRICE") {
        freshness = "PRE_MARKET";
        label = "PRE-MARKET";
    }
    else if (price != null && raw === "AFTER-HOURS PRICE") {
        freshness = "AFTER_HOURS";
        label = "AFTER-HOURS";
    }
    else if (price != null && raw === "LIVE MARKET PRICE") {
        freshness = "LIVE";
        label = "LIVE MARKET PRICE";
    }
    else if (price != null && (raw === "LAST MARKET PRICE" || raw === "LAST OFFICIAL CLOSE" || session === "CLOSED" || session === "OVERNIGHT")) {
        freshness = a != null && a < 21600 ? "RECENT" : "MARKET_CLOSED";
        label = freshness === "RECENT" ? "RECENT · LAST MARKET PRICE" : "MARKET CLOSED · LAST MARKET PRICE";
    }
    else if (price != null) {
        freshness = "RECENT";
        label = "RECENT · LAST MARKET PRICE";
    }
    const referencePrice = Number.isFinite(Number(canonical?.regularClosePrice ?? canonical?.regularClose)) ? Number(canonical?.regularClosePrice ?? canonical?.regularClose) : null, referencePriceTimestamp = canonical?.regularCloseAsOf || null;
    return { price, provider: q?.provider || canonical?.source || null, priceTimestamp, checkedAt, session, freshness, confidence: String(q?.confidence || canonical?.confidence || "SINGLE_SOURCE"), ageSeconds: a, label, referencePrice, referencePriceTimestamp };
}
function formatLocalTime(stamp) { if (!stamp)
    return "—"; return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(new Date(stamp)); }
function formatAge(seconds) { if (seconds == null)
    return "unknown age"; if (seconds < 60)
    return `${seconds}s ago`; if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ago`; return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ago`; }
function formatMarketTruth(t) { const reference = t.referencePrice != null ? ` · regular close $${t.referencePrice.toFixed(2)}${t.referencePriceTimestamp ? ` at ${formatLocalTime(t.referencePriceTimestamp)}` : ""}` : ""; return { status: t.label, detail: t.priceTimestamp ? `Price as of ${formatLocalTime(t.priceTimestamp)} · ${t.provider || "market provider"} · ${formatAge(t.ageSeconds)} · checked ${formatLocalTime(t.checkedAt)}` : `Checked ${formatLocalTime(t.checkedAt)}${reference} · waiting for a current session price` }; }
