"use client";
import InstitutionalFlows from "./InstitutionalFlows";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import s from "./SentiSensePanels.module.css";
export type TrackedCoverage = {
  status: string;
  tickers: string[];
  retrievedAt: string;
  source: string;
};
export default function SentiSenseCoverage({
  preview = false,
}: {
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [kind, setKind] = useState("tracked");
  const resource = useResource<TrackedCoverage>(
    open && !preview ? `research-coverage?kind=${kind}` : null,
    undefined,
    86400000,
  );
  if (preview) return null;
  const tickers = resource.data?.tickers ?? [],
    filtered = tickers.filter((t) => t.includes(search.trim().toUpperCase())),
    visible = filtered.slice(0, 50);
  return (
    <section className={s.panel} aria-label="Tracked company discovery">
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>COVERAGE DISCOVERY</span>
          <h2>Start with a tracked company</h2>
        </div>
        <button
          type="button"
          className="text-button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close coverage" : "Browse coverage"}
        </button>
      </header>
      {open && (
        <>
          <p className={s.state}>
            Tracked stocks, not a guarantee of every dataset or paid
            entitlement. This list is separate from the quote universe. No calls
            are made for individual companies until you open one.
          </p>
          <nav
            className={`${s.tabs} auryn-detail-tabs`}
            aria-label="Coverage type"
          >
            {[
              ["tracked", "Tracked stocks"],
              ["kpis", "Company KPI coverage"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={kind === id}
                onClick={() => setKind(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <label htmlFor="tracked-symbol-filter">Filter ticker symbols</label>
          <input
            id="tracked-symbol-filter"
            className={s.search}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a ticker"
            autoComplete="off"
          />
          {resource.loading ? (
            <p role="status">Loading tracked companies…</p>
          ) : resource.error ? (
            <p role="status">{resource.error}</p>
          ) : resource.data?.status !== "available" ? (
            <p role="status">
              Coverage discovery is{" "}
              {resource.data?.status.replaceAll("-", " ") ?? "unavailable"}.
            </p>
          ) : (
            <>
              <div
                className={s.tabs}
                style={{ flexWrap: "wrap", maxHeight: 300, overflow: "auto" }}
              >
                {visible.map((t) => (
                  <Link
                    className="text-button"
                    href={`/research/${encodeURIComponent(t)}`}
                    key={t}
                  >
                    {t} ↗
                  </Link>
                ))}
              </div>
              {!filtered.length && (
                <p>
                  No matching ticker in the returned coverage list. This does
                  not establish quote noncoverage.
                </p>
              )}
              <footer className={s.provenance}>
                <span>
                  {visible.length} shown of {filtered.length} matching;{" "}
                  {tickers.length} tracked symbols returned
                </span>
                <span>
                  Retrieved{" "}
                  {resource.data.retrievedAt.slice(0, 19).replace("T", " ")} UTC
                </span>
              </footer>
            </>
          )}
        </>
      )}
      <InstitutionalFlows />
    </section>
  );
}
