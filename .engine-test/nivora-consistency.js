"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDecisionConsistency = validateDecisionConsistency;
const finite = (x) => x !== null && x !== undefined && x !== "" && typeof x !== "boolean" && Number.isFinite(Number(x));
function validateDecisionConsistency(x) {
    const errors = [], warnings = [];
    const add = (severity, code, message) => (severity === "ERROR" ? errors : warnings).push({ severity, code, message });
    const action = String(x.todayAction || "").toUpperCase(), thesis = String(x.thesisLabel || "").toUpperCase();
    if (thesis === "BEARISH" && (action === "BUY" || action === "ADD"))
        add("ERROR", "BEARISH_BUY", "A bearish thesis cannot authorize new capital.");
    if ((x.vetoes?.length || 0) > 0 && (action === "BUY" || action === "ADD"))
        add("ERROR", "VETO_BUY", "A hard veto cannot coexist with BUY/ADD.");
    if (x.valuationRange) {
        const { bear, base, bull } = x.valuationRange;
        if (!finite(bear) || !finite(base) || !finite(bull) || bear > base || base > bull)
            add("ERROR", "VALUATION_ORDER", "Valuation scenarios must satisfy Bear ≤ Base ≤ Bull.");
    }
    if (finite(x.support) && finite(x.resistance) && Number(x.support) > Number(x.resistance))
        add("ERROR", "LEVEL_ORDER", "Support cannot be above resistance.");
    for (const z of x.zones || []) {
        if (z.low != null && z.high != null && (!finite(z.low) || !finite(z.high) || Number(z.low) > Number(z.high)))
            add("ERROR", "MALFORMED_ZONE", "Price zone low/high values are malformed.");
    }
    if (x.valuationAvailable === false && x.valuationScore === 0)
        add("ERROR", "VALUATION_ZERO_WHEN_UNAVAILABLE", "Unavailable valuation must not be represented as a numeric zero.");
    if (!x.metricProofs?.thesis)
        add("WARN", "MISSING_HEADLINE_PROOF", "Headline thesis score has no metric-proof record.");
    return { ok: errors.length === 0, errors, warnings, notes: [...errors, ...warnings].map(i => i.message) };
}
