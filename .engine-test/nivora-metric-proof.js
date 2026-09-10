"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMetricProof = buildMetricProof;
function buildMetricProof(x) {
    if (x.status === "UNAVAILABLE" || x.value == null) {
        return { ...x, numericValue: null, displayValue: "Not established", warning: "Unavailable evidence is not a zero score; AURYN withholds the number instead of inventing precision." };
    }
    const scoreLike = ["thesis", "business", "opportunity", "timing", "valuation", "risk", "growth", "financial"].includes(x.metric.toLowerCase());
    const displayValue = scoreLike ? `${Math.round(x.value)}/100` : String(x.value);
    const warning = x.validationStatus === "UNVALIDATED" ? "This is a versioned heuristic score, not a measured probability or proven forecast." : x.validationStatus === "FORWARD_VALIDATING" ? "Historical validation exists, but forward-live evidence is still accumulating." : null;
    return { ...x, numericValue: x.value, displayValue, warning };
}
