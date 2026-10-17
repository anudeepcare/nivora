"use client";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useProduct, useResource } from "./Session";
import type { Enrichment } from "@/lib/enrichment";
import { dateLabel } from "@/lib/format";
import { Notice, Source } from "./Ui";
import GrowCompanyEvents from "./GrowCompany";
export default function CompanyEvents({ symbol }: { symbol: string }) {
  const { demo } = useProduct();
  const [allTransactions, setAllTransactions] = useState(false);
  const preview = useMemo(
    () =>
      demo
        ? ({
            symbol,
            profile: null,
            insiders: [],
            earnings: [],
            issues: [],
            retrievedAt: "2026-10-16",
            source: "Illustrative preview",
          } as Enrichment)
        : undefined,
    [demo, symbol],
  );
  const r = useResource<Enrichment>(
    symbol.includes("/") ? null : `enrichment/${encodeURIComponent(symbol)}`,
    preview,
    3600000,
  );
  if (symbol.includes("/")) return null;
  const today = r.data?.retrievedAt.slice(0, 10) ?? "";
  const upcoming = r.data?.earnings
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming?.[0];
  const trades =
    r.data?.insiders
      .filter((x) => allTransactions || ["P", "S"].includes(x.code))
      .sort((a, b) => b.date.localeCompare(a.date)) ?? [];
  return (
    <section className="events-section">
      <header className="section-heading">
        <div>
          <h2>Events & catalysts</h2>
          <p>The next scheduled report and recent insider transactions.</p>
        </div>
      </header>
      <GrowCompanyEvents symbol={symbol} />
      {r.error && <Notice>{r.error}</Notice>}
      {r.loading && !r.data && <p role="status">Loading company events…</p>}
      {r.data && (
        <>
          {r.data.issues.map((i) => (
            <Notice key={i}>{i}</Notice>
          ))}
          <section className="catalyst-strip">
            <CalendarDays size={24} />
            <div>
              <span className="eyebrow">NEXT SCHEDULED CATALYST</span>
              <h3>
                {next
                  ? `Earnings · ${dateLabel(next.date)}`
                  : "No upcoming earnings date returned"}
              </h3>
              <p>
                {next
                  ? `${next.hour === "bmo" ? "Before market open" : next.hour === "amc" ? "After market close" : "Time not confirmed"} · Provider schedule; date may change.`
                  : "The provider has not supplied a date within the next 90 days."}
              </p>
            </div>
            {next?.epsEstimate != null && (
              <div className="catalyst-estimate">
                <span>EPS estimate*</span>
                <strong>{next.epsEstimate.toFixed(2)}</strong>
              </div>
            )}
          </section>
          <div>
            <section className="panel">
              <header className="section-heading">
                <h3>Insider activity</h3>
                <div className="segment" aria-label="Insider activity filter">
                  <button
                    aria-pressed={!allTransactions}
                    onClick={() => setAllTransactions(false)}
                  >
                    Buys & sells
                  </button>
                  <button
                    aria-pressed={allTransactions}
                    onClick={() => setAllTransactions(true)}
                  >
                    All filings
                  </button>
                </div>
              </header>
              {trades.length ? (
                <div className="compact-records">
                  {trades.slice(0, 12).map((x, i) => (
                    <div className="event-record" key={`${x.filed}-${i}`}>
                      <div>
                        <strong>{x.name}</strong>
                        <small>
                          <span
                            className={
                              x.code === "P"
                                ? "green"
                                : x.code === "S"
                                  ? "red"
                                  : "muted"
                            }
                          >
                            {x.code === "P"
                              ? "Purchase"
                              : x.code === "S"
                                ? "Sale"
                                : x.action}
                          </span>{" "}
                          · {Math.abs(x.change).toLocaleString()} shares
                        </small>
                        <small>
                          {dateLabel(x.date)} · Filed {dateLabel(x.filed)}
                        </small>
                      </div>
                      <div className="event-price">
                        <strong>
                          {x.price?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) ?? "—"}
                        </strong>
                        <small>Reported price*</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  {allTransactions
                    ? "No insider transactions returned."
                    : "No purchases or sales returned for this period. Other transactions appear under All filings."}
                </p>
              )}
              <p className="footnote">
                P/S filings can include private transactions. Awards, exercises
                and tax withholding are separate. *Currency not supplied by this
                feed.
              </p>
            </section>
          </div>
          <p className="source-line">
            {r.data.source} · {dateLabel(r.data.retrievedAt)}
            {r.data.profile?.website && (
              <Source href={r.data.profile.website}>Company website</Source>
            )}
          </p>
        </>
      )}
    </section>
  );
}
