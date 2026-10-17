"use client";
import { useMemo, useState } from "react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { amount, dateLabel } from "@/lib/format";
import { Notice, Empty, SecurityLogo } from "./Ui";
type Plan = {
  id: string;
  enabled: boolean;
  body: {
    symbol: string;
    side: string;
    quantity: number;
    limitPrice: number;
    maxPositionPct: number;
    minimumCash: number;
  };
};
type Run = {
  id: string;
  client_order_id: string;
  status: string;
  detail: string;
  filled_qty: number;
  filled_avg_price: number | null;
  created_at: string;
};
export default function Trading() {
  const { demo } = useProduct(),
    preview = useMemo(
      () =>
        demo
          ? {
              plans: [],
              runs: [],
              executionEnabled: false,
              scheduleEnabled: false,
            }
          : undefined,
      [demo],
    ),
    resource = useResource<{
      plans: Plan[];
      runs: Run[];
      executionEnabled: boolean;
      scheduleEnabled: boolean;
    }>("paper-plans", preview),
    statusPreview = useMemo(
      () =>
        demo
          ? { equity: 100000, buyingPower: 100000, positions: [] }
          : undefined,
      [demo],
    ),
    status = useResource<{
      equity: number;
      buyingPower: number;
      positions: {
        symbol: string;
        quantity: number;
        marketValue: number;
        pnl: number;
      }[];
    }>("paper-status", statusPreview);
  const [form, setForm] = useState({
      symbol: "",
      side: "buy",
      quantity: "1",
      limitPrice: "",
      maxPositionPct: "10",
      minimumCash: "1000",
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      if (demo) throw Error("The preview never places orders.");
      const r = await api<{
        message?: string;
        detail?: string;
        status?: string;
      }>("paper-plans", body);
      setMessage(r.message || r.detail || r.status || "Saved.");
      resource.refresh();
      status.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Paper action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article>
      <header className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATOR WORKSPACE</span>
          <h1>Paper trading</h1>
          <p>Explicit plans. Bounded exposure. Every order accounted for.</p>
        </div>
        <span className="tag">Paper account only</span>
      </header>
      {status.data && (
        <div className="two-col">
          <div className="panel">
            <span className="metric-label">Paper equity</span>
            <strong className="metric-value">
              {amount(status.data.equity, "USD")}
            </strong>
          </div>
          <div className="panel">
            <span className="metric-label">Broker buying power</span>
            <strong className="metric-value">
              {amount(status.data.buyingPower, "USD")}
            </strong>
            <small>Plans are checked against cash, without borrowing.</small>
          </div>
        </div>
      )}
      {status.error && <Notice>{status.error}</Notice>}
      {resource.error && <Notice>{resource.error}</Notice>}
      {resource.data && (
        <>
          <div className="support section-heading">
            <div>
              <h2>Monthly plans</h2>
              <p>
                {resource.data.executionEnabled
                  ? "Execution configured"
                  : "Execution disabled"}{" "}
                ·{" "}
                {resource.data.scheduleEnabled
                  ? "Scheduled checks configured"
                  : "Manual checks only"}
              </p>
            </div>
            <button
              className="button"
              disabled={busy || demo !== undefined}
              onClick={() => action({ op: "pause-all" })}
            >
              Pause all plans
            </button>
          </div>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              action({ op: "save", body: form });
            }}
          >
            <div className="form-grid">
              <label>
                Ticker
                <input
                  required
                  value={form.symbol}
                  maxLength={10}
                  onChange={(e) =>
                    setForm({ ...form, symbol: e.target.value.toUpperCase() })
                  }
                />
              </label>
              <label>
                Action
                <select
                  value={form.side}
                  onChange={(e) => setForm({ ...form, side: e.target.value })}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell held shares</option>
                </select>
              </label>
              <label>
                Whole shares
                <input
                  required
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </label>
              <label>
                Limit price · USD
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.limitPrice}
                  onChange={(e) =>
                    setForm({ ...form, limitPrice: e.target.value })
                  }
                />
              </label>
              <label>
                Maximum position · %
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.maxPositionPct}
                  onChange={(e) =>
                    setForm({ ...form, maxPositionPct: e.target.value })
                  }
                />
              </label>
              <label>
                Cash to preserve · USD
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minimumCash}
                  onChange={(e) =>
                    setForm({ ...form, minimumCash: e.target.value })
                  }
                />
              </label>
            </div>
            <button className="button primary" disabled={busy}>
              Save paused plan
            </button>
            <p className="footnote">
              A plan is an exact order instruction, not an AI recommendation.
              Arming permits one order per calendar month. Regular hours, fresh
              quotes, cash, position caps and open-order checks must all pass.
            </p>
          </form>
          <div className="compact-records">
            {resource.data.plans.map((p) => (
              <div key={p.id}>
                <SecurityLogo symbol={p.body.symbol} size={32} />
                <div>
                  <strong>
                    {p.body.side.toUpperCase()} {p.body.quantity}{" "}
                    {p.body.symbol} · limit {amount(p.body.limitPrice, "USD")}
                  </strong>
                  <small>
                    {p.enabled ? "Armed" : "Paused"} · cap{" "}
                    {p.body.maxPositionPct}% · cash reserve{" "}
                    {amount(p.body.minimumCash, "USD")}
                  </small>
                </div>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    action({ op: "toggle", id: p.id, enabled: !p.enabled })
                  }
                >
                  {p.enabled ? "Pause" : "Arm plan"}
                </button>
                <button
                  className="button"
                  disabled={
                    busy || !p.enabled || !resource.data?.executionEnabled
                  }
                  onClick={() => action({ op: "run", id: p.id })}
                >
                  Check & run
                </button>
              </div>
            ))}
          </div>
          {message && <Notice>{message}</Notice>}
          <section className="support">
            <h2>Order audit</h2>
            {!resource.data.runs.length ? (
              <p className="muted">
                Submitted orders and reconciliation results will appear here.
              </p>
            ) : (
              <div className="compact-records">
                {resource.data.runs.map((r) => (
                  <div key={r.id}>
                    <div>
                      <strong>
                        {r.status.replaceAll("_", " ")} ·{" "}
                        {dateLabel(r.created_at)}
                      </strong>
                      <small>
                        {r.detail}{" "}
                        {r.filled_qty > 0
                          ? `${r.filled_qty} filled at ${amount(r.filled_avg_price, "USD")}`
                          : ""}
                      </small>
                      <code>{r.client_order_id}</code>
                    </div>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => action({ op: "reconcile", id: r.id })}
                    >
                      Reconcile
                    </button>
                    {!["filled", "canceled", "expired", "rejected"].includes(
                      r.status,
                    ) && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => action({ op: "cancel", id: r.id })}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      {!resource.data && !resource.loading && (
        <p className="footnote">
          The account owner, database migration and server credentials must be
          configured. Research and portfolio access do not require
          paper-execution privileges.
        </p>
      )}
    </article>
  );
}
