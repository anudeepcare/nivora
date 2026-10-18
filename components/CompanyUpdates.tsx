"use client";
import type { Research } from "@/lib/types";
import { dateLabel } from "@/lib/format";
import { NewsAndFilings } from "./ResearchEvidence";
export default function CompanyUpdates({
  research: r,
}: {
  research: Research;
}) {
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <>
      {" "}
      <section className="research-updates company-updates">
        <header className="section-head">
          <div>
            <h2>Events & insider activity</h2>
            <p>
              Reported transactions and scheduled earnings; neither is a
              standalone buy signal.
            </p>
          </div>
        </header>
        <div className="grid2">
          <div>
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
          <div>
            <h3>Reported insider activity</h3>
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
                      ? "—"
                      : Math.abs(item.change).toLocaleString()}{" "}
                    shares
                  </strong>
                </div>
              ))
            ) : (
              <p className="context-note">No insider records supplied.</p>
            )}
            <p className="context-note">
              Sales can reflect tax, diversification or trading plans.
              Transaction codes and filing dates matter.
            </p>
          </div>
        </div>
      </section>
      <NewsAndFilings research={r} />
    </>
  );
}
