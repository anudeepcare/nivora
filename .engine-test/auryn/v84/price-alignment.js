"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePriceAlignment = evaluatePriceAlignment;
const finite = (v) => { if (v === null || v === undefined || v === '')
    return null; const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
const pct = (a, b) => { const x = finite(a), y = finite(b); if (x === null || y === null)
    return null; return Math.round(Math.abs(x - y) / Math.max(.01, Math.abs(y)) * 10000) / 100; };
const day = (v) => { const s = String(v ?? '').trim(); if (!s)
    return null; const m = s.match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; };
const liveSession = (s) => s === 'PRE_MARKET' || s === 'REGULAR' || s === 'AFTER_HOURS';
function evaluatePriceAlignment(input) {
    const criticalIssues = [], warnings = [];
    const decision = finite(input.decisionPrice), execution = finite(input.executionPrice), anchor = finite(input.analysisAnchorPrice), close = finite(input.regularClosePrice);
    const threshold = input.closeMismatchThresholdPct ?? 3;
    const intradayMovePct = liveSession(input.session) && decision !== null && anchor !== null ? pct(decision, anchor) : null;
    const closeAnchorGapPct = !liveSession(input.session) && close !== null && anchor !== null ? pct(close, anchor) : null;
    if (input.analysisAnchorRole && input.analysisAnchorRole !== 'COMPLETED_DAILY_BAR')
        criticalIssues.push(`Analysis anchor role ${input.analysisAnchorRole} is not a completed daily bar.`);
    if (input.researchAllowed && decision === null)
        criticalIssues.push('Research-safe Market Truth is missing a finite decision price.');
    if (!input.researchAllowed && decision !== null)
        criticalIssues.push('Blocked Market Truth still exposes a finite decision price.');
    if (input.executionTradable) {
        if (input.priceState !== 'LIVE_VERIFIED')
            criticalIssues.push(`Execution is tradable with non-verified price state ${input.priceState}.`);
        if (input.decisionPriceRole !== 'LIVE_MARKET')
            criticalIssues.push(`Execution is tradable with non-live decision price role ${input.decisionPriceRole}.`);
        if (execution === null)
            criticalIssues.push('Execution-tradable Market Truth is missing an execution price.');
        if (decision !== null && execution !== null && pct(execution, decision) !== 0)
            criticalIssues.push('Execution price does not match the canonical live decision price.');
    }
    else if (execution !== null) {
        criticalIssues.push('A non-execution-tradable snapshot still exposes an execution price.');
    }
    if (input.decisionPriceRole === 'LIVE_MARKET' && !liveSession(input.session))
        warnings.push(`Live-market decision role is unusual during ${input.session}.`);
    if (input.decisionPriceRole === 'REGULAR_CLOSE' && input.priceState !== 'OFFICIAL_CLOSE')
        warnings.push(`Regular-close decision role is paired with ${input.priceState}.`);
    if (!liveSession(input.session) && input.priceState === 'OFFICIAL_CLOSE') {
        const closeDay = day(input.regularCloseAsOf), anchorDay = day(input.analysisAnchorAsOf);
        if (closeDay && anchorDay && closeDay !== anchorDay)
            criticalIssues.push(`Official close date ${closeDay} does not match analysis anchor date ${anchorDay}.`);
        if (closeAnchorGapPct !== null && closeAnchorGapPct > threshold)
            criticalIssues.push(`Official close and analysis anchor differ by ${closeAnchorGapPct.toFixed(2)}%.`);
    }
    else if (intradayMovePct !== null && intradayMovePct > threshold) {
        warnings.push(`Live price is ${intradayMovePct.toFixed(2)}% away from the completed daily-bar anchor; this is intraday movement, not a price-integrity failure.`);
    }
    return { criticalIssues, warnings, intradayMovePct, closeAnchorGapPct };
}
