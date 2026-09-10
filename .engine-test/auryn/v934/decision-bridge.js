"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveV934DecisionTechnical = deriveV934DecisionTechnical;
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 50)));
const ratingLabel = (tf, s) => s ? `${tf} ${s.rating} (${s.counts.buy} buy / ${s.counts.neutral} neutral / ${s.counts.sell} sell)` : `${tf} unavailable`;
function weighted(snapshot, selector) {
    const specs = [['1D', .4], ['1W', .25], ['4H', .25], ['1H', .1]];
    let total = 0, denom = 0;
    for (const [tf, w] of specs) {
        const s = snapshot?.confirmed?.[tf];
        if (!s)
            continue;
        const n = Number(selector(s));
        if (!Number.isFinite(n))
            continue;
        total += n * w;
        denom += w;
    }
    return denom ? clamp(total / denom) : 50;
}
function deriveV934DecisionTechnical(snapshot) {
    const daily = snapshot?.confirmed?.['1D'];
    const four = snapshot?.confirmed?.['4H'];
    const weekly = snapshot?.confirmed?.['1W'];
    const live = snapshot?.livePreview?.['1D'];
    const map = snapshot?.actionMap;
    const confirmedPrice = Number(daily?.price);
    const confirm = Number(map?.confirm), invalidation = Number(map?.invalidation);
    const trend = weighted(snapshot, s => s.trend.score);
    const momentum = weighted(snapshot, s => s.momentum.score);
    const flow = weighted(snapshot, s => s.participation.score);
    const structure = weighted(snapshot, s => (clamp((s.score + 100) / 2) + clamp(s.relativeStrength?.score ?? 50)) / 2);
    const marketStructureScore = clamp((trend * .32) + (momentum * .23) + (flow * .2) + (structure * .25));
    const nearResistance = Number.isFinite(confirmedPrice) && Number.isFinite(confirm) && confirmedPrice >= confirm * .94 && confirmedPrice <= confirm * 1.02;
    const confirmedBreakout = Boolean(daily && Number.isFinite(confirmedPrice) && Number.isFinite(confirm) && confirmedPrice >= confirm && daily.rating === 'BUY' && daily.participation.score >= 60);
    const structuralBreak = Number.isFinite(confirmedPrice) && Number.isFinite(invalidation) && confirmedPrice < invalidation;
    const why = [daily ? ratingLabel('1D', daily) : null, four ? ratingLabel('4H', four) : null, weekly ? ratingLabel('1W', weekly) : null].filter(Boolean).join(' · ');
    return {
        marketStructureScore, trend, momentum, flow, structure, nearResistance, confirmedBreakout, structuralBreak,
        reclaimLevel: Number.isFinite(confirm) ? confirm : null, invalidation: Number.isFinite(invalidation) ? invalidation : null,
        confirmedPrice: Number.isFinite(confirmedPrice) ? confirmedPrice : null,
        confirmedDailyRating: daily?.rating ?? null, livePreviewRating: live?.rating ?? null,
        why: why ? `${why}. Confirmed completed bars drive the decision; live preview ${live?.rating ?? 'unavailable'} cannot silently rewrite it.` : 'Multi-timeframe confirmed structure is unavailable.'
    };
}
