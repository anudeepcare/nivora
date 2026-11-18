"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Transaction } from "@/lib/transaction-ledger";
import type { AccountPerformancePoint } from "@/lib/account-performance";
import styles from "./AccountHistory.module.css";
import { amount } from "@/lib/format";
import { accountHistoryWindow } from "@/lib/account-history-window";
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
export default function AccountHistory({
  readOnly = false,
}: { readOnly?: boolean } = {}) {
  const controller = useRef<AbortController | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(800);
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
  const [restoring, setRestoring] = useState(true);
  const [restoreNotice, setRestoreNotice] = useState("");
  const [period, setPeriod] = useState("ALL");
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    api<{ result: History | null }>(
      "account-history/jobs",
      undefined,
      abort.signal,
    )
      .then((saved) => {
        if (!abort.signal.aborted) setResult(saved.result);
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setRestoreNotice(
            error instanceof Error
              ? error.message
              : "Saved comparison could not be loaded.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setRestoring(false);
      });
    return () => abort.abort();
  }, []);
  async function review() {
    controller.current?.abort();
    setRestoring(false);
    setRestoreNotice("");
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
  const allPoints = result?.points ?? [];
  const coverage = accountHistoryWindow(
    allPoints.map((p) => p.date),
    period,
  );
  const cutoff = coverage.cutoff;
  const points = allPoints.filter((point) => Date.parse(point.date) >= cutoff),
    last = points.at(-1),
    inspected =
      points[Math.min(inspection ?? points.length - 1, points.length - 1)],
    benchmarks = (result?.benchmarks ?? [])
      .filter((b) => b.status === "available")
      .map((b) => ({
        ...b,
        points: b.points.filter((point) => Date.parse(point.date) >= cutoff),
      })),
    values = [
      ...points.flatMap((p) => [p.equity, p.netContributions]),
      ...benchmarks.flatMap((b) => b.points.map((p) => p.value)),
    ],
    low = Math.min(0, ...values),
    high = Math.max(1, ...values),
    span = high - low || 1;
  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setChartWidth(Math.max(200, entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [points.length]);
  const x = (date: string) =>
    64 +
    ((Date.parse(date) - Date.parse(points[0].date)) /
      Math.max(86400000, Date.parse(last!.date) - Date.parse(points[0].date))) *
      (chartWidth - 84);
  const line = (key: "equity" | "netContributions") =>
    points
      .map((p) => `${x(p.date)},${180 - ((p[key] - low) / span) * 160}`)
      .join(" ");
  // A missing saved comparison is not useful content on Portfolio.
  // Keep the complete review/build workflow available in its own workspace.
  if (readOnly && (result?.status !== "available" || !last)) return null;
  return (
    <div className={styles.history} data-read-only={readOnly || undefined}>
      <header className={styles.chartHeader}>
        <h2>Account value &amp; market comparison</h2>
        <div className={styles.periods} aria-label="Account history period">
          {["1M", "6M", "YTD", "1Y", "ALL"].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => {
                setPeriod(value);
                setInspection(null);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </header>
      <p className={styles.intro}>
        Track account value and net contributions against S&amp;P 500 (SPY) and
        Nasdaq-100 (QQQ), using the same dated deposits and withdrawals.
        Benchmarks are hypothetical balances, not percentage returns.{" "}
        {"No current-holdings backcast."}
      </p>
      {!readOnly && (
        <>
          <div className={styles.actions}>
            <button className="btn" disabled={busy} onClick={review}>
              {result
                ? "Review ledger & rebuild"
                : "Review ledger to build comparison"}
            </button>
            <span className={styles.scope}>
              Complete USD ledger · up to 50 US-listed instruments · from
              inception, up to 1 year
            </span>
          </div>
          {restoring && (
            <p role="status" className={styles.scope}>
              Checking for your saved comparison…
            </p>
          )}
          {restoreNotice && (
            <p role="status" className={styles.scope}>
              {restoreNotice}
            </p>
          )}
          {!result && !reviewed && !restoring && (
            <p className={styles.scope}>
              Positions alone cannot show actual account performance. Review the
              saved ledger, confirm it is complete, then build the chart. Crypto
              and non-US instruments are not supported; unsupported or
              incomplete accounts are not shown as partial portfolios.
            </p>
          )}
          {progress && <p role="status">{progress}</p>}
          {reviewed && (
            <details open>
              <summary>
                Review saved revision {reviewed.revision} ·{" "}
                {reviewed.rows.length} transactions
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
          {reviewed && (
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
                  I have reviewed this saved revision: it contains every
                  deposit, withdrawal, trade, dividend, fee and split for these
                  accounts from inception.
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
          )}
          <p className={styles.scope}>
            Larger or incomplete ledgers are not shown as partial performance.
            Confirmation does not change your records.
          </p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {result && <p role="status">{result.reason}</p>}
      {last && (
        <>
          <p className={styles.scope}>
            Displayed evidence: {coverage.actualStart}–{coverage.actualEnd}.
            {coverage.requestedStart && (
              <>
                {" "}
                Requested window starts {coverage.requestedStart}, ending at the
                latest validated observation, not necessarily today.
              </>
            )}
            {coverage.shortHistory && (
              <>
                {" "}
                Available history starts later than the requested window.
                Earlier account values are not reconstructed.
              </>
            )}{" "}
            Balances and cumulative gain/loss retain their inception basis;
            changing the window does not calculate a period return.
          </p>
          <p>
            <strong>{amount(last.equity)}</strong> account equity ·{" "}
            {amount(last.netContributions)} net contributions ·{" "}
            {amount(last.gain)} cumulative gain/loss · through {last.date}
          </p>
          <div className={styles.legend} aria-label="Chart series">
            <span data-series="equity">Account value</span>
            <span data-series="contributions">Net contributions</span>
            {benchmarks.map((b) => (
              <span key={b.symbol} data-series={b.symbol}>
                {b.symbol === "SPY" ? "S&P 500 (SPY)" : "Nasdaq-100 (QQQ)"} ·
                hypothetical
              </span>
            ))}
          </div>
          <div className={styles.chart} ref={chartRef}>
            <svg
              viewBox={`0 0 ${chartWidth} 210`}
              role="img"
              onPointerMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = Math.max(
                  0,
                  Math.min(
                    1,
                    (((event.clientX - rect.left) / rect.width) * chartWidth -
                      64) /
                      (chartWidth - 84),
                  ),
                );
                const time =
                  Date.parse(points[0].date) +
                  ratio * (Date.parse(last.date) - Date.parse(points[0].date));
                setInspection(
                  points.reduce(
                    (best, point, i) =>
                      Math.abs(Date.parse(point.date) - time) <
                      Math.abs(Date.parse(points[best].date) - time)
                        ? i
                        : best,
                    0,
                  ),
                );
              }}
              aria-label={`Account equity and net contributions from ${points[0].date} to ${last.date}`}
              style={{
                width: "100%",
                minHeight: 220,
                maxHeight: 340,
                touchAction: "pan-y",
              }}
            >
              <text x="60" y="20" textAnchor="end">
                {amount(high, "USD", true)}
              </text>
              <text x="60" y="180" textAnchor="end">
                {amount(low, "USD", true)}
              </text>
              <line
                x1="64"
                x2={chartWidth - 20}
                y1="180"
                y2="180"
                stroke="var(--border)"
              />
              <text x="64" y="204">
                {points[0].date}
              </text>
              {points.length > 1 && (
                <text x={chartWidth - 20} y="204" textAnchor="end">
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
      {result && (
        <div
          className={styles.comparisonSummary}
          aria-label="Market comparison results"
        >
          {(["SPY", "QQQ"] as const).map((symbol) => {
            const benchmark = result.benchmarks?.find(
              (b) => b.symbol === symbol,
            );
            const end =
              benchmark?.status === "available"
                ? benchmark.points.find((point) => point.date === last?.date)
                : undefined;
            return (
              <div key={symbol}>
                <h3>
                  {symbol === "SPY" ? "S&P 500 (SPY)" : "Nasdaq-100 (QQQ)"}
                </h3>
                {end && last ? (
                  <>
                    <strong>{amount(end.value)}</strong>
                    <small>Hypothetical balance · {end.date}</small>
                    <p>
                      Account minus benchmark: {amount(last.equity - end.value)}
                    </p>
                  </>
                ) : (
                  <p>
                    {benchmark?.status === "unavailable"
                      ? benchmark.reason
                      : readOnly
                        ? "No validated comparison available for this saved history."
                        : "No comparison result supplied. Build complete account history to compare."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
