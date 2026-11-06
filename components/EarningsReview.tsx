"use client";
import type { Research } from "@/lib/types";
import { latestFinancialEvidence } from "@/lib/analysis";
import { earningsReview, earningsThesisChecks } from "@/lib/earnings-review";
import { dateLabel, percent } from "@/lib/format";
import EarningsPrep from "./EarningsPrep";
import { useProduct, useResource } from "./Session";
export default function EarningsReview({
  research: r,
}: {
  research: Research;
}) {
  const { demo } = useProduct();
  const notes = useResource<{
    documents: { key: string; body: { condition?: string; thesis?: string } }[];
  }>("documents?kind=note", demo ? { documents: [] } : undefined);
  const review = earningsReview(
    r.evidence?.earnings ?? [],
    r.retrievedAt.slice(0, 10),
  );
  const financial = latestFinancialEvidence(r);
  const checks = earningsThesisChecks(financial.latest, financial.prior);
  const note = notes.data?.documents.find(
    (x) => x.key === r.company.symbol,
  )?.body;
  return (
    <section className="earnings-review card">
      <header className="section-head">
        <div>
          <span className="eyebrow">EARNINGS TO THESIS</span>
          <h2>Earnings snapshot</h2>
        </div>
      </header>
      {review ? (
        <>
          <h3>{review.label}</h3>
          <p className="small muted">{dateLabel(review.date)} · Reported EPS</p>
          <dl className="earnings-kpis"><div><dt>Actual</dt><dd>{review.actual?.toFixed(2) ?? "Pending"}</dd></div><div><dt>Estimate</dt><dd>{review.estimate?.toFixed(2) ?? "Unavailable"}</dd></div><div><dt>Surprise</dt><dd className={review.surprise !== null && review.surprise < 0 ? "negative" : ""}>{review.surprise !== null ? percent(review.surprise,true) : "Unavailable"}</dd></div></dl>
          <p className="small muted">Reported series; GAAP/adjusted basis not reconciled. EPS alone does not confirm the business case.</p>
        </>
      ) : (
        <p>Recent reported results are not available in this snapshot.</p>
      )}
      {checks.length > 0 && <section><h3>Evidence to revisit</h3><p className="small muted">{financial.periodBasis} periods ending {dateLabel(financial.latest?.end)} and {dateLabel(financial.prior?.end)}. These may predate the earnings announcement above.</p><ul>{checks.map(check=><li key={check}>{check}</li>)}</ul></section>}
      {note?.condition && (
        <blockquote>
          <strong>Your review trigger</strong>
          <p>{note.condition}</p>
        </blockquote>
      )}
      {note?.thesis && (
        <details>
          <summary>Your saved research case</summary>
          <p>{note.thesis}</p>
        </details>
      )}

      {r.filings
        .slice(0, 3)
        .filter((f) => /^https:\/\//.test(f.url))
        .map((f) => (
          <p key={f.url}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              Open filing evidence ↗
            </a>
          </p>
        ))}
      {notes.error && (
        <p className="small muted">Your saved research could not be loaded.</p>
      )}
      <details>
        <summary>Prepare for the next report</summary>
        <EarningsPrep research={r} />
      </details>
    </section>
  );
}
