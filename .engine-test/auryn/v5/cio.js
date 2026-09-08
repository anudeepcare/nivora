"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveV5CioDecision = resolveV5CioDecision;
const horizons = ['NOW', 'SWING', 'SIX_TO_TWELVE_MONTHS', 'THREE_TO_FIVE_YEARS'];
const act = (score) => score >= 84 ? 'STRONG_BUY' : score >= 68 ? 'BUY' : score >= 50 ? 'HOLD' : score >= 36 ? 'REDUCE' : 'SELL';
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
function resolveV5CioDecision({ v4, technical, marketTruth }) {
    const thesis = v4.thesis.strength, dir = v4.thesis.direction;
    const vf = v4.factors.VALUATION;
    const valDecisionGrade = Boolean(vf && vf.score != null && !(vf.validationState !== 'MEASURED' && /preliminary|not allowed|unsupported|unavailable/i.test(String(vf.reason || ''))));
    const val = valDecisionGrade ? vf.score : null;
    const risk = v4.factors.RISK?.score ?? null;
    const business = v4.factors.BUSINESS_QUALITY?.score ?? 50;
    const growth = v4.factors.GROWTH_INFLECTION?.score ?? 50;
    const fund = v4.factors.FUNDAMENTALS_EARNINGS?.score ?? 50;
    const tech = technical?.technicalState.strength ?? v4.factors.TECHNICALS?.score ?? 50;
    const hardSell = v4.primaryAction === 'SELL' || dir === 'BROKEN' || (finite(thesis) && thesis < 30);
    if (hardSell) {
        const h = horizons.map(horizon => ({ horizon, action: 'SELL', confidence: v4.confidence, reasonCodes: ['STRUCTURAL_THESIS_BROKEN'] }));
        return { primaryAction: 'SELL', ownerAction: 'SELL', horizonDecisions: h, summary: 'Structural thesis failure overrides short-term technical strength.', why: ['The long-term thesis is broken or a hard structural veto is active.'], watch: ['A price bounce does not repair a broken business thesis by itself.'], confidenceLabel: v4.confidence.label, confidenceScore: v4.confidence.score };
    }
    if (thesis == null) {
        const h = horizons.map(horizon => ({ horizon, action: 'INSUFFICIENT_EVIDENCE', confidence: v4.confidence, reasonCodes: ['STRUCTURAL_EVIDENCE_MISSING'] }));
        return { primaryAction: 'INSUFFICIENT_EVIDENCE', ownerAction: 'HOLD', horizonDecisions: h, summary: 'Critical structural evidence is missing.', why: [], watch: ['AURYN will not manufacture a buy or sell call without structural evidence.'], confidenceLabel: 'LOW', confidenceScore: Math.min(v4.confidence.score, 45) };
    }
    const structural = thesis * .42 + business * .20 + growth * .16 + fund * .12 + (v4.moat.score ?? 50) * .10;
    const riskPenalty = finite(risk) ? Math.max(0, risk - 60) * .28 : 0;
    const valuationAdj = finite(val) ? (val - 50) * .18 : 0;
    const longScore = structural + valuationAdj - riskPenalty;
    const highDecisionConfidence = v4.confidence.score >= 78;
    const capStrongBuy = (action) => action === 'STRONG_BUY' && !highDecisionConfidence ? 'BUY' : action;
    let longAction = capStrongBuy(act(longScore));
    if (dir === 'WEAKENING' && longAction === 'STRONG_BUY')
        longAction = 'BUY';
    if (dir === 'WEAKENING' && longAction === 'BUY' && thesis < 62)
        longAction = 'HOLD';
    if (val == null && (longAction === 'BUY' || longAction === 'STRONG_BUY'))
        longAction = 'HOLD';
    if (finite(risk) && risk >= 88 && (longAction === 'BUY' || longAction === 'STRONG_BUY'))
        longAction = 'HOLD';
    if (longAction === 'SELL')
        longAction = 'REDUCE';
    const timingScore = (technical?.technicalState.entryQuality ?? tech) * .55 + tech * .25 + (technical?.technicalState.participation ?? 50) * .10 + (100 - (technical?.technicalState.volatilityRisk ?? 50)) * .10;
    let nowAction = capStrongBuy(act(timingScore));
    if ((longAction === 'BUY' || longAction === 'STRONG_BUY') && ['SELL', 'REDUCE'].includes(nowAction))
        nowAction = 'HOLD';
    if (longAction === 'HOLD' && nowAction === 'SELL')
        nowAction = 'REDUCE';
    const swingScore = (technical?.technicalState.strength ?? tech) * .45 + (technical?.technicalState.momentum ?? 50) * .25 + (technical?.technicalState.structure ?? 50) * .20 + (100 - (technical?.technicalState.volatilityRisk ?? 50)) * .10;
    let swingAction = capStrongBuy(act(swingScore));
    if ((longAction === 'BUY' || longAction === 'STRONG_BUY') && swingAction === 'SELL')
        swingAction = 'HOLD';
    if (longAction === 'HOLD' && swingAction === 'SELL')
        swingAction = 'REDUCE';
    const midAction = longAction === 'STRONG_BUY' && finite(risk) && risk > 78 ? 'BUY' : longAction;
    const longHorizon = val == null && thesis >= 75 && dir !== 'WEAKENING' ? 'BUY' : longAction;
    let primary = val == null ? 'HOLD' : longAction;
    if (primary === 'STRONG_BUY' || primary === 'BUY') {
        const nowPositive = nowAction === 'BUY' || nowAction === 'STRONG_BUY';
        const swingPositive = swingAction === 'BUY' || swingAction === 'STRONG_BUY';
        if (primary === 'STRONG_BUY' && nowPositive && swingPositive)
            primary = 'STRONG_BUY';
        else if (nowPositive || swingPositive)
            primary = 'BUY';
        else
            primary = 'HOLD';
    }
    const hActions = [['NOW', marketTruth.priceSensitiveAllowed ? nowAction : 'HOLD'], ['SWING', marketTruth.priceSensitiveAllowed ? swingAction : 'HOLD'], ['SIX_TO_TWELVE_MONTHS', midAction], ['THREE_TO_FIVE_YEARS', longHorizon]];
    // Missing valuation caps bullish conviction, but it must never hide broad structural bearishness.
    // If at least three horizons are REDUCE/SELL, including a long horizon, and the thesis itself is weak,
    // the CIO resolves to REDUCE instead of presenting a contradictory HOLD headline.
    const bearish = (a) => a === 'REDUCE' || a === 'SELL';
    const bearishCount = hActions.filter(([, a]) => bearish(a)).length;
    const longBearish = bearish(midAction) && bearish(longHorizon);
    if (bearishCount >= 3 && longBearish && thesis < 50 && dir !== 'STRENGTHENING')
        primary = 'REDUCE';
    let owner = primary === 'REDUCE' && thesis < 50 ? 'REDUCE' : 'HOLD';
    if ((primary === 'BUY' || primary === 'STRONG_BUY') && thesis >= 65 && dir !== 'WEAKENING' && (!finite(risk) || risk < 88))
        owner = 'BUY';
    const summary = marketTruth.priceSensitiveAllowed ? `${primary.replaceAll('_', ' ')} reflects structural thesis, valuation state, timing and risk from one canonical snapshot.` : `Research view preserved, but execution is blocked until market price is independently verified.`;
    return { primaryAction: primary, ownerAction: owner, horizonDecisions: hActions.map(([horizon, action]) => ({ horizon, action, confidence: v4.confidence, reasonCodes: [] })), summary, why: [`Thesis ${Math.round(thesis)}/100 and ${dir.toLowerCase().replaceAll('_', ' ')}.`, val == null ? 'Valuation is not decision-grade, so new-money conviction is capped.' : `Valuation evidence is ${Math.round(val)}/100.`, technical ? `Technical strength ${Math.round(technical.technicalState.strength)}/100; entry quality ${Math.round(technical.technicalState.entryQuality)}/100.` : 'Technical evidence is unavailable.'], watch: [finite(risk) && risk >= 75 ? 'Risk pressure is elevated and reduces sizing/aggressiveness.' : 'Monitor thesis breakers rather than reacting to price noise alone.'], confidenceLabel: v4.confidence.label, confidenceScore: v4.confidence.score };
}
