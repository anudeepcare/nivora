"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const ScreenerCatalog = dynamic(() => import("./ScreenerCatalog"));
import { api } from "@/lib/client";
import {
  screenerFields,
  screenInput,
  type ScreenField,
  type ScreenRow,
  type ScreenInput,
} from "@/lib/stock-screener";
import s from "./OptionsMarketOverview.module.css";
import ui from "./StockScreener.module.css";
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
const direction = (n: number | null) =>
  n == null || !Number.isFinite(n) || n === 0 ? "flat" : n > 0 ? "up" : "down";
const units = (field: ScreenField) =>
  field === "MARKET_CAP"
    ? "USD"
    : field === "PRICE"
      ? "quote units"
      : field === "ANALYST_COUNT"
        ? "whole analysts"
        : "%";
export default function StockScreener() {
  const [field, setField] = useState<ScreenField>("MARKET_CAP"),
    [op, setOp] = useState<"GTE" | "LTE">("GTE"),
    [threshold, setThreshold] = useState("");
  const [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState(0);
  const [secondEnabled, setSecondEnabled] = useState(false),
    [secondField, setSecondField] = useState<ScreenField>("ANALYST_COUNT"),
    [secondOp, setSecondOp] = useState<"GTE" | "LTE">("GTE"),
    [secondThreshold, setSecondThreshold] = useState("");
  const run = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input =
      threshold.trim() && (!secondEnabled || secondThreshold.trim())
        ? screenInput({
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
      setResult(await api<Result>("stock-screener", input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screen unavailable.");
    } finally {
      setBusy(false);
    }
  };
  const edited =
    !!result &&
    (field !== result.screen.field ||
      op !== result.screen.op ||
      threshold.trim() === "" ||
      Number(threshold) !== result.screen.value ||
      secondEnabled !== !!result.screen.second ||
      (secondEnabled &&
        (secondField !== result.screen.second?.field ||
          secondOp !== result.screen.second?.op ||
          secondThreshold.trim() === "" ||
          Number(secondThreshold) !== result.screen.second?.value)));
  const rows = result?.results.slice(page * 25, (page + 1) * 25) ?? [],
    pages = Math.max(1, Math.ceil((result?.results.length ?? 0) / 25));
  const breadth = result?.results.reduce(
    (a, r) => {
      if (r.changePercent === null) a.missing++;
      else if (r.changePercent > 0) a.positive++;
      else if (r.changePercent < 0) a.negative++;
      else a.unchanged++;
      return a;
    },
    { positive: 0, negative: 0, unchanged: 0, missing: 0 },
  );
  const comparison = rows.slice(0, 8);
  const maxChange = Math.max(
    0,
    ...comparison.map((r) =>
      r.changePercent === null ? 0 : Math.abs(r.changePercent),
    ),
  );
  return (
    <section
      className={`${s.screener} ${ui.root}`}
      aria-labelledby="stock-screener-title"
    >
      <h2 id="stock-screener-title">Stock screener</h2>
      <p>
        Combine up to two factual conditions across the tracked stocks. This is
        not a buy list or a complete market census. Missing values do not match
        a filter. Both conditions must match; sorting uses the first
        measurement.
      </p>
      <form onSubmit={run} className={ui.form}>
        <fieldset disabled={busy} className={ui.condition}>
          <legend>Condition 1</legend>
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
            Value · {units(field)}
            <input
              type="number"
              required
              min={screenerFields[field].min}
              step={field === "ANALYST_COUNT" ? "1" : "any"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
        </fieldset>
        <div
          role="group"
          aria-label="Additional condition"
          className={ui.additional}
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
              <span className={ui.conditionLabel}>Condition 2 · AND</span>
              <label>
                And measurement
                <select
                  value={secondField}
                  disabled={busy}
                  onChange={(e) => {
                    setSecondField(e.target.value as ScreenField);
                    setSecondThreshold("");
                  }}
                >
                  {Object.entries(screenerFields).map(([key, v]) => (
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
                Value · {units(secondField)}
                <input
                  type="number"
                  required
                  disabled={busy}
                  min={screenerFields[secondField].min}
                  step={secondField === "ANALYST_COUNT" ? "1" : "any"}
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
        <button
          className={ui.run}
          type="submit"
          disabled={
            busy ||
            threshold.trim() === "" ||
            (secondEnabled && secondThreshold.trim() === "")
          }
        >
          {busy ? "Running screen…" : "Run screen"}
        </button>
      </form>
      <ScreenerCatalog universe="STOCK" />
      {edited && (
        <p className={ui.changed} role="status">
          Filters changed. Run screen to apply them; the results below still use
          the last applied conditions.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className={ui.results}>
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
            {result.screen.op === "GTE" ? "≥" : "≤"} {result.screen.value}
            {result.screen.second && (
              <>
                {" "}
                AND {screenerFields[result.screen.second.field].label}{" "}
                {result.screen.second.op === "GTE" ? "≥" : "≤"}{" "}
                {result.screen.second.value}
              </>
            )}
            . Sorted by that measurement{" "}
            {result.screen.op === "GTE" ? "descending" : "ascending"}.
          </p>
          <p>
            Prices are delayed, not executable quotes. “Time not supplied” may
            mean previous-close fallback; retrieval time is not quote time.
            Analyst upside is an estimate, not a forecast from Auryn.
          </p>
          {breadth && result.results.length > 0 && (
            <section
              className={ui.visualSummary}
              aria-label="Returned-set day changes"
            >
              <div>
                <h3>Returned-set day changes</h3>
                <div
                  className={ui.breadthBar}
                  role="img"
                  aria-label={`${breadth.positive} positive, ${breadth.negative} negative, ${breadth.unchanged} unchanged, ${breadth.missing} not supplied among returned stocks`}
                >
                  {(
                    ["positive", "negative", "unchanged", "missing"] as const
                  ).map((kind) => (
                    <span
                      key={kind}
                      data-kind={kind}
                      style={{
                        width: `${(breadth[kind] / result.results.length) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <dl className={ui.breadthLegend}>
                  {(
                    ["positive", "negative", "unchanged", "missing"] as const
                  ).map((kind) => (
                    <div key={kind} data-kind={kind}>
                      <dt>{kind === "missing" ? "Not supplied" : kind}</dt>
                      <dd>{breadth[kind]}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  Only the {result.results.length} returned stocks, not
                  market-wide breadth. Delayed observations may have different
                  timestamps; see the table.
                </p>
              </div>
              <div>
                <h3>Observed day change comparisons</h3>
                <p>
                  First {comparison.length} rows on this page, in the applied
                  sort order. Not a performance ranking.
                </p>
                {comparison.map((r) => (
                  <div
                    className={ui.comparisonRow}
                    key={r.ticker}
                    data-direction={direction(r.changePercent)}
                  >
                    <span>{r.ticker}</span>
                    <div className={ui.comparisonTrack} aria-hidden="true">
                      <i className={ui.zeroGuide} />
                      {r.changePercent === null ? null : (
                        <span
                          className={ui.comparisonBar}
                          style={{
                            left:
                              r.changePercent < 0
                                ? `${50 - (maxChange ? (Math.abs(r.changePercent) / maxChange) * 50 : 0)}%`
                                : "50%",
                            width: `${maxChange ? (Math.abs(r.changePercent) / maxChange) * 50 : 0}%`,
                          }}
                        />
                      )}
                    </div>
                    <strong>{value(r.changePercent, "%")}</strong>
                  </div>
                ))}
                <div className={ui.comparisonAxis}>
                  <span>−{value(maxChange)}%</span>
                  <span>0</span>
                  <span>+{value(maxChange)}%</span>
                </div>
              </div>
            </section>
          )}
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
              <table className={`${s.table} ${ui.table}`}>
                <caption>
                  Returned stock observations · {result.results.length} of{" "}
                  {result.matched} matches
                </caption>
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
                      <td data-direction={direction(r.changePercent)}>
                        {value(r.changePercent, "%")}
                      </td>
                      <td>{value(r.marketCap)}</td>
                      <td>{value(r.analystCount)}</td>
                      <td>{value(r.analystTargetUpsidePct, "%")}</td>
                      <td data-direction={direction(r.return1Y)}>
                        {value(r.return1Y, "%")}
                      </td>
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
        </div>
      )}
    </section>
  );
}
