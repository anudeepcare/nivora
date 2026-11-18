"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { ownershipLinks } from "@/lib/research-visual-evidence";
import s from "./OwnershipEvidenceMap.module.css";
export default function OwnershipEvidenceMap({
  symbol,
  data,
}: {
  symbol: string;
  data: unknown;
}) {
  const model = ownershipLinks(data, symbol),
    [expanded, setExpanded] = useState(false);
  const visible = model.rows.slice(0, expanded ? 12 : 6);
  if (!visible.length) return null;
  // One scale across all returned holders; expanding rows cannot resize the bars.
  const maximum = Math.max(1, ...model.rows.map((row) => row.ownership ?? 0));
  const format = (v: number) =>
    v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <section
      className={s.root}
      aria-label="Reported institutional relationships"
    >
      <header className={s.header}>
        <div>
          <Building2 size={20} aria-hidden="true" />
          <h3>Reported ownership comparison</h3>
        </div>
        <span>
          {symbol} · Reported {model.asOf}
        </span>
      </header>
      <p className={s.description}>
        Share of the same share class, as reported. Bar length compares
        ownership, not buying activity.
      </p>
      <div className={s.axis} aria-hidden="true">
        <div>
          <span>0%</span>
          <span>{format(maximum)}% of share class</span>
        </div>
      </div>
      <div className={s.rows}>
        {visible.map((row) => (
          <article className={s.row} key={row.name}>
            <div className={s.identity}>
              <strong>{row.name}</strong>
              {row.category && <small>{row.category.toLowerCase()}</small>}
            </div>
            <div className={s.plot}>
              {row.ownership === null ? (
                <span className={s.missing}>Not supplied</span>
              ) : (
                <div
                  className={s.track}
                  role="meter"
                  aria-label={`${row.name}: reported ownership`}
                  aria-valuemin={0}
                  aria-valuemax={maximum}
                  aria-valuenow={row.ownership}
                  aria-valuetext={`${format(row.ownership)}% of share class; comparison axis 0 to ${format(maximum)}%`}
                >
                  <span
                    style={{ width: `${(row.ownership / maximum) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <strong className={s.value}>
              {row.ownership === null ? "—" : `${format(row.ownership)}%`}
            </strong>
          </article>
        ))}
      </div>
      {model.rows.length > 6 && (
        <button
          className={s.expand}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show six holders"
            : `Show ${Math.min(12, model.rows.length)} holders`}
        </button>
      )}
      <p className={s.footnote}>
        Showing {visible.length} of {model.rows.length} returned institutions,
        not the full ownership universe. Percentages are not summed. Delayed
        disclosures do not establish current buying, control or a return
        forecast.
      </p>
    </section>
  );
}
