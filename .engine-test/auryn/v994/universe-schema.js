"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationUniverseColumns = void 0;
exports.isEligibleMarketUniverseRow = isEligibleMarketUniverseRow;
exports.buildExchangeStratifiedUniverse = buildExchangeStratifiedUniverse;
exports.validationUniverseColumns = "symbol,name,exchange,instrument_type,currency,country";
const derivativeSymbol = /(\.WT$|\.WS$|\/WS$|\.UN$|\/U$|\.RT$|\/R$|\^[A-Z0-9]+$)/i;
const commonTypes = new Set(["COMMON STOCK", "COMMON_STOCK", "COMMON", "STOCK", "EQUITY", "CS"]);
function isEligibleMarketUniverseRow(r) {
    const s = String(r.symbol || "").trim().toUpperCase(), t = String(r.instrument_type || "").trim().toUpperCase();
    if (!s || derivativeSymbol.test(s) || !commonTypes.has(t))
        return false;
    if (String(r.currency || "").trim().toUpperCase() !== "USD")
        return false;
    const c = String(r.country || "").trim().toUpperCase();
    if (c && !["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"].includes(c))
        return false;
    return /^[A-Z][A-Z0-9.-]{0,9}$/.test(s);
}
function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
} return h; }
function buildExchangeStratifiedUniverse(rows, limit = 300, seed = "") {
    const groups = new Map();
    for (const r of rows.filter(isEligibleMarketUniverseRow)) {
        const k = String(r.exchange || "OTHER").trim().toUpperCase() || "OTHER";
        const a = groups.get(k) || [];
        a.push(r);
        groups.set(k, a);
    }
    for (const a of groups.values())
        a.sort((x, y) => hash(`${seed}:${x.symbol}`) - hash(`${seed}:${y.symbol}`));
    const keys = [...groups.keys()].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`)), out = [];
    let progress = true;
    while (out.length < limit && progress) {
        progress = false;
        for (const k of keys) {
            const x = groups.get(k)?.shift();
            if (x) {
                out.push(x.symbol.toUpperCase());
                progress = true;
                if (out.length >= limit)
                    break;
            }
        }
    }
    return out;
}
