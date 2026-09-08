"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePromotion = evaluatePromotion;
function evaluatePromotion(x) {
    const passed = [], failed = [];
    const gate = (ok, label) => { (ok ? passed : failed).push(label); return ok; };
    const c = x.challenger, p = x.champion;
    gate(c.oosN >= 500, "Out-of-sample sample ≥ 500");
    gate(c.forwardN >= 30, "Forward paper sample ≥ 30");
    gate(c.avgAlphaPct >= p.avgAlphaPct + 0.75, "Average alpha improves by ≥ 0.75 percentage points");
    gate(c.maxDrawdownPct >= p.maxDrawdownPct - 3, "Maximum drawdown is not materially worse");
    gate(c.ecePct <= Math.max(10, p.ecePct + 1), "Calibration error is acceptable");
    return { promote: failed.length === 0, passed, failed, rule: "Promotion creates a new engine version; production weights are never mutated in place." };
}
