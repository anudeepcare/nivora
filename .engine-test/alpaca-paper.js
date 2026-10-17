"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaPaperBroker = void 0;
const nivora_broker_1 = require("./nivora-broker");
class AlpacaPaperBroker {
    key;
    secret;
    constructor(key, secret) {
        this.key = key;
        this.secret = secret;
        if (!this.key || !this.secret)
            throw new Error("Alpaca Paper credentials are not configured.");
    }
    async request(path, init = {}) {
        const auth = (0, nivora_broker_1.authorizeBrokerExecution)({ mode: "paper", autoSubmit: true });
        if (!auth.mayTransmit)
            throw new Error(auth.reason);
        const r = await fetch(`${nivora_broker_1.ALPACA_PAPER_BASE_URL}${path}`, { ...init, cache: "no-store", signal: init.signal ?? AbortSignal.timeout(8000), headers: { "APCA-API-KEY-ID": this.key, "APCA-API-SECRET-KEY": this.secret, "Content-Type": "application/json", ...(init.headers || {}) } });
        const body = await r.json().catch(() => null);
        if (!r.ok)
            throw Object.assign(new Error(body?.message || `Alpaca Paper ${r.status}`), { status: r.status });
        return body;
    }
    async getAccount() { const a = await this.request("/v2/account"); const equity = Number(a.equity || 0), last = Number(a.last_equity || 0); return { tradingBlocked: Boolean(a.trading_blocked || a.account_blocked || a.trade_suspended_by_user), status: String(a.status || ""), equity, cash: Number(a.cash || 0), buyingPower: Number(a.buying_power || 0), lastEquity: last, dailyPnlPct: last > 0 ? +(((equity / last) - 1) * 100).toFixed(3) : 0 }; }
    async getPositions() { const rows = await this.request("/v2/positions"); return (rows || []).map((p) => ({ symbol: String(p.symbol).toUpperCase(), qty: Number(p.qty || 0), marketValue: Number(p.market_value || 0), avgEntryPrice: Number(p.avg_entry_price || 0), availableQty: p.qty_available == null ? undefined : Number(p.qty_available) })); }
    async getFillActivities(after) {
        const collected = [];
        let token = '';
        const seen = new Set();
        for (let page = 0; page < 10; page++) {
            const q = `?direction=asc&page_size=100${after ? `&after=${encodeURIComponent(after)}` : ''}${token ? `&page_token=${encodeURIComponent(token)}` : ''}`;
            const rows = await this.request(`/v2/account/activities/FILL${q}`);
            if (!Array.isArray(rows))
                throw Error('Fill reconciliation payload unavailable');
            for (const row of rows) {
                if (!row.id || seen.has(String(row.id)))
                    throw Error('Fill pagination did not advance');
                seen.add(String(row.id));
                collected.push(row);
            }
            if (rows.length < 100)
                return collected.map((x) => ({ id: String(x.id), orderId: String(x.order_id || ""), symbol: String(x.symbol || "").toUpperCase(), side: String(x.side || "").toUpperCase() === "SELL" ? "SELL" : "BUY", qty: Number(x.qty || 0), price: Number(x.price || 0), transactionTime: String(x.transaction_time || x.date || new Date(0).toISOString()) }));
            token = String(rows[rows.length - 1].id);
        }
        throw Error('Fill reconciliation backlog exceeds bounded pagination');
    }
    async getLatestExecutionQuote(symbol) {
        const headers = { "APCA-API-KEY-ID": this.key, "APCA-API-SECRET-KEY": this.secret };
        const [qr, tr] = await Promise.all([
            fetch(`https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/quotes/latest?feed=iex`, { cache: "no-store", headers, signal: AbortSignal.timeout(2500) }),
            fetch(`https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=iex`, { cache: "no-store", headers, signal: AbortSignal.timeout(2500) })
        ]);
        const q = await qr.json().catch(() => null), t = await tr.json().catch(() => null);
        if (!qr.ok || !tr.ok)
            throw new Error(q?.message || t?.message || `Alpaca market data ${qr.status}/${tr.status}`);
        return { quote: q, trade: t };
    }
    async getRecentBars(symbol, limit = 40, timeoutMs = 4500) {
        const headers = { "APCA-API-KEY-ID": this.key, "APCA-API-SECRET-KEY": this.secret };
        const u = `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/bars?timeframe=1Day&limit=${Math.max(5, Math.min(200, limit))}&adjustment=all&feed=iex`;
        const r = await fetch(u, { cache: "no-store", headers, signal: AbortSignal.timeout(timeoutMs) });
        const body = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(body?.bars))
            throw new Error(body?.message || `Alpaca bars ${r.status}`);
        return body.bars.map((b) => ({ datetime: String(b.t || "").slice(0, 10), open: Number(b.o), high: Number(b.h), low: Number(b.l), close: Number(b.c), volume: Number(b.v || 0) }));
    }
    async getOpenOrders() {
        const rows = await this.request('/v2/orders?status=open&limit=500&direction=asc');
        if (!Array.isArray(rows) || rows.length >= 500)
            throw Error('Pending order backlog unavailable');
        return rows.map((o) => ({ id: String(o.id), clientOrderId: String(o.client_order_id || ''), symbol: String(o.symbol || ''), side: String(o.side || ''), status: String(o.status || ''), qty: Number(o.qty), filledQty: Number(o.filled_qty || 0), filledAvgPrice: o.filled_avg_price == null ? null : Number(o.filled_avg_price), submittedAt: o.submitted_at || null, limitPrice: o.limit_price == null ? null : Number(o.limit_price) }));
    }
    async getAsset(symbol) { const a = await this.request(`/v2/assets/${encodeURIComponent(symbol)}`); return { tradable: a.tradable === true, status: String(a.status || ''), fractionable: a.fractionable === true }; }
    async getAccountConfiguration() { return this.request("/v2/account/configurations"); }
    async getClock() { const c = await this.request("/v2/clock"); return { timestamp: c?.timestamp || null, isOpen: Boolean(c?.is_open), nextOpen: c?.next_open || null, nextClose: c?.next_close || null }; }
    async getOrder(orderId, signal) { const o = await this.request(`/v2/orders/${encodeURIComponent(orderId)}`, { signal }); return { id: String(o.id), clientOrderId: String(o.client_order_id || ""), symbol: String(o.symbol || ""), side: String(o.side || ""), status: String(o.status || ""), qty: Number(o.qty || 0), filledQty: Number(o.filled_qty || 0), filledAvgPrice: o.filled_avg_price == null ? null : Number(o.filled_avg_price), submittedAt: o.submitted_at || null }; }
    async getOrderByClientOrderId(clientOrderId, signal) {
        try {
            const o = await this.request(`/v2/orders:by_client_order_id?client_order_id=${encodeURIComponent(clientOrderId)}`, { signal });
            return { id: String(o.id), clientOrderId: String(o.client_order_id || ""), symbol: String(o.symbol || ""), side: String(o.side || ""), status: String(o.status || ""), qty: Number(o.qty || 0), filledQty: Number(o.filled_qty || 0), filledAvgPrice: o.filled_avg_price == null ? null : Number(o.filled_avg_price), submittedAt: o.submitted_at || null };
        }
        catch (error) {
            if (error?.status === 404)
                return null;
            throw error;
        }
    }
    async cancelOrder(orderId) { await this.request(`/v2/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" }); }
    async submitOrder(order) { const o = await this.request("/v2/orders", { method: "POST", body: JSON.stringify({ symbol: order.symbol, qty: String(order.quantity), side: order.side.toLowerCase(), type: "limit", time_in_force: "day", limit_price: String(order.limitPrice), client_order_id: order.clientOrderId }) }); return { id: String(o.id), clientOrderId: String(o.client_order_id || order.clientOrderId), symbol: String(o.symbol), side: String(o.side), status: String(o.status), qty: Number(o.qty || order.quantity), filledQty: Number(o.filled_qty || 0), filledAvgPrice: o.filled_avg_price == null ? null : Number(o.filled_avg_price), submittedAt: o.submitted_at || null }; }
}
exports.AlpacaPaperBroker = AlpacaPaperBroker;
