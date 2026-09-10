"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstitutionalDecisionKernel = buildInstitutionalDecisionKernel;
const domain_1 = require("./domain");
const setup_state_1 = require("./setup-state");
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 50)));
const labels = { business: 'Business quality', earningsRevisions: 'Earnings & revisions', valuation: 'Valuation / expected return', marketStructure: 'Market structure', catalystsRegime: 'Catalysts / regime', riskAsymmetry: 'Risk / asymmetry' };
const weights = { business: .24, earningsRevisions: .18, valuation: .16, marketStructure: .18, catalystsRegime: .08, riskAsymmetry: .16 };
function pillar(key, score, evidence) {
    if (score == null || !Number.isFinite(score))
        return { key, label: labels[key], score: null, state: 'UNAVAILABLE', impact: 'UNAVAILABLE', why: evidence?.why || `${labels[key]} evidence is unavailable; AURYN withholds the vote instead of treating missing data as bearish.`, evidenceIds: evidence?.evidenceIds || [], asOf: evidence?.asOf ?? null };
    const s = clamp(score), state = s >= 72 ? 'STRONG' : s >= 60 ? 'CONSTRUCTIVE' : s >= 45 ? 'MIXED' : 'WEAK', impact = s >= 62 ? 'POSITIVE' : s < 45 ? 'NEGATIVE' : 'NEUTRAL';
    return { key, label: labels[key], score: s, state, impact, why: evidence?.why || `${labels[key]} measures ${s}/100 on the canonical snapshot; expand Expert Evidence for the underlying observations.`, evidenceIds: evidence?.evidenceIds || [], asOf: evidence?.asOf ?? null };
}
const actionText = (x) => x.replaceAll('_', ' ');
const round1 = (n) => Math.round(n * 10) / 10;
function buildInstitutionalDecisionKernel(input) {
    const pe = input.pillarEvidence || {};
    const pillars = { business: pillar('business', input.scores.business, pe.business), earningsRevisions: pillar('earningsRevisions', input.scores.earningsRevisions, pe.earningsRevisions), valuation: pillar('valuation', input.scores.valuation, pe.valuation), marketStructure: pillar('marketStructure', input.scores.marketStructure, pe.marketStructure), catalystsRegime: pillar('catalystsRegime', input.scores.catalystsRegime, pe.catalystsRegime), riskAsymmetry: pillar('riskAsymmetry', input.scores.riskAsymmetry, pe.riskAsymmetry) };
    const vals = Object.values(pillars).filter(p => p.score != null);
    const denom = vals.reduce((s, p) => s + weights[p.key], 0) || 1;
    const score = clamp(vals.reduce((s, p) => s + p.score * weights[p.key], 0) / denom);
    const transition = (0, setup_state_1.resolveSetupTransition)({ ...input.technical, previous: input.previousSetupState });
    let newMoney = score >= 78 && ['BREAKOUT_READY', 'BREAKOUT_CONFIRMED', 'TRENDING'].includes(transition.state) ? 'BUY' : score >= 68 && !['DAMAGED', 'FAILED_RECLAIM'].includes(transition.state) ? 'START_SMALL' : 'WAIT';
    let owner = score >= 78 ? 'ADD' : score >= 48 ? 'HOLD' : score >= 34 ? 'REDUCE' : 'EXIT';
    if (input.canonicalAction) {
        const c = actionText(input.canonicalAction);
        newMoney = c === 'STRONG BUY' ? 'BUY' : c === 'BUY' ? 'BUY' : c === 'REDUCE' || c === 'SELL' ? 'WAIT' : 'WAIT';
    }
    if (input.canonicalOwnerAction) {
        const c = actionText(input.canonicalOwnerAction);
        owner = c === 'BUY' || c === 'STRONG BUY' ? 'ADD' : c === 'REDUCE' ? 'REDUCE' : c === 'SELL' ? 'EXIT' : 'HOLD';
    }
    const longTerm = (pillars.business.score ?? 50) >= 75 && (pillars.earningsRevisions.score ?? 50) >= 58 ? 'ATTRACTIVE' : (pillars.business.score ?? 50) < 42 ? 'UNATTRACTIVE' : 'SELECTIVE';
    const attribution = Object.values(pillars).map(p => ({ pillar: p.key, label: p.label, score: p.score, weight: weights[p.key], contribution: p.score == null ? 0 : round1((p.score - 50) * weights[p.key]), direction: p.impact })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    const ordered = [...vals].sort((a, b) => Math.abs((b.score ?? 50) - 50) - Math.abs((a.score ?? 50) - 50));
    const drivers = ordered.filter(p => p.score >= 60).slice(0, 3).map(p => p.why);
    const counterEvidence = ordered.filter(p => p.score < 55).slice(0, 3).map(p => p.why);
    if (!drivers.length)
        drivers.push('No pillar has earned a strong positive state; AURYN is withholding a stronger call until the evidence improves.');
    if (!counterEvidence.length)
        counterEvidence.push('No major pillar is weak on this snapshot; execution and position risk are still governed separately from research conviction.');
    const reclaim = input.technical.reclaimLevel;
    const nextDecisionTrigger = reclaim != null ? `A completed daily close above $${reclaim.toFixed(2)} with participation confirmation is the next setup upgrade trigger.` : transition.state === 'TRENDING' ? 'Maintain trend structure and thesis evidence; no forced entry trigger is active.' : 'A completed bar must materially improve trend, structure and participation before the setup upgrades.';
    const evidenceCompleteness = clamp(input.evidenceCompleteness);
    return { version: domain_1.V931_VERSION, snapshotId: input.snapshotId, symbol: input.symbol.toUpperCase(), newMoneyAction: newMoney, ownerAction: owner, longTermAction: longTerm, executionAction: input.executionTradable ? 'READY' : 'BLOCKED', canonicalPrimaryAction: input.canonicalAction ?? newMoney, setupState: transition.state, decisionScore: score, confidenceScore: evidenceCompleteness, confidenceBasis: 'EVIDENCE_QUALITY_UNCALIBRATED', evidenceCompleteness, pillars, attribution, drivers, counterEvidence, nextDecisionTrigger, invalidationTrigger: input.technical.invalidation == null ? null : `Thesis/setup risk increases materially below $${input.technical.invalidation.toFixed(2)}.`, horizons: { now: newMoney, swing: transition.state === 'BREAKOUT_CONFIRMED' || transition.state === 'TRENDING' ? 'CONSTRUCTIVE' : 'WAIT', sixToTwelveMonths: longTerm, threeToFiveYears: longTerm }, changeExplanation: { changed: transition.changed, from: input.previousSetupState, to: transition.state, trigger: transition.trigger, changedEvidence: transition.changedEvidence, unchangedEvidence: transition.unchangedEvidence } };
}
