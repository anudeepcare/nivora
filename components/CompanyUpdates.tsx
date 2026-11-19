"use client";
import type { ReactNode } from "react";
import type { Research } from "@/lib/types";
import { dateLabel } from "@/lib/format";

import { NewsAndFilings } from "./ResearchEvidence";
export default function CompanyUpdates({
  research: r,
  preview = false,
  children,
}: {
  research: Research;
  preview?: boolean;
  children?: ReactNode;
}) {
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <div className="depth-news">
      <NewsAndFilings research={r} />
      <aside className="news-context-column">
        {children}
        <section className="research-updates company-updates">
          <header className="section-head">
            <div>
              <h2>Events & reported transactions</h2>
            </div>
          </header>
          <div className="news-event-layout">
            <div className="news-next-report">
              <h3>Next scheduled earnings</h3>
              <p className="context-note">
                {next ? dateLabel(next.date) : "No upcoming date supplied"}
              </p>
              {next?.estimate != null && (
                <p>
                  EPS estimate {next.estimate.toFixed(2)}
                  <small className="muted">
                    {" "}
                    · Estimate currency and accounting basis not supplied
                  </small>
                </p>
              )}
            </div>
            <div className="news-transaction-list">
              <h3>Reported transactions</h3>
              {r.evidence?.insiders?.length ? (
                r.evidence.insiders.slice(0, 4).map((item, i) => (
                  <div className="stat-pair" key={i}>
                    <span>
                      {item.name}
                      <small className="muted">
                        {" "}
                        · {dateLabel(item.date)} ·{" "}
                        {item.code === "S"
                          ? "Sale"
                          : item.code === "P"
                            ? "Purchase"
                            : `Code ${item.code}`}
                      </small>
                    </span>
                    <strong>
                      {item.change == null
                        ? "Quantity not supplied"
                        : Math.abs(item.change).toLocaleString()}{" "}
                      {item.change != null ? "shares" : ""}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="context-note">No transaction records supplied.</p>
              )}
              <details className="transaction-note">
                <summary>About reported activity</summary>
                <p>
                  Sales can reflect tax, diversification or trading plans.
                  Roles, transaction codes and filing dates need verification;
                  this snapshot does not establish that every named person is a
                  company insider.
                </p>
              </details>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
