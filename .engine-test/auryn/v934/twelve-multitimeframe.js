"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTwelveBars = parseTwelveBars;
exports.resampleSequential = resampleSequential;
exports.aggregateCompletedWeeks = aggregateCompletedWeeks;
exports.loadV934DecisionBars = loadV934DecisionBars;
exports.loadV934LiveContext = loadV934LiveContext;
exports.loadV934MarketBars = loadV934MarketBars;
const nivora_market_session_1 = require("../../nivora-market-session");
const completed_bars_1 = require("../v84/completed-bars");
const security_master_1 = require("../v82/security-master");
const toIso = (s) => s.includes('T') ? s : `${s.replace(' ', 'T')}Z`;
const ts = (s) => Date.parse(toIso(s));
function parseTwelveBars(raw) {
    const rows = Array.isArray(raw?.values) ? raw.values : [];
    return rows.map((x) => ({ datetime: String(x.datetime || ''), open: Number(x.open), high: Number(x.high), low: Number(x.low), close: Number(x.close), volume: Number(x.volume || 0) })).filter((x) => x.datetime && [x.open, x.high, x.low, x.close].every(Number.isFinite)).sort((a, b) => ts(a.datetime) - ts(b.datetime));
}
function resampleSequential(rows, chunk, includePartial = false) {
    if (chunk <= 1)
        return rows.slice();
    const out = [];
    for (let i = 0; i < rows.length; i += chunk) {
        const g = rows.slice(i, i + chunk);
        if (g.length < chunk && !includePartial)
            break;
        if (!g.length)
            continue;
        out.push({ datetime: g[0].datetime, open: g[0].open, high: Math.max(...g.map(x => x.high)), low: Math.min(...g.map(x => x.low)), close: g.at(-1).close, volume: g.reduce((a, b) => a + b.volume, 0) });
    }
    return out;
}
function parseDateOnly(s) { const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
function mondayKey(s) { const d = parseDateOnly(s); if (!d)
    return s.slice(0, 10); const w = d.getUTCDay(), delta = w === 0 ? -6 : 1 - w; d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); }
function aggregateWeeks(rows) {
    const groups = new Map();
    for (const r of rows) {
        const k = mondayKey(r.datetime);
        const g = groups.get(k) || [];
        g.push(r);
        groups.set(k, g);
    }
    return [...groups.values()].map(g => ({ datetime: g.at(-1).datetime.slice(0, 10), open: g[0].open, high: Math.max(...g.map(x => x.high)), low: Math.min(...g.map(x => x.low)), close: g.at(-1).close, volume: g.reduce((a, b) => a + b.volume, 0) }));
}
function hasFutureTradingDayInWeek(lastDate) { const d = parseDateOnly(lastDate); if (!d)
    return false; const day = d.getUTCDay(); for (let add = 1; add <= Math.max(0, 5 - day); add++) {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + add);
    const noon = new Date(`${x.toISOString().slice(0, 10)}T16:00:00.000Z`);
    if ((0, nivora_market_session_1.marketCalendarAt)(noon).isTradingDay)
        return true;
} return false; }
function aggregateCompletedWeeks(rows, asOf) {
    if (!rows.length)
        return [];
    const weeks = aggregateWeeks(rows);
    if (!weeks.length)
        return weeks;
    const currentLast = weeks.at(-1);
    const completedDate = (0, nivora_market_session_1.lastCompletedRegularSessionDate)(asOf);
    if (!completedDate || currentLast.datetime > completedDate || hasFutureTradingDayInWeek(currentLast.datetime))
        weeks.pop();
    return weeks;
}
function completedIntraday(rows, minutes, asOf) { return rows.filter(r => { const t = ts(r.datetime); return Number.isFinite(t) && t + minutes * 60000 <= asOf.getTime(); }); }
function nyParts(at) { const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(at); const g = (k) => parts.find(x => x.type === k)?.value || ''; return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: +g('hour'), minute: +g('minute') }; }
function dailyPreviewFrom15m(confirmedDaily, raw15, asOf) {
    const cal = (0, nivora_market_session_1.marketCalendarAt)(asOf);
    if (!cal.isTradingDay)
        return null;
    const target = cal.date;
    const todays = raw15.filter(r => { const d = new Date(toIso(r.datetime)); if (!Number.isFinite(d.getTime()))
        return false; const p = nyParts(d), mins = p.hour * 60 + p.minute; return p.date === target && mins >= 9 * 60 + 30 && mins < cal.regularCloseMinutes; });
    if (!todays.length)
        return null;
    const bar = { datetime: target, open: todays[0].open, high: Math.max(...todays.map(x => x.high)), low: Math.min(...todays.map(x => x.low)), close: todays.at(-1).close, volume: todays.reduce((a, b) => a + b.volume, 0) };
    const base = confirmedDaily.filter(x => x.datetime.slice(0, 10) !== target);
    return base.concat(bar);
}
function url(symbol, key, interval, size, prepost = false) { const hint = (0, security_master_1.providerMarketHint)(symbol); return `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${size}&timezone=UTC${prepost ? '&prepost=true' : ''}${hint.exchange ? `&exchange=${encodeURIComponent(hint.exchange)}` : ''}&apikey=${key}`; }
async function loadV934DecisionBars(input) {
    const symbol = String(input.symbol).toUpperCase();
    const fourHourPromise = input.fetchJson(url(symbol, input.key, '4h', 240, false), ['twelve', 'v9341', symbol, '4h'], 180, 2600);
    const dailyPromise = input.fetchJson(url(symbol, input.key, '1day', 340, false), ['twelve', 'v9341', symbol, '1day'], 60, 3000);
    const [fourHour, daily] = await Promise.allSettled([fourHourPromise, dailyPromise]);
    let rawDaily = daily.status === 'fulfilled' ? daily.value : null;
    let dailyError = daily.status === 'rejected' ? String(daily.reason) : null;
    if (!rawDaily && dailyError) {
        try {
            rawDaily = await input.fetchJson(url(symbol, input.key, '1day', 260, false), ['twelve', 'v9341', symbol, '1day', 'retry'], 60, 2200);
            dailyError = null;
        }
        catch (error) {
            dailyError = `${dailyError}; retry: ${String(error)}`;
        }
    }
    const raw4h = fourHour.status === 'fulfilled' ? fourHour.value : null;
    const all4h = parseTwelveBars(raw4h), allDaily = parseTwelveBars(rawDaily), calendar = (0, nivora_market_session_1.marketCalendarAt)(input.asOf);
    const h4 = completedIntraday(all4h, 240, input.asOf), day = (0, completed_bars_1.completedDailyBars)(allDaily, calendar), week = aggregateCompletedWeeks(day, input.asOf);
    const confirmed = { '4H': h4, '1D': day, '1W': week };
    return { confirmed, preview: {}, rawDaily, coverage: { '15M': 0, '1H': 0, '4H': h4.length, '1D': day.length, '1W': week.length }, errors: { '15M': null, '4H': fourHour.status === 'rejected' ? String(fourHour.reason) : null, '1D': dailyError } };
}
async function loadV934LiveContext(input) {
    const symbol = String(input.symbol).toUpperCase();
    const raw = await input.fetchJson(url(symbol, input.key, '15min', 840, true), ['twelve', 'v9341', symbol, '15min', 'live'], 20, 5000);
    const all15 = parseTwelveBars(raw), d15 = completedIntraday(all15, 15, input.asOf), h1 = resampleSequential(d15, 4, false);
    const preview = { '15M': all15, '1H': resampleSequential(all15, 4, true), '4H': resampleSequential(all15, 16, true) };
    return { confirmed: { '15M': d15, '1H': h1 }, preview, coverage: { '15M': d15.length, '1H': h1.length }, raw15: raw };
}
async function loadV934MarketBars(input) {
    const symbol = String(input.symbol).toUpperCase();
    const reqs = [
        input.fetchJson(url(symbol, input.key, '15min', 1200, true), ['twelve', 'v934', symbol, '15min'], 30, 3500),
        input.fetchJson(url(symbol, input.key, '4h', 360, false), ['twelve', 'v934', symbol, '4h'], 180, 3500),
        input.fetchJson(url(symbol, input.key, '1day', 620, false), ['twelve', 'v934', symbol, '1day'], 45, 3500)
    ];
    const [a, b, c] = await Promise.allSettled(reqs);
    const raw15 = a.status === 'fulfilled' ? a.value : null, raw4h = b.status === 'fulfilled' ? b.value : null, rawDaily = c.status === 'fulfilled' ? c.value : null;
    const all15 = parseTwelveBars(raw15), all4h = parseTwelveBars(raw4h), allDaily = parseTwelveBars(rawDaily), calendar = (0, nivora_market_session_1.marketCalendarAt)(input.asOf);
    const d15 = completedIntraday(all15, 15, input.asOf), h1 = resampleSequential(d15, 4, false), h4 = completedIntraday(all4h, 240, input.asOf), day = (0, completed_bars_1.completedDailyBars)(allDaily, calendar), week = aggregateCompletedWeeks(day, input.asOf);
    const dailyPreview = dailyPreviewFrom15m(day, all15, input.asOf);
    const weekPreview = dailyPreview ? aggregateWeeks(dailyPreview) : null;
    const confirmed = { '15M': d15, '1H': h1, '4H': h4, '1D': day, '1W': week };
    const preview = {};
    if (all15.length)
        preview['15M'] = all15;
    if (all15.length)
        preview['1H'] = resampleSequential(all15, 4, true);
    if (all15.length)
        preview['4H'] = resampleSequential(all15, 16, true);
    if (dailyPreview)
        preview['1D'] = dailyPreview;
    if (weekPreview?.length)
        preview['1W'] = weekPreview;
    return { confirmed, preview, rawDaily, coverage: { '15M': d15.length, '1H': h1.length, '4H': h4.length, '1D': day.length, '1W': week.length }, errors: { '15M': a.status === 'rejected' ? String(a.reason) : null, '4H': b.status === 'rejected' ? String(b.reason) : null, '1D': c.status === 'rejected' ? String(c.reason) : null } };
}
