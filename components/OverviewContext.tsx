"use client";
import type { Research } from "@/lib/types";
import { consensusOutlook, researchOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
export default function OverviewContext({
  research: r,
}: {
  research: Research;
}) {
  const c = consensusOutlook(r),
    model = researchOutlook(r);
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <aside
      className="overview-context"
      aria-label="Price context and next report"
    >
      <h3>Price context</h3>
      <div className="overview-consensus">
        <div>
          <span>Analyst consensus</span>
          <strong>{c ? amount(c.target, r.quote.currency) : "—"}</strong>
        </div>
        <div>
          <span>Gap to consensus</span>
          <strong className={c && c.change < 0 ? "negative" : "positive"}>
            {c ? percent(c.change, true) : "—"}
          </strong>
        </div>
      </div>
      <p className="small muted">
        Analyst opinion; target horizon not supplied.
      </p>
      {model.available ? (
        <>
          <h3>Scenario snapshot</h3>
          <div className="overview-cases">
            {model.cases.map((x, i) => (
              <div key={x.name}>
                <span
                  className={
                    i === 0 ? "negative" : i === 2 ? "positive" : "blue"
                  }
                >
                  {x.name}
                </span>
                <b>{amount(x.target, model.currency)}</b>
                <small className={x.change < 0 ? "negative" : "positive"}>
                  {percent(x.change, true)}
                </small>
              </div>
            ))}
          </div>
          <p className="small muted">
            Model sensitivity · ends {dateLabel(model.end)}. Assumptions and
            limitations are in Value.
          </p>
        </>
      ) : (
        <p className="small muted">
          Scenarios need comparable forecast and valuation inputs. See Value for
          coverage.
        </p>
      )}
      <div className="overview-next">
        <span>Next earnings report</span>
        <b>{next ? dateLabel(next.date) : "Date not supplied"}</b>
      </div>
    </aside>
  );
}
