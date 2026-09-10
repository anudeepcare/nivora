"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleHistoricalReplayBundle = assembleHistoricalReplayBundle;
const sortFacts = (a, b) => a.symbol.localeCompare(b.symbol) || a.availableAt.localeCompare(b.availableAt) || a.metric.localeCompare(b.metric) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.value - b.value;
function assembleHistoricalReplayBundle(input) {
    if (!input?.datasetId || !input?.source || !input?.benchmarkSymbol)
        throw new Error('V9.2 assembly requires datasetId, source, and benchmarkSymbol.');
    const securities = [...(input.securities ?? [])].sort((a, b) => a.symbol.localeCompare(b.symbol));
    const dailyBars = [...(input.dailyBars ?? [])].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.date.localeCompare(b.date));
    const benchmarkBars = [...(input.benchmarkBars ?? [])].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.date.localeCompare(b.date));
    const facts = [...(input.facts ?? [])].sort(sortFacts), events = [...(input.events ?? [])].sort(sortFacts);
    const universeSnapshots = [...(input.universeSnapshots ?? [])].map(s => ({ date: s.date, symbols: [...new Set(s.symbols)].sort() })).sort((a, b) => a.date.localeCompare(b.date));
    const corporateActions = [...(input.corporateActions ?? [])].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
    const adapterCoverage = Object.fromEntries(Object.entries(input.adapterCoverage ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...new Set(v.map(x => String(x).toUpperCase()))].sort()]));
    const adjustedPrices = [...dailyBars, ...benchmarkBars].length > 0 && [...dailyBars, ...benchmarkBars].every(b => b.adjusted === true);
    const hasDatedUniverse = universeSnapshots.length > 0;
    const hasDelistedSecurity = securities.some(s => Boolean(s.delistedDate || s.activeTo));
    const allDelistingsHandled = securities.filter(s => Boolean(s.delistedDate || s.activeTo)).every(s => Number.isFinite(s.delistingReturnPct));
    const pointInTimeUniverse = Boolean(input.pointInTimeUniverse && hasDatedUniverse);
    const includesDelisted = Boolean(input.includesDelisted && hasDelistedSecurity);
    const delistingReturnsHandled = Boolean(input.delistingReturnsHandled && includesDelisted && allDelistingsHandled);
    return { meta: { datasetId: input.datasetId, version: input.version ?? null, source: input.source, benchmarkSymbol: input.benchmarkSymbol.toUpperCase(), adjustedPrices, pointInTimeUniverse, includesDelisted, delistingReturnsHandled, generatedAt: input.generatedAt ?? null }, securities, dailyBars, benchmarkBars, facts, events, universeSnapshots, corporateActions, adapterCoverage };
}
