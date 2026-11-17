"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { ownershipLinks } from "@/lib/research-visual-evidence";
import s from "./ResearchVisualEvidence.module.css";
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
  return (
    <section
      className={s.panel}
      aria-label="Reported institutional relationships"
    >
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>REPORTED RELATIONSHIPS</span>
          <h3>Institutional ownership map</h3>
        </div>
        <span className={s.subtle}>As of {model.asOf}</span>
      </header>
      <div className={s.network}>
        <div className={s.hub}>
          <Building2 size={20} />
          <strong>{symbol}</strong>
          <span>{model.rows.length} supplied holders</span>
        </div>
        <div className={s.branches}>
          {visible.map((row) => (
            <article className={s.holder} key={row.name}>
              <span className={s.holderIcon}>
                <Building2 size={16} />
              </span>
              <div>
                <strong>{row.name}</strong>
                {row.category && <small>{row.category.toLowerCase()}</small>}
              </div>
              <span className={s.weight}>
                {row.ownership === null
                  ? "—"
                  : row.ownership.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    }) + "%"}
                <small>share class</small>
              </span>
            </article>
          ))}
        </div>
      </div>
      {model.rows.length > 6 && (
        <button className={s.expand} onClick={() => setExpanded(!expanded)}>
          {expanded
            ? "Show six holders"
            : `Show ${Math.min(12, model.rows.length)} holders`}
        </button>
      )}
      <p className={s.footnote}>
        Showing {visible.length} of {model.rows.length} returned institutions,
        not the full ownership universe. Equal links indicate reported holdings,
        not strength, control or relationships between institutions. Percentages
        appear only when supplied.
      </p>
    </section>
  );
}
