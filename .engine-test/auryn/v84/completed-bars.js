"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completedDailyBars = completedDailyBars;
function completedDailyBars(rows, calendar) {
    if (!Array.isArray(rows) || rows.length === 0)
        return [];
    const lastDay = String(rows.at(-1)?.datetime || '').slice(0, 10);
    const partialPossible = calendar.session === 'PRE_MARKET' || calendar.session === 'REGULAR';
    return partialPossible && lastDay === calendar.date ? rows.slice(0, -1) : rows.slice();
}
