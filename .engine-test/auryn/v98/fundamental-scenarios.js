"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFundamentalScenarioSpectrum = buildFundamentalScenarioSpectrum;
const finite = (x) => x != null && Number.isFinite(x) && x > 0;
const ann = (value, price, years) => finite(price) ? ((value / price) ** (1 / Math.max(.25, years)) - 1) * 100 : null;
function buildFundamentalScenarioSpectrum(x) {
    if (!finite(x.baseValue) || !finite(x.bearValue) || !finite(x.bullValue))
        return null;
    const mk = (label, value) => ({ label, value, impliedAnnualReturnPct: ann(value, x.marketPrice, x.horizonYears) });
    return { basis: x.basis, confidence: Math.max(0, Math.min(100, x.confidence)), horizonYears: x.horizonYears, bear: mk("BEAR", x.bearValue), base: mk("BASE", x.baseValue), bull: mk("BULL", x.bullValue), independentOfMarketPrice: true };
}
