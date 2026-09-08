"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeCalibrationCohorts = summarizeCalibrationCohorts;
exports.reliabilityDisplay = reliabilityDisplay;
const nivora_calibration_v62_1 = require("./nivora-calibration-v62");
function summarizeCalibrationCohorts(rows, minimum = 30) {
    const groups = new Map();
    for (const r of rows) {
        const key = `${r.archetype || "unknown"}|${r.horizon || "unknown"}|${r.regime || "UNKNOWN"}`;
        const xs = groups.get(key) || [];
        xs.push(r);
        groups.set(key, xs);
    }
    return [...groups.entries()].map(([key, xs]) => ({ key, archetype: xs[0]?.archetype || "unknown", horizon: xs[0]?.horizon || "unknown", regime: xs[0]?.regime || "UNKNOWN", summary: (0, nivora_calibration_v62_1.summarizeCalibration)(xs, minimum) })).sort((a, b) => b.summary.n - a.summary.n);
}
function reliabilityDisplay(summary) {
    if (summary.status !== "CALIBRATED")
        return { label: "Collecting", headline: `${summary.n}/${summary.minimum} matured comparable observations`, usable: false };
    return { label: "Calibrated", headline: `N=${summary.n} · hit ${summary.hitRatePct}% · alpha ${summary.avgAlphaPct >= 0 ? "+" : ""}${summary.avgAlphaPct}% · Brier ${summary.brierScore} · ECE ${summary.expectedCalibrationErrorPct}%`, usable: true };
}
