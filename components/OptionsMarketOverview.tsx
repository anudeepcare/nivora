"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";

import s from "./SentiSensePanels.module.css";
import picker from "./OptionsMarketOverview.module.css";
const finite = (v: unknown, percent = false) =>
  typeof v === "number" && Number.isFinite(v)
    ? `${(v * (percent ? 100 : 1)).toFixed(2)}${percent ? "%" : "×"}`
    : "Not supplied";
export default function OptionsMarketOverview({
  preview = false,
}: {
  preview?: boolean;
}) {
  const [board, setBoard] = useState("stocks");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const resource = useResource<SentiSenseResult>(
    !preview ? "options-overview" : null,
    undefined,
    300000,
  );
  if (preview) return null;
  const data = resource.data?.data as {
    asOf?: string;
    coverageCount?: number;
    rows?: Record<string, unknown>[];
    etfRows?: Record<string, unknown>[];
  } | null;
  const records = (board === "stocks" ? data?.rows : data?.etfRows) ?? [];
  const visible = records.filter(
    (record) =>
      typeof record.ticker === "string" &&
      record.ticker.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const pageRows = visible.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  return (
    <section className={s.optionsPanel}>
      <header className={s.header}>
        <h3>Options across the market</h3>
        <Link href="/options">Open market workspace ↗</Link>
      </header>
      <>
        <p>
          End-of-day observations. Stock and fund universes are separate, not a
          combined ranking. No trade direction is inferred.
        </p>
        <nav className={s.tabs} aria-label="Options universe">
          {["stocks", "funds"].map((id) => (
            <button
              key={id}
              aria-pressed={board === id}
              onClick={() => {
                setBoard(id);
                setPage(0);
              }}
            >
              {id === "stocks" ? "Stocks" : "ETFs"}
            </button>
          ))}
        </nav>
        {resource.loading ? (
          <p role="status">Loading market observations…</p>
        ) : resource.error ? (
          <p role="status">
            Market observations could not be loaded.{" "}
            <button onClick={resource.refresh}>Retry market overview</button>
          </p>
        ) : resource.data?.status !== "available" &&
          resource.data?.status !== "preview" ? (
          <p role="status">Market options coverage is unavailable.</p>
        ) : (
          <>
            <p>
              {records.length} returned {board}.{" "}
              {board === "stocks" && data?.coverageCount != null
                ? `${data.coverageCount} stocks in provider coverage.`
                : ""}{" "}
              {resource.data?.isPreview
                ? "Limited preview; absent symbols do not establish noncoverage."
                : ""}
            </p>
            <label className={picker.search}>
              Search covered instruments
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                placeholder="Ticker, e.g. AAPL"
              />
            </label>
            <p role="status">
              {visible.length} matching observations · {records.length}{" "}
              returned. Select a ticker to open its options research.
            </p>
            {visible.length === 0 && (
              <p>No instruments match “{query}”. Try another ticker.</p>
            )}
            <nav
              className={picker.pagination}
              aria-label="Market observations pages"
            >
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span role="status">
                Page {currentPage + 1} of {pages} · {pageRows.length} rows
              </span>
              <button
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
            <div
              className={picker.tableScroll}
              role="region"
              aria-label="Market options observations"
              tabIndex={0}
            >
              <table className={picker.table}>
                <caption className="sr-only">
                  End-of-day options observations. Missing values are not
                  supplied.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Instrument</th>
                    <th scope="col">Observed date</th>
                    <th scope="col">ATM implied volatility</th>
                    <th scope="col">Put/call volume</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((record, index) => (
                    <tr key={`${record.ticker}:${index}`}>
                      <th scope="row">
                        <Link
                          href={`/research/${encodeURIComponent(String(record.ticker))}?tab=Options`}
                        >
                          {String(record.ticker)} ↗
                        </Link>
                      </th>
                      <td>
                        {typeof record.asOf === "string"
                          ? record.asOf
                          : (data?.asOf ?? "Not supplied")}
                      </td>
                      <td>{finite(record.atmIv, true)}</td>
                      <td>{finite(record.pcVol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    </section>
  );
}
