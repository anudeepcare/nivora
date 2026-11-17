"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Transaction } from "@/lib/transaction-ledger";
import type { AccountPerformancePoint } from "@/lib/account-performance";
import { amount } from "@/lib/format";
type History = {
  status: "available" | "unavailable";
  reason: string;
  points: AccountPerformancePoint[];
  revision: number;
  requestedThrough: string;
  lastValuationDate: string | null;
};
export default function AccountHistory() {
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<History | null>(null),
    [reviewed, setReviewed] = useState<{
      revision: number;
      rows: Transaction[];
    } | null>(null);
  async function review() {
    setConfirmed(false);
    setReviewed(null);
    setResult(null);
    setError("");
    setBusy(true);
    try {
      setReviewed(
        await api<{ revision: number; rows: Transaction[] }>("transactions"),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Saved ledger could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function calculate() {
    if (!confirmed || !reviewed) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await api<History>("account-history", {
        revision: reviewed.revision,
        confirmComplete: confirmed,
      });
      setResult(data);
    } catch (e) {
      setConfirmed(false);
      setReviewed(null);
      setError(
        e instanceof Error
          ? e.message
          : "History unavailable. Retry after reviewing the ledger.",
      );
    } finally {
      setBusy(false);
    }
  }
  const points = result?.points ?? [],
    last = points.at(-1),
    values = points.flatMap((p) => [p.equity, p.netContributions]),
    low = Math.min(0, ...values),
    high = Math.max(1, ...values),
    span = high - low || 1;
  const line = (key: "equity" | "netContributions") =>
    points
      .map(
        (p, i) =>
          `${20 + (i / Math.max(1, points.length - 1)) * 760},${180 - ((p[key] - low) / span) * 160}`,
      )
      .join(" ");
  return (
    <div>
      <p>
        Reconstruct account equity from your saved transactions, cash flows and
        dated closing prices. No current-holdings backcast.
      </p>
      <button className="btn" disabled={busy} onClick={review}>
        Load saved ledger for review
      </button>
      {reviewed && (
        <details open>
          <summary>
            Review saved revision {reviewed.revision} · {reviewed.rows.length}{" "}
            transactions
          </summary>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Saved transactions to confirm"
            style={{ maxHeight: 360, overflow: "auto" }}
          >
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.rows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.account}</td>
                    <td>{t.type}</td>
                    <td>{t.symbol}</td>
                    <td>{t.quantity}</td>
                    <td>{amount(t.price)}</td>
                    <td>{amount(t.amount)}</td>
                    <td>{amount(t.fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <label>
        <input
          type="checkbox"
          checked={confirmed}
          disabled={busy || !reviewed}
          onChange={(e) => {
            setConfirmed(e.target.checked);
            setResult(null);
          }}
        />{" "}
        I have reviewed this saved revision: it contains every deposit,
        withdrawal, trade, dividend, fee and split for these accounts from
        inception.
      </label>
      <p>
        <small>
          Currently supports complete USD ledgers up to one year old and ten
          US-listed instruments. Larger or incomplete accounts are not shown as
          partial performance. This confirmation does not change your records.
        </small>
      </p>
      <button
        className="btn"
        disabled={!confirmed || !reviewed || busy}
        onClick={calculate}
      >
        {busy
          ? "Checking ledger & prices…"
          : error
            ? "Retry history"
            : "Build account history"}
      </button>
      {error && <p role="alert">{error}</p>}
      {result && <p role="status">{result.reason}</p>}
      {last && (
        <>
          <p>
            <strong>{amount(last.equity)}</strong> account equity ·{" "}
            {amount(last.netContributions)} net contributions ·{" "}
            {amount(last.gain)} gain/loss · through {last.date}
          </p>
          <svg
            viewBox="0 0 800 210"
            role="img"
            aria-label={`Account equity and net contributions from ${points[0].date} to ${last.date}`}
            style={{ width: "100%", maxHeight: 260 }}
          >
            <polyline
              fill="none"
              stroke="var(--blue)"
              strokeWidth="3"
              points={line("equity")}
            />
            <polyline
              fill="none"
              stroke="var(--muted)"
              strokeWidth="2"
              strokeDasharray="6 4"
              points={line("netContributions")}
            />
          </svg>
          <p>
            <small>
              Solid: equity · Dashed: net contributions. USD. Based on your
              completeness confirmation, not an independently verified broker
              statement. No percentage return is inferred.
            </small>
          </p>
          <details>
            <summary>Dated values & calculation basis</summary>
            <p>
              Raw closing prices with dated split checks; cash dividends come
              from the ledger. No missing price is carried forward. Saved ledger
              revision {result?.revision}. Requested through{" "}
              {result?.requestedThrough}; last actual valuation{" "}
              {result?.lastValuationDate}.
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Dated account equity"
              style={{ maxHeight: 440, overflow: "auto" }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Equity</th>
                    <th>Cash</th>
                    <th>Contributions</th>
                    <th>Gain/loss</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.date}>
                      <td>{p.date}</td>
                      <td>{amount(p.equity)}</td>
                      <td>{amount(p.cash)}</td>
                      <td>{amount(p.netContributions)}</td>
                      <td>{amount(p.gain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
