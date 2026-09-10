"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditHistoricalBundle = auditHistoricalBundle;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const isoLike = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x);
function validateBars(label, bars, errors) {
    const seen = new Set();
    const lastBySymbol = new Map();
    for (const b of bars) {
        const key = `${b.symbol}|${b.date}`;
        if (seen.has(key))
            errors.push(`${label} contains duplicate bar ${key}.`);
        seen.add(key);
        if (!b.adjusted)
            errors.push(`${label} bar ${key} is not explicitly adjusted for corporate actions.`);
        if (!b.symbol || !isoLike(b.date) || ![b.open, b.high, b.low, b.close, b.volume].every(finite)) {
            errors.push(`${label} bar ${key} has invalid required fields.`);
            continue;
        }
        if (b.open <= 0 || b.high <= 0 || b.low <= 0 || b.close <= 0 || b.volume < 0 || b.low > b.high || b.low > Math.min(b.open, b.close) || b.high < Math.max(b.open, b.close))
            errors.push(`${label} bar ${key} has invalid OHLC/volume geometry.`);
        const previous = lastBySymbol.get(b.symbol);
        if (previous && b.date < previous)
            errors.push(`${label} bars for ${b.symbol} are not ascending by date.`);
        lastBySymbol.set(b.symbol, b.date);
    }
}
function validatePointInTime(label, rows, errors) {
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r?.symbol || !r?.metric || !finite(r?.value))
            errors.push(`${label}[${i}] has invalid symbol/metric/value.`);
        if (!isoLike(r?.availableAt))
            errors.push(`${label}[${i}] is missing a valid availableAt timestamp; period-end dates cannot substitute for public availability.`);
    }
}
function auditHistoricalBundle(bundle) {
    const errors = [], warnings = [];
    const facts = Array.isArray(bundle?.facts) ? bundle.facts : [];
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    const snapshots = Array.isArray(bundle?.universeSnapshots) ? bundle.universeSnapshots : [];
    const securities = Array.isArray(bundle?.securities) ? bundle.securities : [];
    const daily = Array.isArray(bundle?.dailyBars) ? bundle.dailyBars : [];
    const bench = Array.isArray(bundle?.benchmarkBars) ? bundle.benchmarkBars : [];
    if (!bundle?.meta?.datasetId || !bundle?.meta?.source || !bundle?.meta?.benchmarkSymbol)
        errors.push('Historical bundle meta must include datasetId, source, and benchmarkSymbol.');
    if (!bundle?.meta?.adjustedPrices)
        errors.push('Historical bundle does not guarantee adjusted prices.');
    if (!daily.length)
        errors.push('Historical bundle has no security daily bars.');
    if (!bench.length)
        errors.push('Historical bundle has no benchmark daily bars.');
    validateBars('dailyBars', daily, errors);
    validateBars('benchmarkBars', bench, errors);
    validatePointInTime('facts', facts, errors);
    validatePointInTime('events', events, errors);
    const adjustedPricesVerified = Boolean(bundle?.meta?.adjustedPrices) && [...daily, ...bench].every(b => b.adjusted === true);
    const hasUniverseSnapshots = snapshots.length > 0 && snapshots.every(s => isoLike(s.date) && Array.isArray(s.symbols));
    const survivorshipSafe = Boolean(bundle?.meta?.pointInTimeUniverse && bundle?.meta?.includesDelisted && bundle?.meta?.delistingReturnsHandled && hasUniverseSnapshots);
    if (!bundle?.meta?.pointInTimeUniverse)
        warnings.push('Universe membership is not guaranteed point-in-time correct.');
    if (!bundle?.meta?.includesDelisted)
        warnings.push('Delisted/removed securities are not explicitly included; survivorship bias may remain.');
    if (!bundle?.meta?.delistingReturnsHandled)
        warnings.push('Delisting returns are not guaranteed to be handled.');
    if (!hasUniverseSnapshots)
        warnings.push('Dated universe snapshots are missing; survivorship-safe membership cannot be proven.');
    const securitySymbols = new Set(securities.map(s => s.symbol));
    const unknownBars = [...new Set(daily.map(b => b.symbol).filter(s => !securitySymbols.has(s)))];
    if (unknownBars.length)
        warnings.push(`${unknownBars.length} symbols have bars but no security-master record.`);
    const valid = errors.length === 0;
    const quality = !valid ? 'INVALID' : survivorshipSafe && adjustedPricesVerified ? 'DECISION_GRADE' : 'LIMITED';
    return { quality, valid, decisionGrade: quality === 'DECISION_GRADE', survivorshipSafe, adjustedPricesVerified, errors, warnings, counts: { securities: securities.length, dailyBars: daily.length, benchmarkBars: bench.length, facts: facts.length, events: events.length, universeSnapshots: snapshots.length } };
}
