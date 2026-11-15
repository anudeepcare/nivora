"use client";
import { Help } from "./Ui";
import type { Research } from "@/lib/types";
import { amount, dateLabel } from "@/lib/format";
import { consensusOutlook } from "@/lib/outlook";
export default function AnalystRatings({
  research: r,
  hideConsensus = false,
}: {
  research: Research;
  hideConsensus?: boolean;
}) {
  const c = r.evidence?.consensus,
    outlook = consensusOutlook(r);
  const rows = [
    ["Strong buy", c?.strongBuy, "var(--green)"],
    ["Buy", c?.buy, "var(--blue)"],
    ["Hold", c?.hold, "var(--amber)"],
    ["Sell", c?.sell, "var(--red)"],
    ["Strong sell", c?.strongSell, "var(--red)"],
  ] as const;
  const known = rows.filter(([, n]) => n != null && n >= 0),
    total = known.reduce((sum, [, n]) => sum + (n ?? 0), 0);
  if (hideConsensus && c?.rating == null && !known.length)
    return (
      <aside
        className="analyst-workspace analyst-empty"
        aria-label="Analyst rating coverage"
      >
        <h3>Rating coverage</h3>
        <p>Ratings unavailable.</p>
        <small>Updated {dateLabel(r.retrievedAt)}</small>
      </aside>
    );
  return (
    <section className="analyst-workspace depth-analysts">
      <div className="analyst-summary">
        {!hideConsensus && (
          <div>
            <span>Analyst consensus</span>
            <strong>
              {outlook ? amount(outlook.target, r.quote.currency) : "—"}
            </strong>
            <small>
              Analyst opinion{" "}
              <Help label="Consensus details">
                Separate from AURYN model valuation. Updated{" "}
                {dateLabel(outlook?.asOf)}.
              </Help>
            </small>
          </div>
        )}
        <div>
          <span>Published rating score</span>
          <strong>{c?.rating == null ? "—" : c.rating.toFixed(2)}</strong>
          <Help label="Rating scale">
            Published score; the scale is not supplied and has not been
            inferred.
          </Help>
        </div>
        <div>
          <span>Reported recommendations</span>
          <strong>{known.length ? total : "—"}</strong>
          <Help label="Recommendation count">
            Recommendations may include more than one view from the same
            analyst.
          </Help>
        </div>
      </div>
      <div className="analyst-opinions">
        <header>
          <span className="eyebrow">THE SPREAD OF OPINION</span>
          <h3>Recommendation distribution</h3>
        </header>
        {known.length ? (
          <div className="rating-distribution">
            {rows.map(([label, n, color]) => (
              <div key={label}>
                <span>{label}</span>
                <div className="rating-track">
                  <i
                    style={{
                      width: `${n != null && total > 0 ? (n / total) * 100 : 0}%`,
                      background: color,
                    }}
                  />
                </div>
                <span className="analyst-count">
                  <b>{n ?? "—"}</b>
                  {n != null && total > 0 && (
                    <small>{Math.round((n / total) * 100)}%</small>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Recommendation counts are not supplied for this instrument.
          </p>
        )}
      </div>
      <Help label="Ratings dates and limitations">
        Updated {dateLabel(r.evidence?.updatedAt)}. Individual publication dates
        and revisions are not supplied. Analyst opinions are not intrinsic fair
        value or guaranteed returns.
      </Help>
    </section>
  );
}
