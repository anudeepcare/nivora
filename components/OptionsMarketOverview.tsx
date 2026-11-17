"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import IntelligenceTable from "./IntelligenceTable";
import s from "./SentiSensePanels.module.css";
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
            <IntelligenceTable
              title={`${board} options observations`}
              rows={records
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
            <details>
              <summary>Open a covered instrument</summary>
              <div
                className={s.tabs}
                style={{ maxHeight: 240, overflow: "auto", flexWrap: "wrap" }}
              >
                {records
                  .filter(
                    (r) =>
                      typeof r.ticker === "string" &&
                      /^[A-Z0-9.\-]+$/.test(r.ticker),
                  )
                  .map((r) => (
                    <Link
                      key={String(r.ticker)}
                      href={`/research/${encodeURIComponent(String(r.ticker))}?tab=Options`}
                    >
                      {String(r.ticker)}
                    </Link>
                  ))}
              </div>
            </details>
          </>
        )}
      </>
    </section>
  );
}
