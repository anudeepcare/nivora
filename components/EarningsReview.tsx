"use client";
import "./ResearchEvidenceDisclosures.css";
import type { Research } from "@/lib/types";
import { earningsReview, annualThesisBridge } from "@/lib/earnings-review";
import { dateLabel, percent } from "@/lib/format";
import { researchPeriods } from "@/lib/financial-catalog";
import { Source } from "./Ui";
import { earningsCalendar } from "@/lib/earnings-calendar";
export default function EarningsReview({
  research: r,
  now = Date.now(),
  contextOnly = false,
}: {
  research: Research;
  now?: number;
  contextOnly?: boolean;
}) {
  const bridge = annualThesisBridge(
    researchPeriods(r, "annual"),
    r.retrievedAt.slice(0, 10),
  );
  const businessChanges = (
    <details data-research-disclosure>
      <summary>Annual filing comparison</summary>
      {bridge ? (
        <>
          <p className="small muted">
            Annual periods {dateLabel(bridge.prior.end)} →{" "}
            {dateLabel(bridge.latest.end)} · {bridge.latest.currency} ·{" "}
            {bridge.latest.basis}. These filings may predate the earnings
            results.
          </p>
          <ul>
            {bridge.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p className="small muted">
            Reported changes are prompts to revisit your thesis, not proof of a
            lasting trend or a buy/sell signal.
          </p>
          <Source href={bridge.latest.sourceUrl}>
            Latest filing · {dateLabel(bridge.latest.filed)}
          </Source>{" "}
          <Source href={bridge.prior.sourceUrl}>
            Comparison filing · {dateLabel(bridge.prior.filed)}
          </Source>
        </>
      ) : (
        <p>
          Comparable filed annual evidence is unavailable. An EPS surprise alone
          does not establish a change in the business thesis.
        </p>
      )}
    </details>
  );
  if (contextOnly) return businessChanges;
  const review = earningsReview(
    r.evidence?.earnings ?? [],
    r.retrievedAt.slice(0, 10),
  );
  const nextReport = earningsCalendar(r, now).next?.date;
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
      {businessChanges}
      {nextReport && (
        <p className="small muted">Next report · {dateLabel(nextReport)}</p>
      )}
    </section>
  );
}
