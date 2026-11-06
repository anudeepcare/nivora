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
          <h2>What deserves another look?</h2>
        </div>
      </header>
      {review ? (
        <>
          <h3>{review.label}</h3>
          <p>
            Report date {dateLabel(review.date)} · EPS{" "}
            {review.actual?.toFixed(2) ?? "pending"} versus estimate{" "}
            {review.estimate?.toFixed(2) ?? "unavailable"}
            {review.surprise !== null
              ? ` · ${percent(review.surprise, true)} surprise`
              : ""}
            .
          </p>
          <p className="small muted">
            Actual and estimate use the supplied series; GAAP/adjusted basis is
            not independently reconciled. An EPS beat does not establish
            guidance, revenue performance or a future price move.
          </p>
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
      <p>
        Check guidance, cash conversion and share dilution against the original
        release. AURYN does not infer whether your written thesis is confirmed.
      </p>
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
