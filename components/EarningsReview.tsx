"use client";
import type { Research } from "@/lib/types";
import { earningsReview } from "@/lib/earnings-review";
import { dateLabel, percent } from "@/lib/format";
import { researchDecision } from "@/lib/decision-research";
export default function EarningsReview({
  research: r,
}: {
  research: Research;
}) {
  const review = earningsReview(
    r.evidence?.earnings ?? [],
    r.retrievedAt.slice(0, 10),
  );
  const nextReport = researchDecision(r).nextReport;
  return (
    <section className="earnings-review card">
      <header className="section-head">
        <div>
          <h2>Earnings snapshot</h2>
        </div>
      </header>
      {review ? (
        <>
          <h3>{review.label}</h3>
          <p className="small muted">{dateLabel(review.date)} · Reported EPS</p>
          <dl className="earnings-kpis">
            <div>
              <dt>Actual</dt>
              <dd>{review.actual?.toFixed(2) ?? "Pending"}</dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd>{review.estimate?.toFixed(2) ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Surprise</dt>
              <dd
                className={
                  review.surprise !== null && review.surprise < 0
                    ? "negative"
                    : ""
                }
              >
                {review.surprise !== null
                  ? percent(review.surprise, true)
                  : "Unavailable"}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p>Recent reported results are not available in this snapshot.</p>
      )}
      {nextReport && (
        <p className="small muted">Next report · {dateLabel(nextReport)}</p>
      )}
    </section>
  );
}
