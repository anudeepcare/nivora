"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildThreeClockState = buildThreeClockState;
const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 50));
const weighted = (xs) => xs.reduce((s, [v, w]) => s + clamp(v) * w, 0) / xs.reduce((s, [, w]) => s + w, 0);
function buildThreeClockState(x) {
    const durable = weighted([[x.business, .24], [x.moat, .20], [x.reinvestment, .18], [x.cashConversion, .15], [x.capitalAllocation, .13], [x.earnings, .10]]);
    const weak = [x.business, x.earnings, x.moat, x.reinvestment, x.cashConversion].filter(v => v < 45).length;
    const depth = weighted([[Math.max(0, 50 - x.business) * 2, .24], [Math.max(0, 50 - x.earnings) * 2, .18], [Math.max(0, 50 - x.moat) * 2, .20], [Math.max(0, 50 - x.reinvestment) * 2, .20], [Math.max(0, 50 - x.cashConversion) * 2, .18]]);
    const deterioration = Math.round(clamp(depth + (Math.max(0, weak - 1) * 10)));
    const thesis = Math.round(clamp(durable - deterioration * .28));
    const valuationClock = Math.round(clamp(weighted([[x.earnings, .35], [x.revisions, .35], [x.cashConversion, .30]])));
    const tactical = Math.round(clamp(weighted([[x.technical, .72], [x.revisions, .18], [x.catalysts, .10]])));
    return { thesis: { score: thesis, deterioration, halfLife: "LONG" }, valuation: { score: valuationClock, halfLife: "MEDIUM" }, tactical: { score: tactical, halfLife: "SHORT" } };
}
