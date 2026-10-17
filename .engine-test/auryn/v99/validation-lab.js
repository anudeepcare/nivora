"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAurynValidationLab = runAurynValidationLab;
const node_crypto_1 = require("node:crypto");
const cio_engine_1 = require("../v97/cio-engine");
const three_clock_1 = require("../v98/three-clock");
const fundamental_scenarios_1 = require("../v98/fundamental-scenarios");
const golden_fixtures_1 = require("./golden-fixtures");
const check = (id, ok, detail, statusIfFalse = "FAIL") => ({ id, status: (ok ? "PASS" : statusIfFalse), detail });
function runAurynValidationLab() {
    const checks = [];
    const actions = new Set();
    for (const f of golden_fixtures_1.GOLDEN_FIXTURES) {
        const x = (0, cio_engine_1.buildAurynCioAssessment)(f.input);
        actions.add(x.newMoneyAction);
        const ok = f.expected.includes(x.newMoneyAction) && f.expected.includes(x.longTermAction);
        checks.push(check(`GOLDEN_${f.id.toUpperCase().replaceAll("-", "_")}`, ok, `${x.newMoneyAction}/${x.longTermAction}`));
    }
    checks.push(check("ACTION_REACHABILITY", ["STRONG_BUY", "START_SMALL", "WAIT", "AVOID"].every(x => actions.has(x)), `reachable=${[...actions].sort().join(",")}`));
    const base = { business: 88, earnings: 78, moat: 90, reinvestment: 86, cashConversion: 82, capitalAllocation: 80, revisions: 72, catalysts: 60, technical: 75 };
    const a = (0, three_clock_1.buildThreeClockState)(base), b = (0, three_clock_1.buildThreeClockState)({ ...base, technical: 15 });
    checks.push(check("THREE_CLOCK_ISOLATION", a.thesis.score === b.thesis.score && b.tactical.score < a.tactical.score, `thesis ${a.thesis.score}->${b.thesis.score}; tactical ${a.tactical.score}->${b.tactical.score}`));
    const intrinsic = { bearValue: 70, baseValue: 120, bullValue: 170, horizonYears: 3, confidence: 82, basis: "golden independent valuation" };
    const va = (0, fundamental_scenarios_1.buildFundamentalScenarioSpectrum)({ ...intrinsic, marketPrice: 80 }), vb = (0, fundamental_scenarios_1.buildFundamentalScenarioSpectrum)({ ...intrinsic, marketPrice: 140 });
    checks.push(check("VALUATION_INDEPENDENCE", Boolean(va && vb && va.base.value === vb.base.value && va.base.impliedAnnualReturnPct !== vb.base.impliedAnnualReturnPct), "Base intrinsic value invariant to spot"));
    checks.push(check("NO_FAKE_SCENARIO", (0, fundamental_scenarios_1.buildFundamentalScenarioSpectrum)({ bearValue: null, baseValue: null, bullValue: null, horizonYears: 3, confidence: 0, basis: "missing", marketPrice: 100 }) === null, "Missing intrinsic inputs remain unavailable"));
    const fail = checks.filter(x => x.status === "FAIL").length, watch = checks.filter(x => x.status === "WATCH").length;
    const status = fail ? "FAIL" : watch ? "WATCH" : "PASS";
    const canonical = { schemaVersion: "auryn-v9.9-validation-lab-1", status, checks };
    const fingerprint = (0, node_crypto_1.createHash)("sha256").update(JSON.stringify(canonical)).digest("hex");
    return { ...canonical, fingerprint };
}
