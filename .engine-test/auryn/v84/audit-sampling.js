"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectDiversifiedAuditUniverse = selectDiversifiedAuditUniverse;
function hash(value) { let h = 2166136261; for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return h >>> 0; }
function clean(rows) {
    const seen = new Set(), out = [];
    for (const row of rows || []) {
        const symbol = String(row?.symbol || '').trim().toUpperCase();
        if (!symbol || seen.has(symbol))
            continue;
        seen.add(symbol);
        const cap = Number(row?.market_cap_m);
        out.push({ symbol, market_cap_m: Number.isFinite(cap) ? cap : null });
    }
    return out;
}
function hashSort(rows) { return [...rows].sort((a, b) => hash(a.symbol) - hash(b.symbol) || a.symbol.localeCompare(b.symbol)); }
function splitRanked(rows, bucketCount) {
    const out = [];
    for (let i = 0; i < bucketCount; i++) {
        const start = Math.floor(i * rows.length / bucketCount), end = Math.floor((i + 1) * rows.length / bucketCount);
        if (end > start)
            out.push(hashSort(rows.slice(start, end)));
    }
    return out;
}
function selectDiversifiedAuditUniverse(rows, limit) {
    const unique = clean(rows), wanted = Math.max(0, Math.min(Math.floor(limit), unique.length));
    if (wanted === 0)
        return [];
    if (unique.length <= wanted)
        return hashSort(unique).map(x => x.symbol);
    // Two independent deterministic stratifications:
    // 1) alphabetic rank spreads the audit across the entire listed universe instead of an A* prefix;
    // 2) market-cap rank, when available, ensures large/mid/small names all participate.
    const alpha = splitRanked([...unique].sort((a, b) => a.symbol.localeCompare(b.symbol)), Math.min(10, unique.length));
    const withCap = unique.filter(x => x.market_cap_m != null).sort((a, b) => (b.market_cap_m ?? 0) - (a.market_cap_m ?? 0));
    const cap = withCap.length >= 25 ? splitRanked(withCap, Math.min(5, withCap.length)) : [];
    const buckets = [...alpha, ...cap];
    const positions = new Array(buckets.length).fill(0), selected = [], used = new Set();
    while (selected.length < wanted) {
        let advanced = false;
        for (let b = 0; b < buckets.length && selected.length < wanted; b++) {
            while (positions[b] < buckets[b].length) {
                const row = buckets[b][positions[b]++];
                if (used.has(row.symbol))
                    continue;
                used.add(row.symbol);
                selected.push(row.symbol);
                advanced = true;
                break;
            }
        }
        if (!advanced)
            break;
    }
    if (selected.length < wanted) {
        for (const row of hashSort(unique)) {
            if (selected.length >= wanted)
                break;
            if (!used.has(row.symbol)) {
                used.add(row.symbol);
                selected.push(row.symbol);
            }
        }
    }
    return selected;
}
