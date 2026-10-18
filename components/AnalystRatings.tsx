"use client";
import type { Research } from "@/lib/types";
import { amount, dateLabel } from "@/lib/format";
import { consensusOutlook } from "@/lib/outlook";
export default function AnalystRatings({
  research: r,
}: {
  research: Research;
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
  return (
    <section className="analyst-workspace">
      <div className="analyst-summary">
        <div>
          <span>Analyst consensus</span>
          <strong>
            {outlook ? amount(outlook.target, r.quote.currency) : "—"}
          </strong>
          <small>Opinion, separate from model valuation</small>
        </div>
        <div>
          <span>Published rating score</span>
          <strong>{c?.rating == null ? "—" : c.rating.toFixed(2)}</strong>
          <small>Provider scale; no scale inferred</small>
        </div>
        <div>
          <span>Reported recommendations</span>
          <strong>{known.length ? total : "—"}</strong>
          <small>Not necessarily unique analysts</small>
        </div>
      </div>
      <h3>Recommendation distribution</h3>
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
              <b>{n ?? "—"}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">
          Recommendation counts are not supplied for this instrument.
        </p>
      )}
      <p className="small muted">
        Dataset retrieved {dateLabel(r.evidence?.updatedAt || r.retrievedAt)}.
        Rating publication dates, revision history and target ranges are not
        supplied by this snapshot. They are not inferred. A consensus target is
        not intrinsic fair value.
      </p>
    </section>
  );
}
