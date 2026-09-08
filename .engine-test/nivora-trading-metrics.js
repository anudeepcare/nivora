"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRADING_METRICS_VERSION = void 0;
exports.summarizeTradingPerformance = summarizeTradingPerformance;
exports.buildClosedTradesFromFills = buildClosedTradesFromFills;
exports.TRADING_METRICS_VERSION = "v61-trade-metrics-1";
function summarizeTradingPerformance(rows) {
    const trades = rows.length, wins = rows.filter(x => x.pnl > 0).length, losses = rows.filter(x => x.pnl < 0).length, grossProfit = rows.filter(x => x.pnl > 0).reduce((s, x) => s + x.pnl, 0), grossLoss = Math.abs(rows.filter(x => x.pnl < 0).reduce((s, x) => s + x.pnl, 0));
    const net = rows.reduce((s, x) => s + x.pnl, 0), expectancy = trades ? net / trades : 0, winRate = trades ? wins / trades * 100 : 0, profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const alpha = trades ? rows.reduce((s, x) => s + (x.returnPct - (x.benchmarkReturnPct ?? 0)), 0) / trades : 0;
    let equity = 0, peak = 0, maxDrawdown = 0;
    for (const x of rows) {
        equity += x.pnl;
        peak = Math.max(peak, equity);
        maxDrawdown = Math.min(maxDrawdown, equity - peak);
    }
    return { trades, wins, losses, winRatePct: +winRate.toFixed(1), netPnl: +net.toFixed(2), grossProfit: +grossProfit.toFixed(2), grossLoss: +grossLoss.toFixed(2), profitFactor: Number.isFinite(profitFactor) ? +profitFactor.toFixed(2) : null, expectancy: +expectancy.toFixed(2), averageAlphaPct: +alpha.toFixed(2), maxDrawdownDollars: +maxDrawdown.toFixed(2), version: exports.TRADING_METRICS_VERSION };
}
function buildClosedTradesFromFills(fills) {
    const state = new Map(), closed = [];
    for (const f of fills) {
        const symbol = f.symbol.toUpperCase(), qty = Math.max(0, Number(f.qty || 0)), price = Math.max(0, Number(f.price || 0)), fees = Math.max(0, Number(f.fees || 0));
        if (!qty || !price)
            continue;
        const st = state.get(symbol) || { qty: 0, cost: 0, fees: 0 };
        if (f.side === "BUY") {
            st.cost += qty * price;
            st.qty += qty;
            st.fees += fees;
            state.set(symbol, st);
            continue;
        }
        const closeQty = Math.min(qty, st.qty);
        if (closeQty <= 0)
            continue;
        const avg = st.qty > 0 ? st.cost / st.qty : 0, allocatedBuyFees = st.qty > 0 ? st.fees * (closeQty / st.qty) : 0, allocatedSellFees = fees * (closeQty / qty), pnl = (price - avg) * closeQty - allocatedBuyFees - allocatedSellFees, ret = avg > 0 ? ((price / avg) - 1) * 100 : 0;
        closed.push({ sourceFillId: f.id, symbol, qty: +closeQty.toFixed(6), entryPrice: +avg.toFixed(4), exitPrice: +price.toFixed(4), pnl: +pnl.toFixed(2), returnPct: +ret.toFixed(2), benchmarkReturnPct: null });
        const remain = st.qty - closeQty, ratio = st.qty > 0 ? remain / st.qty : 0;
        st.qty = remain;
        st.cost *= ratio;
        st.fees *= ratio;
        state.set(symbol, st);
    }
    return closed;
}
