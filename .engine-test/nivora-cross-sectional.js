"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativeRank = relativeRank;
const finite = (x) => x !== null && x !== undefined && x !== "" && typeof x !== "boolean" && Number.isFinite(Number(x));
const pct = (xs, x) => xs.length < 5 ? null : Math.round(xs.filter(v => v <= x).length / xs.length * 100);
function relativeRank(rows, subject) {
    const universe = rows.filter(r => finite(r.thesisScore)).map(r => Number(r.thesisScore));
    const peerRows = rows.filter(r => finite(r.thesisScore) && ((subject.sector && r.sector === subject.sector) || (subject.archetype && r.archetype === subject.archetype)));
    const peers = peerRows.map(r => Number(r.thesisScore));
    const mean = universe.length ? universe.reduce((a, b) => a + b, 0) / universe.length : NaN;
    const sd = universe.length ? Math.sqrt(universe.reduce((a, b) => a + (b - mean) ** 2, 0) / universe.length) : NaN;
    const z = finite(sd) && sd > 0 ? (subject.thesisScore - mean) / sd : null;
    return { universePercentile: pct(universe, subject.thesisScore), peerPercentile: pct(peers, subject.thesisScore), zScore: z == null ? null : +z.toFixed(2), peerN: peers.length, universeN: universe.length, note: "Relative rank is context, not an automatic Buy/Sell rule. Absolute thesis, valuation, timing and risk gates still control the decision." };
}
