"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScenarioMap = buildScenarioMap;
const clamp = (n) => Math.max(0, Math.min(100, n));
const confidence = (n) => n >= 75 ? 'HIGH' : n >= 55 ? 'MEDIUM' : 'LOW';
function buildScenarioMap({ technical, patterns, executionPlan }) {
    if (!technical)
        return null;
    const top = patterns[0];
    const c = clamp(Math.round(technical.scores.trend * .22 + technical.scores.momentum * .22 + technical.scores.flow * .16 + technical.scores.structure * .2 + (100 - technical.scores.risk) * .1 + (top?.score ?? 50) * .1));
    const plan = executionPlan ?? null;
    const blocked = Boolean(plan && plan.state === 'BLOCKED');
    const support = technical.levels.support, major = technical.levels.majorSupport, res = technical.levels.resistance, breakout = technical.levels.breakout, inv = technical.levels.invalidation;
    const waveLabel = technical.scores.trend >= 65 && technical.scores.momentum >= 65 ? 'Impulsive advance candidate' : technical.scores.trend < 40 && technical.scores.momentum < 45 ? 'Corrective decline candidate' : 'Mixed / corrective structure';
    const initial = plan?.initialEntry ?? null;
    const t1 = plan?.targets?.[0]?.price ?? null, t2 = plan?.targets?.[1]?.price ?? t1;
    const intent = plan?.intent ?? 'WATCH';
    const bullSummary = blocked ? 'Price-sensitive bull case is blocked until Market Truth verifies the snapshot.' : intent === 'ACCUMULATE' ? 'Bull case is actionable only inside the canonical entry/DCA plan or after confirmation.' : intent === 'WATCH' ? 'Bull case remains a structural watch until confirmation and participation improve.' : intent === 'REDUCE' ? 'Bull case is secondary while the canonical action is to reduce risk.' : intent === 'EXIT' ? 'Bull case is inactive while the structural thesis supports exit.' : 'Bull case requires structural confirmation and participation.';
    const bull = {
        label: 'BULL', summary: bullSummary,
        trigger: blocked ? null : (plan?.confirmation ?? res),
        zoneLow: blocked ? null : (initial?.low ?? support),
        zoneHigh: blocked ? null : (initial?.high ?? res),
        targetLow: blocked ? null : (t1 ?? breakout),
        targetHigh: blocked ? null : (t2 ?? (breakout + technical.volatility.atr14 * 2)),
        invalidation: blocked ? null : (plan?.invalidation ?? major), confidence: confidence(c)
    };
    const base = { label: 'BASE', summary: 'Base case is consolidation while the structural thesis and canonical invalidation remain intact.', trigger: null, zoneLow: blocked ? null : (initial?.low ?? major), zoneHigh: blocked ? null : (plan?.confirmation ?? res), targetLow: blocked ? null : (initial?.high ?? support), targetHigh: blocked ? null : (plan?.confirmation ?? res), invalidation: blocked ? null : (plan?.invalidation ?? inv), confidence: confidence(55 + technical.scores.structure * .25) };
    const bear = { label: 'BEAR', summary: 'Bear case activates only on a decisive loss of the canonical structural invalidation.', trigger: blocked ? null : (plan?.invalidation ?? inv), zoneLow: blocked ? null : (plan?.invalidation ?? inv), zoneHigh: blocked ? null : (initial?.low ?? major), targetLow: blocked ? null : Math.max(0, (plan?.invalidation ?? inv) - technical.volatility.atr14 * 3), targetHigh: blocked ? null : (plan?.invalidation ?? major), invalidation: blocked ? null : (plan?.confirmation ?? breakout), confidence: confidence(45 + technical.scores.risk * .35) };
    return { snapshotId: plan?.snapshotId ?? null, intent, structure: technical.scores.trend >= 65 ? 'Uptrend / constructive' : technical.scores.trend < 40 ? 'Downtrend / damaged' : 'Transition / mixed trend', setup: top?.type.replaceAll('_', ' ') || 'No dominant setup', confluenceScore: c, waveContext: { label: waveLabel, confidence: confidence(Math.min(c, 70)), note: 'Probabilistic supporting structure only; wave interpretation never determines the decision by itself.' }, bull, base, bear };
}
