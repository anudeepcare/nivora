"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTradingMarketData = loadTradingMarketData;
const nivora_execution_quote_1 = require("./nivora-execution-quote");
const nivora_provider_consensus_1 = require("./nivora-provider-consensus");
async function fetchTwelveRaw(symbol, key) {
    const u = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&prepost=true&apikey=${key}`;
    const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(4500) });
    const body = await r.json().catch(() => null);
    if (!r.ok || body?.status === "error" || (!body?.close && !body?.price))
        throw new Error(body?.message || `Twelve Data ${r.status}`);
    return body;
}
async function loadTradingMarketData(symbol, broker, twelveKey, asOf = new Date()) {
    let alpaca = null, twelve = null, twelveRaw = null;
    const work = [];
    if (broker)
        work.push(broker.getLatestExecutionQuote(symbol).then(raw => { alpaca = (0, nivora_execution_quote_1.normalizeAlpacaQuote)(symbol, raw.quote, raw.trade, asOf); }).catch(() => { }));
    if (twelveKey)
        work.push(fetchTwelveRaw(symbol, twelveKey).then(raw => { twelveRaw = raw; twelve = (0, nivora_execution_quote_1.normalizeTwelveExecutionQuote)(raw, asOf); }).catch(() => { }));
    await Promise.all(work);
    if (alpaca && !(0, nivora_provider_consensus_1.validateQuoteIdentity)(symbol, alpaca).ok)
        alpaca = null;
    if (twelve && !(0, nivora_provider_consensus_1.validateQuoteIdentity)(symbol, twelve).ok)
        twelve = null;
    return { integrity: (0, nivora_provider_consensus_1.assessQuoteIntegrity)(alpaca, twelve), alpaca, twelve, twelveRaw };
}
