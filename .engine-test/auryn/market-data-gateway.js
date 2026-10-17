"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCanonicalMarketSnapshot = loadCanonicalMarketSnapshot;
exports.loadCanonicalMarketSnapshots = loadCanonicalMarketSnapshots;
const alpaca_paper_1 = require("../alpaca-paper");
const nivora_trading_market_data_1 = require("../nivora-trading-market-data");
const nivora_live_quote_1 = require("../nivora-live-quote");
const nivora_market_session_1 = require("../nivora-market-session");
const market_truth_1 = require("./market-truth");
async function alpacaRegularClose(broker, symbol, asOf) {
    if (!broker || symbol.includes('/'))
        return null;
    try {
        const cutoff = (0, nivora_market_session_1.lastCompletedRegularSessionDate)(asOf);
        const bars = await broker.getRecentBars(symbol, 8);
        const eligible = bars.filter(b => !cutoff || String(b.datetime).slice(0, 10) <= cutoff);
        const close = Number(eligible.at(-1)?.close);
        return Number.isFinite(close) && close > 0 ? close : null;
    }
    catch {
        return null;
    }
}
async function loadCanonicalMarketSnapshot(input) {
    const symbol = String(input.symbol || '').toUpperCase(), asOf = input.asOf ?? new Date();
    const broker = input.alpacaKey && input.alpacaSecret && !symbol.includes('/') ? new alpaca_paper_1.AlpacaPaperBroker(input.alpacaKey, input.alpacaSecret) : null;
    const market = await (0, nivora_trading_market_data_1.loadTradingMarketData)(symbol, broker, input.twelveKey || '', asOf);
    const twelveDisplay = market.twelve && market.twelveRaw ? (0, nivora_live_quote_1.normalizeTwelveQuote)(market.twelveRaw, asOf) : null;
    const twelveClose = market.twelveRaw ? (0, nivora_live_quote_1.resolveTwelveRegularClose)(market.twelveRaw, asOf) : (twelveDisplay?.regularClose ?? null);
    const regularClose = twelveClose ?? await alpacaRegularClose(broker, symbol, asOf);
    const regularCloseTimestamp = regularClose != null ? ((0, nivora_market_session_1.lastCompletedRegularSessionCloseTimestamp)(asOf) ?? (0, nivora_market_session_1.lastCompletedRegularSessionDate)(asOf)) : null;
    const snapshot = (0, market_truth_1.buildCanonicalMarketSnapshot)({ symbol, asOf, primary: market.alpaca, secondary: market.twelve, regularClose, regularCloseTimestamp, maxDisagreementPct: input.maxDisagreementPct });
    const chosen = market.integrity.chosen;
    return { snapshot, displayQuote: { change: snapshot.priceState === 'OFFICIAL_CLOSE' ? null : (twelveDisplay?.change ?? null), changePct: snapshot.priceState === 'OFFICIAL_CLOSE' ? null : (chosen?.changePct ?? twelveDisplay?.changePct ?? null), bid: chosen?.bid ?? null, ask: chosen?.ask ?? null, spreadPct: chosen?.spreadPct ?? null, provider: chosen?.provider ?? (snapshot.priceState === 'OFFICIAL_CLOSE' ? 'official-close' : null), providerTimestamp: chosen?.providerTimestamp ?? snapshot.decisionPriceAsOf, ageSeconds: chosen?.ageSeconds ?? null, freshness: chosen?.freshness ?? (snapshot.priceState === 'OFFICIAL_CLOSE' ? 'LAST_TRADE' : null) }, providerRaw: { twelve: market.twelveRaw } };
}
async function loadCanonicalMarketSnapshots(inputs, concurrency = 6) {
    const out = new Map();
    for (let i = 0; i < inputs.length; i += Math.max(1, concurrency)) {
        const batch = inputs.slice(i, i + Math.max(1, concurrency));
        const settled = await Promise.allSettled(batch.map(x => loadCanonicalMarketSnapshot(x)));
        settled.forEach((r, idx) => { if (r.status === 'fulfilled')
            out.set(batch[idx].symbol.toUpperCase(), r.value); });
    }
    return out;
}
