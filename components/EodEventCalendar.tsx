"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { CalendarKind, CorporateCalendar } from "@/lib/eod-calendar";
import s from "./SentiSensePanels.module.css";
const price = (n: number | null, currency: string | null) =>
  n === null
    ? "Not set"
    : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;
export default function EodEventCalendar({
  preview = false,
}: {
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [kind, setKind] = useState<CalendarKind>("ipos"),
    [days, setDays] = useState(7);
  const resource = useResource<CorporateCalendar>(
    open && !preview ? `corporate-calendar?kind=${kind}&days=${days}` : null,
    undefined,
    900000,
  );
  if (preview) return null;
  return (
    <section className={s.panel} aria-label="Corporate events calendar">
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>MARKET CALENDAR</span>
          <h2>What is coming to market?</h2>
        </div>
        <button
          type="button"
          className="text-button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close calendar" : "Open calendar"}
        </button>
      </header>
      {open && (
        <>
          <nav className={s.tabs} aria-label="Corporate event filters">
            {(["ipos", "splits"] as const).map((k) => (
              <button
                type="button"
                key={k}
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
              >
                {k === "ipos" ? "IPO pipeline" : "Stock splits"}
              </button>
            ))}
            {[7, 30].map((d) => (
              <button
                type="button"
                key={d}
                aria-pressed={days === d}
                onClick={() => setDays(d)}
              >
                Next {d} days
              </button>
            ))}
          </nav>
          <p className={s.state}>
            {kind === "ipos"
              ? "Expected, filed, amended and priced deals are different stages. Dates and ranges can change; an unset price is not zero."
              : "Ratios read old shares → new shares. Reverse splits are shown explicitly. This is not a return forecast."}
          </p>
          {resource.loading ? (
            <p role="status">Loading corporate events…</p>
          ) : resource.error ? (
            <p role="status">{resource.error}</p>
          ) : (
            resource.data && (
              <>
                <div className={s.records}>
                  {resource.data.rows.length === 0 ? (
                    <p>
                      No events returned in this window. This does not establish
                      complete market coverage.
                    </p>
                  ) : (
                    resource.data.rows.map((row, i) => (
                      <article
                        className={s.record}
                        key={`${row.symbol}:${row.date}:${i}`}
                      >
                        <header>
                          <h5>
                            {row.researchSymbol ? (
                              <Link
                                href={`/research/${encodeURIComponent(row.researchSymbol)}`}
                              >
                                {row.name ?? row.symbol} ↗
                              </Link>
                            ) : (
                              (row.name ?? row.symbol)
                            )}
                          </h5>
                          <time>{row.date}</time>
                        </header>
                        <dl className={s.metrics}>
                          <div>
                            <dt>Listing</dt>
                            <dd>{row.symbol}</dd>
                          </div>
                          <div>
                            <dt>Stage</dt>
                            <dd>{row.status}</dd>
                          </div>
                          {kind === "ipos" ? (
                            <>
                              <div>
                                <dt>Indicated range</dt>
                                <dd>
                                  {price(row.priceLow, row.currency)} –{" "}
                                  {price(row.priceHigh, row.currency)}
                                </dd>
                              </div>
                              <div>
                                <dt>Final offer</dt>
                                <dd>{price(row.offerPrice, row.currency)}</dd>
                              </div>
                              <div>
                                <dt>Shares offered</dt>
                                <dd>
                                  {row.shares?.toLocaleString() ??
                                    "Not supplied"}
                                </dd>
                              </div>
                            </>
                          ) : (
                            <div>
                              <dt>Old → new shares</dt>
                              <dd>{row.ratio ?? "Not supplied"}</dd>
                            </div>
                          )}
                        </dl>
                      </article>
                    ))
                  )}
                </div>
                <footer className={s.provenance}>
                  <span>
                    {resource.data.from} to {resource.data.to}
                  </span>
                  <span>
                    {resource.data.rows.length} shown of {resource.data.total}{" "}
                    returned
                  </span>
                  <span>
                    Retrieved{" "}
                    {resource.data.retrievedAt.slice(0, 19).replace("T", " ")}{" "}
                    UTC
                  </span>
                </footer>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
