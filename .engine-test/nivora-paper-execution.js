"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAPER_EXECUTION_VERSION = void 0;
exports.planPaperOrder = planPaperOrder;
exports.simulatePaperFill = simulatePaperFill;
exports.PAPER_EXECUTION_VERSION = "v61-paper-execution-1";
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
} return (h >>> 0).toString(36); };
function planPaperOrder(intent, approvedNotional, price, limitBufferPct = .25) {
    const safePrice = Math.max(.01, Number(price));
    const qty = Math.floor(Math.max(0, approvedNotional) / safePrice * 1000) / 1000;
    const buffer = Math.max(0, Math.min(2, limitBufferPct)) / 100;
    const limit = intent.side === "BUY" ? safePrice * (1 + buffer) : safePrice * (1 - buffer);
    return { clientOrderId: `niv_${hash(`${intent.id}|${intent.symbol}|${intent.side}`)}`, symbol: intent.symbol, side: intent.side, quantity: qty, type: "limit", timeInForce: "day", limitPrice: +limit.toFixed(2), referencePrice: safePrice, notional: +(qty * safePrice).toFixed(2), version: exports.PAPER_EXECUTION_VERSION };
}
function simulatePaperFill(order, marketPrice, slippagePct = .08, feePerShare = 0) {
    const slip = Math.max(0, slippagePct) / 100, raw = order.side === "BUY" ? marketPrice * (1 + slip) : marketPrice * (1 - slip);
    const fill = order.side === "BUY" ? Math.min(raw, order.limitPrice) : Math.max(raw, order.limitPrice);
    const fees = Math.max(0, order.quantity * Math.max(0, feePerShare));
    return { fillPrice: +fill.toFixed(4), quantity: order.quantity, fees: +fees.toFixed(4), grossNotional: +(fill * order.quantity).toFixed(2) };
}
