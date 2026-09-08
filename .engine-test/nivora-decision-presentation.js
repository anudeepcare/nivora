"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentPriceZone = presentPriceZone;
exports.formatScenario = formatScenario;
const nivora_format_1 = require("./nivora-format");
const actionable = new Set(["BUY", "ADD", "STRONG BUY", "ACCUMULATE"]);
const avoid = new Set(["AVOID", "SELL", "TRIM", "REDUCE", "EXIT / REASSESS"]);
function presentPriceZone(zone, action) {
    const a = String(action || "").toUpperCase();
    const heading = actionable.has(a) ? "ACTIONABLE ENTRY" : avoid.has(a) ? "REFERENCE ONLY" : "POTENTIAL ENTRY";
    const low = zone.low, high = zone.high;
    let value = "—";
    if (low != null && high != null && Number(low) > Number(high))
        return { heading, value: "Not established", label: zone.label, confidence: zone.confidence, basis: zone.basis, authorized: false };
    if (low != null && high != null) {
        const tolerance = Math.max(.005, Math.max(Math.abs(low), Math.abs(high)) * .001);
        if (Math.abs(high - low) <= tolerance)
            value = `~${(0, nivora_format_1.formatMoney)((low + high) / 2, { confidence: zone.confidence })}`;
        else
            value = `${(0, nivora_format_1.formatMoney)(low, { confidence: zone.confidence })}–${(0, nivora_format_1.formatMoney)(high, { confidence: zone.confidence })}`;
    }
    else if (low != null)
        value = `~${(0, nivora_format_1.formatMoney)(low, { confidence: zone.confidence })}`;
    else if (high != null)
        value = `~${(0, nivora_format_1.formatMoney)(high, { confidence: zone.confidence })}`;
    return { heading, value, label: zone.label, confidence: zone.confidence, basis: zone.basis, authorized: actionable.has(a) };
}
function formatScenario(range, spot) {
    const delta = (value) => spot > 0 ? (value / spot - 1) * 100 : 0;
    return [
        { label: "BEAR", title: "BEAR CASE", value: (0, nivora_format_1.formatMoney)(range.bear, { confidence: range.confidence }), delta: `${delta(range.bear) >= 0 ? "+" : ""}${delta(range.bear).toFixed(1)}%`, raw: range.bear },
        { label: "BASE", title: "BASE CASE", value: (0, nivora_format_1.formatMoney)(range.base, { confidence: range.confidence }), delta: `${delta(range.base) >= 0 ? "+" : ""}${delta(range.base).toFixed(1)}%`, raw: range.base },
        { label: "BULL", title: "BULL CASE", value: (0, nivora_format_1.formatMoney)(range.bull, { confidence: range.confidence }), delta: `${delta(range.bull) >= 0 ? "+" : ""}${delta(range.bull).toFixed(1)}%`, raw: range.bull },
    ];
}
