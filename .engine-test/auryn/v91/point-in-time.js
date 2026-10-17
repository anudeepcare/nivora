"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.latestMetricAsOf = latestMetricAsOf;
exports.resolvePointInTimeMetrics = resolvePointInTimeMetrics;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
function latestMetricAsOf(rows, symbol, metric, asOf) {
    const eligible = rows.filter(r => r.symbol === symbol && r.metric === metric && finite(r.value) && r.availableAt <= asOf)
        .sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.metric.localeCompare(b.metric));
    return eligible.length ? eligible[eligible.length - 1].value : null;
}
function resolvePointInTimeMetrics(facts = [], events = [], symbol, asOf) {
    const rows = [...facts, ...events].filter(r => (r.symbol === symbol || r.symbol === '__MACRO__') && finite(r.value) && r.availableAt <= asOf)
        .sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.metric.localeCompare(b.metric));
    const out = {};
    for (const r of rows)
        out[r.metric] = r.value;
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}
