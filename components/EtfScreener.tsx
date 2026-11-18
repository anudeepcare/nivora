"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const ScreenerCatalog = dynamic(() => import("./ScreenerCatalog"));
import { api } from "@/lib/client";
import {
  etfFields,
  etfScreenInput,
  type EtfInput,
  type EtfRow,
} from "@/lib/etf-screener";
import s from "./GlobalEarningsCalendar.module.css";
type Result = {
  matched: number;
  results: EtfRow[];
  retrievedAt: string;
  screen: EtfInput;
  limit: number;
};
const number = (n: number | null, suffix = "") =>
  n === null
    ? "Not supplied"
    : n.toLocaleString(undefined, { maximumFractionDigits: 3 }) + suffix;
export default function EtfScreener() {
  const [field, setField] = useState<EtfInput["field"]>("EXPENSE_RATIO"),
    [op, setOp] = useState<EtfInput["op"]>("LTE"),
    [threshold, setThreshold] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Result | null>(null),
    [page, setPage] = useState(0);
  const [secondEnabled, setSecondEnabled] = useState(false),
    [secondField, setSecondField] =
      useState<EtfInput["field"]>("WEIGHT_COVERED_PCT"),
    [secondOp, setSecondOp] = useState<"GTE" | "LTE">("GTE"),
    [secondThreshold, setSecondThreshold] = useState("");
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const input =
      threshold.trim() && (!secondEnabled || secondThreshold.trim())
        ? etfScreenInput({
            field,
            op,
            value: Number(threshold),
            ...(secondEnabled
              ? {
                  second: {
                    field: secondField,
                    op: secondOp,
                    value: Number(secondThreshold),
                  },
                }
              : {}),
          })
        : null;
    if (!input) {
      setError(
        "Enter valid conditions; a lower bound cannot exceed an upper bound, and duplicate conditions are not needed.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    setPage(0);
    try {
      setResult(await api<Result>("etf-screener", input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "ETF screen unavailable.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={s.root} aria-label="ETF screener">
      <header>
        <h2>ETF screener</h2>
        <p>
          Filter tracked funds by size, annual cost, holdings or constituent
          data coverage. Missing values never match; results are not
          recommendations or an exhaustive fund list. Both conditions must
          match; sorting uses the first measurement.
        </p>
      </header>
      <ScreenerCatalog universe="ETF" />
      <form onSubmit={run}>
        <div className={s.filters}>
          <label>
            Fund metric
            <select
              value={field}
              onChange={(e) => {
                setField(e.target.value as EtfInput["field"]);
                setThreshold("");
              }}
            >
              {Object.entries(etfFields).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Comparison
            <select
              value={op}
              onChange={(e) => setOp(e.target.value as EtfInput["op"])}
            >
              <option value="LTE">At most</option>
              <option value="GTE">At least</option>
            </select>
          </label>
          <label>
            Threshold
            <input
              type="number"
              required
              min={etfFields[field].min}
              max={etfFields[field].max}
              step={field === "HOLDINGS_COUNT" ? "1" : "any"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
        </div>
        <div
          role="group"
          aria-label="Additional condition"
          className={s.filters}
        >
          {!secondEnabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setSecondEnabled(true)}
            >
              Add another condition
            </button>
          ) : (
            <>
              <label>
                And measurement
                <select
                  value={secondField}
                  disabled={busy}
                  onChange={(e) => {
                    setSecondField(e.target.value as EtfInput["field"]);
                    setSecondThreshold("");
                  }}
                >
                  {Object.entries(etfFields).map(([key, v]) => (
                    <option key={key} value={key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                And comparison
                <select
                  value={secondOp}
                  disabled={busy}
                  onChange={(e) => setSecondOp(e.target.value as "GTE" | "LTE")}
                >
                  <option value="GTE">At least</option>
                  <option value="LTE">At most</option>
                </select>
              </label>
              <label>
                And value
                <input
                  type="number"
                  required
                  disabled={busy}
                  min={etfFields[secondField].min}
                  max={etfFields[secondField].max}
                  step={secondField === "HOLDINGS_COUNT" ? "1" : "any"}
                  value={secondThreshold}
                  onChange={(e) => setSecondThreshold(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSecondEnabled(false)}
              >
                Remove additional condition
              </button>
            </>
          )}
        </div>
        <div className={s.controls}>
          <button disabled={busy}>
            {busy ? "Running…" : "Run ETF screen"}
          </button>
        </div>
      </form>
      <p className={s.note}>
        Expense ratio uses percentage points: 0.09 means 0.09%. Coverage
        describes the fund weight with constituent data, not fund quality.
      </p>
      {error && <p role="status">{error}</p>}
      {result && (
        <>
          <p>
            {result.results.length} returned of {result.matched} matching funds
            · Maximum {result.limit}. Screen:{" "}
            {etfFields[result.screen.field].label}{" "}
            {result.screen.op === "LTE" ? "≤" : "≥"} {result.screen.value}
            {result.screen.second && (
              <>
                {" "}
                AND {etfFields[result.screen.second.field].label}{" "}
                {result.screen.second.op === "GTE" ? "≥" : "≤"}{" "}
                {result.screen.second.value}
              </>
            )}
            .
          </p>
          <p className={s.note}>
            Received {result.retrievedAt}. ETF snapshot prices are delayed and
            refreshed roughly every 20 minutes during the session. The row
            snapshot time is not the price timestamp; exact quote age is not
            supplied here.
          </p>
          {result.results.length === 0 ? (
            <p>
              No matching funds in this response. Missing fields may exclude
              otherwise relevant funds.
            </p>
          ) : (
            <>
              <div
                className={s.scroll}
                role="region"
                aria-label="ETF screen results"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Fund</th>
                      <th>AUM (USD)</th>
                      <th>Annual fee</th>
                      <th>Holdings</th>
                      <th>Weight covered</th>
                      <th>Snapshot built</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results
                      .slice(page * 25, (page + 1) * 25)
                      .map((r) => (
                        <tr key={r.ticker}>
                          <td>
                            <Link
                              href={`/research/${encodeURIComponent(r.ticker)}`}
                            >
                              {r.ticker}
                            </Link>
                            <br />
                            {r.name}
                            <br />
                            {[r.issuer, r.assetClass]
                              .filter(Boolean)
                              .join(" · ")}
                          </td>
                          <td>{number(r.marketCap)}</td>
                          <td>{number(r.expenseRatio, "%")}</td>
                          <td>
                            {number(r.holdingsCount)}
                            {r.partial === true
                              ? " · Partial holdings"
                              : r.partial === null
                                ? " · Completeness unknown"
                                : ""}
                          </td>
                          <td>{number(r.weightCoveredPct, "%")}</td>
                          <td>
                            {r.lastUpdated
                              ? new Date(r.lastUpdated * 1000).toISOString()
                              : "Not supplied"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className={s.controls}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {Math.ceil(result.results.length / 25)}
                </span>
                <button
                  disabled={(page + 1) * 25 >= result.results.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
      <details>
        <summary>Source and limitations</summary>
        <p className={s.note}>
          SentiSense ETF screener. These are documented factual numeric fields,
          not the full dynamic filter catalog. The screen response has no
          documented preview flag; limited returned rows are disclosed using the
          matched count. Fund prices and expense ratios on this endpoint must
          not be confused with differently scaled quote-endpoint values.
        </p>
      </details>
    </section>
  );
}
