"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateWeeklyBars = aggregateWeeklyBars;
exports.buildMultiTimeframeTechnical = buildMultiTimeframeTechnical;
const nivora_technical_engine_1 = require("../../nivora-technical-engine");
function mondayKey(datetime) {
    const d = new Date(`${String(datetime).slice(0, 10)}T00:00:00Z`);
    const day = d.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
}
function aggregateWeeklyBars(rows) {
    const sorted = [...(rows || [])].filter(r => Number.isFinite(r.open) && Number.isFinite(r.high) && Number.isFinite(r.low) && Number.isFinite(r.close)).sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
    const groups = new Map();
    for (const r of sorted) {
        const k = mondayKey(r.datetime);
        const xs = groups.get(k) || [];
        xs.push(r);
        groups.set(k, xs);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, xs]) => ({
        datetime: week,
        open: xs[0].open,
        high: Math.max(...xs.map(x => x.high)),
        low: Math.min(...xs.map(x => x.low)),
        close: xs.at(-1).close,
        volume: xs.reduce((s, x) => s + (Number(x.volume) || 0), 0),
    }));
}
const read = (t) => t ? ({ strength: t.technicalState.strength, entryQuality: t.technicalState.entryQuality, trend: t.technicalState.trend, momentum: t.technicalState.momentum, participation: t.technicalState.participation, structure: t.technicalState.structure, state: t.technicalState.state, entryState: t.technicalState.entryState, price: t.price }) : null;
const bull = (x) => Boolean(x && x.strength >= 64 && x.trend >= 55);
const bear = (x) => Boolean(x && x.strength <= 42 && x.trend <= 45);
function buildMultiTimeframeTechnical(rows, dailySnapshot) {
    const weeklyBars = aggregateWeeklyBars(rows);
    const weeklySnapshot = weeklyBars.length >= 40 ? (0, nivora_technical_engine_1.computeTechnicalSnapshot)(weeklyBars, null, null) : null;
    const daily = read(dailySnapshot), weekly = read(weeklySnapshot);
    if (!daily || !weekly)
        return { daily, weekly, alignment: 'INSUFFICIENT', summary: 'Multi-timeframe confirmation is still collecting enough verified history.', weeklyBars: weeklyBars.length };
    let alignment = 'MIXED';
    if (bull(daily) && bull(weekly))
        alignment = 'ALIGNED_BULLISH';
    else if (bear(daily) && bear(weekly))
        alignment = 'ALIGNED_BEARISH';
    else if ((daily.strength < 50 || daily.trend < 45) && bull(weekly))
        alignment = 'DAILY_WEAK_WEEKLY_STRONG';
    else if (bull(daily) && (weekly.strength < 50 || weekly.trend < 45))
        alignment = 'DAILY_STRONG_WEEKLY_WEAK';
    const summary = alignment === 'ALIGNED_BULLISH' ? 'Daily setup and weekly structure are aligned bullish.' : alignment === 'ALIGNED_BEARISH' ? 'Daily and weekly structures are both weak; trend risk is reinforced.' : alignment === 'DAILY_WEAK_WEEKLY_STRONG' ? 'Daily timing is weak/corrective while weekly structure remains stronger; treat weakness as timing risk unless the weekly thesis breaks.' : alignment === 'DAILY_STRONG_WEEKLY_WEAK' ? 'Daily momentum is strong against a weaker weekly structure; confirmation quality is lower and chase risk is higher.' : 'Daily and weekly evidence are mixed; sizing should respect the timeframe conflict.';
    return { daily, weekly, alignment, summary, weeklyBars: weeklyBars.length };
}
