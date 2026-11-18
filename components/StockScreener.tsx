"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import {
  screenerFields,
  type ScreenField,
  type ScreenRow,
  type ScreenInput,
} from "@/lib/stock-screener";
import s from "./OptionsMarketOverview.module.css";
type Result = {
  withheld: string[];
  matched: number;
  results: ScreenRow[];
  limit: number;
  source: string;
  retrievedAt: string;
  screen: ScreenInput;
};
const value = (n: number | null, suffix = "") =>
  n === null
    ? "Not supplied"
    : n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + suffix;
export default function StockScreener() {
  const [field, setField] = useState<ScreenField>("MARKET_CAP"),
    [op, setOp] = useState<"GTE" | "LTE">("GTE"),
    [threshold, setThreshold] = useState("");
  const [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState(0);
  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setPage(0);
    try {
      setResult(
        await api<Result>("stock-screener", {
          field,
          op,
          value: Number(threshold),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screen unavailable.");
    } finally {
      setBusy(false);
    }
  };
  const rows = result?.results.slice(page * 25, (page + 1) * 25) ?? [],
    pages = Math.max(1, Math.ceil((result?.results.length ?? 0) / 25));
  return (
    <section className={s.screener} aria-labelledby="stock-screener-title">
      <h2 id="stock-screener-title">Stock screener</h2>
      <p>
        Choose a factual filter across SentiSense’s tracked stocks. This is not
        a buy list or a complete market census. Missing values do not match a
        filter.
      </p>
      <form onSubmit={run} className={s.pagination}>
        <label className={s.search}>
          Measurement
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value as ScreenField);
              setThreshold("");
            }}
          >
            {Object.entries(screenerFields).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.search}>
          Comparison
          <select
            value={op}
            onChange={(e) => setOp(e.target.value as "GTE" | "LTE")}
          >
            <option value="GTE">At least</option>
            <option value="LTE">At most</option>
          </select>
        </label>
        <label className={s.search}>
          Value
          <input
            type="number"
            required
            min={screenerFields[field].min}
            step={field === "ANALYST_COUNT" ? "1" : "any"}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy || threshold.trim() === ""}>
          {busy ? "Running screen…" : "Run screen"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          {result.withheld.length > 0 && (
            <p>
              {result.withheld.join(" and ")} is withheld under your current app
              access. Its columns show Not supplied.
            </p>
          )}
          <p role="status">
            {result.matched} matches · {result.results.length} returned
            {result.matched > result.results.length
              ? ` (capped at ${result.limit}; refine the filter to narrow results)`
              : ""}
            . Applied: {screenerFields[result.screen.field].label}{" "}
            {result.screen.op === "GTE" ? "≥" : "≤"} {result.screen.value}.
            Sorted by that measurement{" "}
            {result.screen.op === "GTE" ? "descending" : "ascending"}.
          </p>
          <p>
            Prices are delayed, not executable quotes. “Time not supplied” may
            mean previous-close fallback; retrieval time is not quote time.
            Analyst upside is an estimate, not a forecast from Auryn.
          </p>
          <nav className={s.pagination} aria-label="Screen result pages">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page + 1} of {pages}
            </span>
            <button
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </nav>
          {result.results.length === 0 ? (
            <p>No stocks matched this filter.</p>
          ) : (
            <div
              className={s.tableScroll}
              tabIndex={0}
              role="region"
              aria-label="Stock screener results"
            >
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Price · quote units</th>
                    <th>Price observation (UTC)</th>
                    <th>Day change</th>
                    <th>Market cap · USD</th>
                    <th>Rating analysts</th>
                    <th>Target upside</th>
                    <th>1Y return</th>
                    <th>30D volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.ticker}>
                      <th>
                        <Link
                          href={`/research/${encodeURIComponent(r.ticker)}`}
                        >
                          {r.ticker} ↗
                        </Link>
                      </th>
                      <td>{value(r.currentPrice)}</td>
                      <td>
                        {r.priceAsOf === null
                          ? "Time not supplied"
                          : new Date(r.priceAsOf)
                              .toISOString()
                              .replace("T", " ")
                              .replace(".000Z", "")}
                      </td>
                      <td>{value(r.changePercent, "%")}</td>
                      <td>{value(r.marketCap)}</td>
                      <td>{value(r.analystCount)}</td>
                      <td>{value(r.analystTargetUpsidePct, "%")}</td>
                      <td>{value(r.return1Y, "%")}</td>
                      <td>{value(r.volatility30D, "%")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="small muted">
            Source: {result.source}. Retrieved {result.retrievedAt}. Rating
            analyst counts and target-price coverage may differ. Non-price
            metric observation dates are not supplied by this view.
          </p>
        </>
      )}
    </section>
  );
}
