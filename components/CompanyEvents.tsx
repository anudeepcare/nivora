"use client";
import { useMemo } from "react";
import { useProduct, useResource } from "./Session";
import type { Enrichment } from "@/lib/enrichment";
import { dateLabel } from "@/lib/format";
import { Notice, Source } from "./Ui";
export default function CompanyEvents({ symbol }: { symbol: string }) {
  const { demo } = useProduct(),
    preview = useMemo(
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
    ),
    r = useResource<Enrichment>(
      symbol.includes("/") ? null : `enrichment/${encodeURIComponent(symbol)}`,
      preview,
      3600000,
    );
  if (symbol.includes("/")) return null;
  return (
    <section className="support">
      <header className="section-heading">
        <div>
          <h2>Earnings & insider activity</h2>
          <p>Reported events and provider estimates stay separate.</p>
        </div>
      </header>
      {r.error && <Notice>{r.error}</Notice>}
      {r.loading && !r.data && <p role="status">Loading company events…</p>}
      {r.data && (
        <>
          {r.data.issues.map((i) => (
            <Notice key={i}>{i}</Notice>
          ))}
          {r.data.profile && (
            <p className="source-line">
              {r.data.profile.industry}{" "}
              {r.data.profile.website && (
                <Source href={r.data.profile.website}>Company website</Source>
              )}
            </p>
          )}
          <div className="two-col">
            <section className="panel">
              <h3>Earnings calendar</h3>
              {r.data.earnings.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>EPS reported*</th>
                        <th>EPS estimate*</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.data.earnings.map((e, i) => (
                        <tr key={`${e.date}-${i}`}>
                          <td>
                            {dateLabel(e.date)}
                            <small className="table-detail">
                              {e.epsActual == null
                                ? "Scheduled / estimate"
                                : "Reported"}
                            </small>
                          </td>
                          <td>{e.epsActual?.toFixed(2) ?? "—"}</td>
                          <td>{e.epsEstimate?.toFixed(2) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No earnings observations returned.</p>
              )}
              <p className="footnote">
                *As reported by Finnhub; reporting currency is not specified by
                this feed. Estimates can change.
              </p>
            </section>
            <section className="panel">
              <h3>Reported insider transactions</h3>
              {r.data.insiders.length ? (
                <div className="compact-records">
                  {r.data.insiders.slice(0, 12).map((x, i) => (
                    <div className="event-record" key={`${x.filed}-${i}`}>
                      <div>
                        <strong>{x.name}</strong>
                        <small>
                          {x.action} · {Math.abs(x.change).toLocaleString()}{" "}
                          shares
                        </small>
                        <small>
                          Transaction {dateLabel(x.date)} · filed{" "}
                          {dateLabel(x.filed)}
                        </small>
                      </div>
                      <span className="event-price">
                        {x.price?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? "—"}
                        <small>Reported price*</small>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No transactions returned for this period.
                </p>
              )}
              <p className="footnote">
                *Transaction currency is not specified by this feed. Grants,
                exercises and tax withholding are not classified as open-market
                purchases. Transactions do not establish intent or future
                returns.
              </p>
            </section>
          </div>
          <p className="footnote">
            {r.data.source} · retrieved {dateLabel(r.data.retrievedAt)}.
            Schedules and estimates can change; institutional holdings and
            options positioning require separate coverage.
          </p>
        </>
      )}
    </section>
  );
}
