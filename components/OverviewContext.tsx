"use client";
import type { Research } from "@/lib/types";
import { consensusOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
export default function OverviewContext({
  research: r,
}: {
  research: Research;
}) {
  const c = consensusOutlook(r);
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
          <strong
            className={
              c && c.change != null && c.change < 0 ? "negative" : "positive"
            }
          >
            {c ? percent(c.change, true) : "—"}
          </strong>
        </div>
      </div>
      <p className="small muted">
        Analyst opinion; target horizon not supplied.
      </p>
      <p className="small muted">
        Fair value is not established by a forecast-multiple sensitivity.
        Inspect operating and funding assumptions in Value.
      </p>
      <div className="overview-next">
        <span>Next earnings report</span>
        <b>{next ? dateLabel(next.date) : "Date not supplied"}</b>
      </div>
    </aside>
  );
}
