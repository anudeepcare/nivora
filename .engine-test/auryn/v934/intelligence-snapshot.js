"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAurynMarketIntelligenceSnapshot = buildAurynMarketIntelligenceSnapshot;
const decision_snapshot_1 = require("../v931/decision-snapshot");
const timeframes_1 = require("./timeframes");
const zones_1 = require("./zones");
const version_1 = require("./version");
const ORDER = ['15M', '1H', '4H', '1D', '1W'];
function alignment(states) {
    if (!states.length)
        return 'INSUFFICIENT';
    const buy = states.filter(x => x.rating === 'BUY').length, sell = states.filter(x => x.rating === 'SELL').length;
    if (buy === states.length)
        return 'BULLISH_ALIGNED';
    if (sell === states.length)
        return 'BEARISH_ALIGNED';
    if (buy >= Math.ceil(states.length * .6))
        return 'BULLISH_BIAS';
    if (sell >= Math.ceil(states.length * .6))
        return 'BEARISH_BIAS';
    return 'MIXED';
}
function buildAurynMarketIntelligenceSnapshot(input) {
    const symbol = String(input.symbol || '').toUpperCase(), benchmark = input.benchmark ?? (symbol.includes('/') ? 'BTC/USD' : 'SPY');
    const confirmed = {}, livePreview = {};
    for (const tf of ORDER) {
        const bars = input.confirmedBars[tf];
        if (bars?.length) {
            const s = (0, timeframes_1.computeTimeframeTechnicalState)(bars, input.benchmarkBars?.[tf] ?? null, tf, benchmark);
            if (s)
                confirmed[tf] = s;
        }
        const preview = input.previewBars?.[tf];
        if (preview?.length) {
            const p = (0, timeframes_1.computeTimeframeTechnicalState)(preview, input.benchmarkBars?.[tf] ?? null, tf, benchmark);
            if (p)
                livePreview[tf] = p;
        }
    }
    const actionMap = input.confirmedBars['1D']?.length ? (0, zones_1.buildStructuralPriceMap)(input.confirmedBars['1D'], input.confirmedBars['1W'] ?? []) : null;
    const primaryTimeframe = confirmed['1D'] ? '1D' : confirmed['4H'] ? '4H' : confirmed['1W'] ? '1W' : confirmed['1H'] ? '1H' : '15M';
    const primary = confirmed[primaryTimeframe];
    const live = livePreview[primaryTimeframe];
    const confList = ORDER.map(tf => confirmed[tf]).filter(Boolean);
    const coverage = { requested: ORDER, confirmed: ORDER.filter(tf => Boolean(confirmed[tf])), preview: ORDER.filter(tf => Boolean(livePreview[tf])), missing: ORDER.filter(tf => !confirmed[tf]) };
    const canonical = { version: version_1.V934_INTELLIGENCE_VERSION, symbol, asOf: input.marketTruth.asOf, marketTruthSnapshotId: input.marketTruth.snapshotId, session: input.marketTruth.session, calendarState: input.marketTruth.calendarState, displayPrice: input.marketTruth.displayPrice, decisionPrice: input.marketTruth.decisionPrice, priceState: input.marketTruth.priceState, priceUse: input.marketTruth.priceUse, confirmed, livePreview, actionMap, summary: { primaryTimeframe, confirmedRating: primary?.rating ?? 'NEUTRAL', liveRating: live?.rating ?? null, alignment: alignment(confList), researchActive: Boolean(input.marketTruth.displayPrice != null || input.marketTruth.decisionPrice != null) }, coverage };
    const fingerprint = (0, decision_snapshot_1.stableFingerprint)(canonical);
    return { ...canonical, fingerprint, snapshotId: `${symbol}-mi-${fingerprint}` };
}
