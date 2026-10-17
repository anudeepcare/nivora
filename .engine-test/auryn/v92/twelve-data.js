"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTwelveDataDailyUrl = buildTwelveDataDailyUrl;
exports.normalizeTwelveDataDaily = normalizeTwelveDataDaily;
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const isoDate = (x) => /^\d{4}-\d{2}-\d{2}/.test(x);
function buildTwelveDataDailyUrl(input) {
    if (!input.symbol || !isoDate(input.startDate) || !isoDate(input.endDate) || !input.apiKey)
        throw new Error('Twelve Data request requires symbol, startDate, endDate, and apiKey.');
    if (input.startDate > input.endDate)
        throw new Error('Twelve Data startDate must be <= endDate.');
    const u = new URL('https://api.twelvedata.com/time_series');
    u.searchParams.set('symbol', input.symbol.toUpperCase());
    u.searchParams.set('interval', '1day');
    u.searchParams.set('start_date', input.startDate.slice(0, 10));
    u.searchParams.set('end_date', input.endDate.slice(0, 10));
    u.searchParams.set('adjust', 'all');
    if (input.exchange)
        u.searchParams.set('exchange', input.exchange);
    u.searchParams.set('apikey', input.apiKey);
    return u.toString();
}
function normalizeTwelveDataDaily(symbol, payload) {
    const s = String(symbol || '').trim().toUpperCase();
    if (!s)
        throw new Error('Twelve Data symbol is required.');
    if (payload?.status === 'error' || (!Array.isArray(payload?.values) && payload?.message))
        throw new Error(`Twelve Data provider error: ${payload?.message || payload?.code || 'unknown error'}`);
    if (!Array.isArray(payload?.values))
        throw new Error(`Twelve Data provider response for ${s} has no values array.`);
    const byDate = new Map();
    for (const [i, row] of payload.values.entries()) {
        const date = String(row?.datetime || '').slice(0, 10);
        const open = Number(row?.open), high = Number(row?.high), low = Number(row?.low), close = Number(row?.close), volume = Number(row?.volume ?? 0);
        if (!isoDate(date) || ![open, high, low, close, volume].every(finite))
            throw new Error(`Twelve Data row ${i} for ${s} has invalid OHLC/volume fields.`);
        if (open <= 0 || high <= 0 || low <= 0 || close <= 0 || volume < 0 || low > high || low > Math.min(open, close) || high < Math.max(open, close))
            throw new Error(`Twelve Data row ${date} for ${s} has invalid OHLC geometry.`);
        if (byDate.has(date))
            throw new Error(`Twelve Data response for ${s} contains duplicate daily bar ${date}.`);
        byDate.set(date, { symbol: s, date, open, high, low, close, volume, adjusted: true });
    }
    const bars = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (!bars.length)
        throw new Error(`Twelve Data provider returned no usable daily bars for ${s}.`);
    return { bars, provider: { source: 'TWELVE_DATA', symbol: s, exchange: payload?.meta?.exchange ?? null, timezone: payload?.meta?.exchange_timezone ?? payload?.meta?.timezone ?? null, currency: payload?.meta?.currency ?? null, assetType: payload?.meta?.type ?? null, rows: bars.length } };
}
