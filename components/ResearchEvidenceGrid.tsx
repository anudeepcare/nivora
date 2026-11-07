"use client";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { useMemo } from "react";
import { Building2, Scale, Activity, Users, ArrowUpRight } from "lucide-react";
import type { Research } from "@/lib/types";
import type { EvidenceSection } from "@/lib/approved-research";
import { overviewEvidence } from "@/lib/overview-evidence";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import s from "./ResearchEvidenceGrid.module.css";
export default function ResearchEvidenceGrid({
  research,
  onTab,
}: {
  research: Research;
  onTab: (tab: EvidenceSection) => void;
}) {
  const { preferences } = useWorkspacePreferences();
  const evidence = useMemo(() => overviewEvidence(research), [research]);
  const groups = [
    {
      name: "Business quality",
      key: "business",
      icon: Building2,
      rows: evidence.business,
      tab: "Financials" as const,
    },
    {
      name: "Valuation",
      key: "valuation",
      icon: Scale,
      rows: evidence.valuation,
      tab: "Valuation" as const,
    },
    {
      name: "Technical conditions",
      key: "technical",
      icon: Activity,
      rows: evidence.technical,
      tab: "Technicals" as const,
    },
    {
      name: "Ownership",
      key: "ownership",
      icon: Users,
      rows: evidence.ownership,
      tab: "Thesis" as const,
    },
  ]
    .filter(({ key }) =>
      preferences.visibleMetrics.includes(key === "technical" ? "price" : key),
    )
    .filter(
      ({ tab }) =>
        !evidence.crypto || (tab !== "Financials" && tab !== "Valuation"),
    );
  return (
    <section className={s.grid} aria-label="Research evidence at a glance">
      {groups.map(({ name, key, icon: Icon, rows, tab }) => (
        <article key={key} data-category={key} className={s.panel}>
          <header>
            <span className={s.icon}>
              <Icon size={18} />
            </span>
            <h3>{name}</h3>
            <button aria-label={`Open ${name}`} onClick={() => onTab(tab)}>
              <ArrowUpRight size={17} />
            </button>
          </header>
          {rows.length ? (
            <dl>
              {rows.slice(0, 3).map((row) => (
                <div key={row.key}>
                  <dt>
                    <Help label={row.label} trigger={row.label}>
                      {row.help}
                      {row.period && <p>Period: {dateLabel(row.period)}</p>}
                    </Help>
                  </dt>
                  <dd data-tone={row.tone}>
                    {row.unit === "money"
                      ? amount(row.value, row.currency, true)
                      : row.unit === "percent"
                        ? percent(row.value)
                        : row.unit === "ratio"
                          ? `${row.value.toFixed(1)}×`
                          : row.value.toFixed(1)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={s.empty}>
              {evidence.crypto && (key === "business" || key === "ownership")
                ? "Company fundamentals do not apply to this asset."
                : "No comparable evidence available."}
            </p>
          )}
          <footer>
            {key === "business"
              ? `Reported period · ${dateLabel(evidence.period)}`
              : key === "technical"
                ? `Price history · ${dateLabel(research.history.at(-1)?.time)}`
                : `Snapshot · ${dateLabel(research.evidence?.updatedAt || research.retrievedAt)}`}
          </footer>
        </article>
      ))}
    </section>
  );
}
