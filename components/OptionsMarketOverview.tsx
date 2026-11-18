"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import IntelligenceTable from "./IntelligenceTable";
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
  const instruments = [
    ...new Set(visible.map((record) => String(record.ticker))),
  ]
    .filter((ticker) => /^[A-Z0-9.\-]+$/.test(ticker))
    .sort();
  return (
    <section className={s.optionsPanel}>
      <header className={s.header}>
        <h3>Options across the market</h3>
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
              onClick={() => setBoard(id)}
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ticker, e.g. AAPL"
              />
            </label>
            <p role="status">
              {visible.length} of {records.length} observations shown. Select a
              ticker below to open its options research.
            </p>
            {visible.length === 0 && (
              <p>No instruments match “{query}”. Try another ticker.</p>
            )}
            <IntelligenceTable
              title={`${board} options observations`}
              rows={visible
                .filter((r) => typeof r.ticker === "string")
                .map((r) => ({
                  label: String(r.ticker),
                  href: null,
                  date:
                    typeof r.asOf === "string" ? r.asOf : (data?.asOf ?? null),
                  cells: [
                    {
                      label: "ATM implied volatility",
                      value: finite(r.atmIv, true),
                    },
                    { label: "Put/call volume", value: finite(r.pcVol) },
                  ],
                }))}
            />
            <section
              aria-label="Open a covered instrument"
              className={picker.picker}
            >
              <h4>Open a covered instrument</h4>
              <div
                role="region"
                aria-label="Covered instrument links"
                tabIndex={0}
                className={picker.scroll}
              >
                <ul className={picker.list}>
                  {instruments.map((ticker) => (
                    <li key={ticker}>
                      <Link
                        href={`/research/${encodeURIComponent(ticker)}?tab=Options`}
                        aria-label={`Open ${ticker} options research`}
                      >
                        {ticker}
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </>
    </section>
  );
}
