"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Transaction } from "@/lib/transaction-ledger";
import type { AccountPerformancePoint } from "@/lib/account-performance";
import styles from "./AccountHistory.module.css";
import { amount } from "@/lib/format";
import type { BenchmarkResult } from "@/lib/account-benchmark";
type History = {
  benchmarks?: BenchmarkResult[];
  status: "available" | "unavailable";
  reason: string;
  points: AccountPerformancePoint[];
  revision: number;
  requestedThrough: string;
  lastValuationDate: string | null;
};
export default function AccountHistory() {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [progress, setProgress] = useState("");
  const [inspection, setInspection] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<History | null>(null),
    [reviewed, setReviewed] = useState<{
      revision: number;
      rows: Transaction[];
    } | null>(null);
  async function review() {
    setInspection(null);
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
    setInspection(null);
    setBusy(true);
    setError("");
    setResult(null);
    try {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      type Job = {
        id: string;
        completed: number;
        total: number;
        result: History | null;
        retry: boolean;
      };
      const confirmation = {
        revision: reviewed.revision,
        confirmComplete: confirmed,
      };
      let job = await api<Job>(
        "account-history/jobs",
        confirmation,
        abort.signal,
      );
      for (let step = 0; !job.result && step < 100; step++) {
        setProgress(
          `Preparing complete account history · ${job.completed}/${job.total} evidence checks`,
        );
        job = await api<Job>(
          "account-history/jobs",
          { ...confirmation, id: job.id },
          abort.signal,
        );
        if (job.retry)
          throw new Error(
            "History evidence is temporarily unavailable. Progress is saved; review and build again to resume.",
          );
      }
      if (!job.result)
        throw new Error(
          "History progress is saved. Review and build again to resume.",
        );
      setResult(job.result);
      setProgress("");
    } catch (e) {
      setProgress("");
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
    inspected =
      points[Math.min(inspection ?? points.length - 1, points.length - 1)],
    benchmarks = (result?.benchmarks ?? []).filter(
      (b) => b.status === "available",
    ),
    values = [
      ...points.flatMap((p) => [p.equity, p.netContributions]),
      ...benchmarks.flatMap((b) => b.points.map((p) => p.value)),
    ],
    low = Math.min(0, ...values),
    high = Math.max(1, ...values),
    span = high - low || 1;
  const x = (date: string) =>
    64 +
    ((Date.parse(date) - Date.parse(points[0].date)) /
      Math.max(86400000, Date.parse(last!.date) - Date.parse(points[0].date))) *
      696;
  const line = (key: "equity" | "netContributions") =>
    points
      .map((p) => `${x(p.date)},${180 - ((p[key] - low) / span) * 160}`)
      .join(" ");
  return (
    <div className={styles.history}>
      <p className={styles.intro}>
        Reconstruct account equity from your saved transactions, cash flows and
        dated closing prices. No current-holdings backcast.
      </p>
      <div className={styles.actions}>
        <button className="btn" disabled={busy} onClick={review}>
          Load saved ledger for review
        </button>
        <span className={styles.scope}>
          USD · Up to 50 US instruments · 1-year inception ledger
        </span>
      </div>
      {progress && <p role="status">{progress}</p>}
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
      <div className={styles.setup}>
        <label className={styles.confirmation}>
          <input
            type="checkbox"
            checked={confirmed}
            disabled={busy || !reviewed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              setResult(null);
            }}
          />
          <span>
            I have reviewed this saved revision: it contains every deposit,
            withdrawal, trade, dividend, fee and split for these accounts from
            inception.
          </span>
        </label>
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
      </div>
      <p className={styles.scope}>
        Larger or incomplete ledgers are not shown as partial performance.
        Confirmation does not change your records.
      </p>
      {error && <p role="alert">{error}</p>}
      {result && <p role="status">{result.reason}</p>}
      {last && (
        <>
          <p>
            <strong>{amount(last.equity)}</strong> account equity ·{" "}
            {amount(last.netContributions)} net contributions ·{" "}
            {amount(last.gain)} gain/loss · through {last.date}
          </p>
          <div className={styles.chart}>
            <svg
              viewBox="0 0 800 210"
              role="img"
              aria-label={`Account equity and net contributions from ${points[0].date} to ${last.date}`}
              style={{ width: "100%", maxHeight: 260 }}
            >
              <text x="60" y="20" textAnchor="end">
                {amount(high)}
              </text>
              <text x="60" y="180" textAnchor="end">
                {amount(low)}
              </text>
              <line x1="64" x2="760" y1="180" y2="180" stroke="var(--border)" />
              <text x="64" y="204">
                {points[0].date}
              </text>
              {points.length > 1 && (
                <text x="760" y="204" textAnchor="end">
                  {last.date}
                </text>
              )}
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
              {benchmarks.map((b) => (
                <polyline
                  key={b.symbol}
                  fill="none"
                  stroke={
                    b.symbol === "SPY"
                      ? "var(--purple, #9b7ede)"
                      : "var(--amber, #bd7b17)"
                  }
                  strokeWidth="2"
                  strokeDasharray={b.symbol === "SPY" ? "9 3" : "2 3"}
                  points={b.points
                    .map(
                      (p) =>
                        `${x(p.date)},${180 - ((p.value - low) / span) * 160}`,
                    )
                    .join(" ")}
                />
              ))}
              {inspected && (
                <circle
                  cx={x(inspected.date)}
                  cy={180 - ((inspected.equity - low) / span) * 160}
                  r="4"
                  fill="var(--blue)"
                />
              )}
            </svg>
            <input
              type="range"
              aria-label="Inspect account history date"
              min={0}
              max={Math.max(0, points.length - 1)}
              value={Math.max(
                0,
                Math.min(inspection ?? points.length - 1, points.length - 1),
              )}
              aria-valuetext={
                inspected
                  ? `${inspected.date}: equity ${amount(inspected.equity)}, net contributions ${amount(inspected.netContributions)}`
                  : undefined
              }
              onChange={(e) => setInspection(Number(e.target.value))}
            />
            {inspected && (
              <output className={styles.readout} aria-live="polite">
                <strong>{inspected.date}</strong>
                <span>Equity {amount(inspected.equity)}</span>
                <span>Contributed {amount(inspected.netContributions)}</span>
                <span>Gain/loss {amount(inspected.gain)}</span>
                {benchmarks.map((b) => {
                  const value = b.points.find(
                    (p) => p.date === inspected.date,
                  )?.value;
                  return value === undefined ? null : (
                    <span key={b.symbol}>
                      {b.symbol} hypothetical {amount(value)} · difference{" "}
                      {amount(inspected.equity - value)}
                    </span>
                  );
                })}
              </output>
            )}
          </div>
          <p>
            <small>
              Solid: equity · Dashed: net contributions.
              {benchmarks.length > 0 &&
                " Long dash: SPY · Dotted: QQQ (hypothetical)."}{" "}
              USD. Based on your completeness confirmation, not an independently
              verified broker statement. No percentage return is inferred.
            </small>
          </p>
          {(result?.benchmarks?.length ?? 0) > 0 && (
            <details>
              <summary>Market comparison · SPY / QQQ</summary>
              <p>
                SPY is an S&amp;P 500 ETF proxy; QQQ tracks the Nasdaq-100, not
                the Nasdaq Composite. Neither is the index itself. Long dash:
                SPY · Dotted: QQQ.
              </p>
              <p>
                Hypothetical USD balances apply your same net daily deposits and
                withdrawals at that date’s close. Split- and dividend-adjusted
                prices model reinvestment; actual account dividends remain
                ledger cash until traded. No additional trading fees, taxes or
                slippage are modeled. These are not portfolio percentage
                returns. Withdrawals requiring borrowing and flows without an
                exact closing price, including holidays/weekends, make the
                comparison unavailable.
              </p>
              {result?.benchmarks?.map((b) => (
                <p key={b.symbol}>
                  {b.symbol}:{" "}
                  {b.status === "available"
                    ? "Matched cash-flow comparison available"
                    : b.reason}
                </p>
              ))}
              <p>
                Source: EODHD daily adjusted closes, one whole-window response
                per ETF; not mixed adjustment snapshots.{" "}
                <a
                  href="https://eodhd.com/financial-apis/api-for-historical-data-and-volumes"
                  target="_blank"
                  rel="noreferrer"
                >
                  Price methodology
                </a>
              </p>
            </details>
          )}
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
