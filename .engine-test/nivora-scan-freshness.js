"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshnessDistribution = freshnessDistribution;
function freshnessDistribution(total, under24h, under7d, under30d) {
    const safe = Math.max(0, total);
    const pct = (n) => safe ? Math.round(Math.max(0, Math.min(safe, n)) / safe * 1000) / 10 : 0;
    return { under24h, under7d, under30d, staleOver30d: Math.max(0, safe - under30d), under24hPct: pct(under24h), under7dPct: pct(under7d), under30dPct: pct(under30d) };
}
