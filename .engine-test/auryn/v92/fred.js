"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFredVintageUrl = buildFredVintageUrl;
exports.normalizeFredVintageObservations = normalizeFredVintageObservations;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const dateLike = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x);
function buildFredVintageUrl(input) {
    if (!input.seriesId || !input.apiKey)
        throw new Error('FRED vintage request requires seriesId and apiKey.');
    const u = new URL('https://api.stlouisfed.org/fred/series/observations');
    u.searchParams.set('series_id', input.seriesId);
    u.searchParams.set('api_key', input.apiKey);
    u.searchParams.set('file_type', 'json');
    u.searchParams.set('output_type', '3');
    u.searchParams.set('realtime_start', '1776-07-04');
    u.searchParams.set('realtime_end', '9999-12-31');
    if (input.observationStart)
        u.searchParams.set('observation_start', input.observationStart.slice(0, 10));
    if (input.observationEnd)
        u.searchParams.set('observation_end', input.observationEnd.slice(0, 10));
    return u.toString();
}
function normalizeFredVintageObservations(seriesId, metric, payload) {
    const id = String(seriesId || '').trim(), m = String(metric || '').trim();
    if (!id || !m)
        throw new Error('FRED adapter requires seriesId and metric.');
    const observations = Array.isArray(payload?.observations) ? payload.observations : [];
    const out = [];
    for (const [i, r] of observations.entries()) {
        const periodEnd = String(r?.date || '').slice(0, 10), availableAt = String(r?.realtime_start || '').slice(0, 10), value = Number(r?.value);
        if (!dateLike(periodEnd) || !dateLike(availableAt))
            throw new Error(`FRED observation ${i} for ${id} is missing date/realtime_start.`);
        if (!finite(value))
            continue;
        out.push({ symbol: '__MACRO__', metric: m, value, periodEnd, availableAt });
    }
    return out.sort((a, b) => a.availableAt.localeCompare(b.availableAt) || (a.periodEnd ?? '').localeCompare(b.periodEnd ?? '') || a.value - b.value);
}
