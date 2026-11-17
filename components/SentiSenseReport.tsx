"use client";
import { useState } from "react";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import type { ResearchReport } from "@/lib/sentisense-report";
import { useResource } from "./Session";
import s from "./SentiSensePanels.module.css";
export default function SentiSenseReport({ symbol }: { symbol: string }) {
  const resource = useResource<SentiSenseResult>(
    `intelligence/${encodeURIComponent(symbol)}?dataset=aiReport`,
    undefined,
    300000,
  );
  const [selected, setSelected] = useState(0);
  const report =
    resource.data?.status === "available"
      ? (resource.data.data as ResearchReport | null)
      : null;
  const section = report?.sections[selected] ?? report?.sections[0];
  return (
    <div className={s.content}>
      <div className={s.intro}>
        <h3>Company research report</h3>
        <p>
          AI-authored analysis, separate from analyst targets and calculated
          scenarios.
        </p>
      </div>
      {resource.loading ? (
        <p role="status">Loading research report…</p>
      ) : resource.error ? (
        <div>
          <p role="status">{resource.error}</p>
          <button type="button" onClick={resource.refresh}>
            Retry report
          </button>
        </div>
      ) : !report || !section ? (
        <p role="status">
          A completed research report is not available for {symbol}. No
          substitute report is shown.
        </p>
      ) : (
        <>
          <label>
            Report section{" "}
            <select
              className={s.reportSelect}
              value={report.sections.indexOf(section)}
              onChange={(e) => setSelected(Number(e.target.value))}
              aria-label="Report section"
            >
              {report.sections.map((item, index) => (
                <option key={item.title} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <article aria-label={section.title}>
            <h4>{section.title}</h4>
            <div
              key={section.title}
              className={s.reportText}
              role="region"
              aria-label={`${section.title} report text`}
              tabIndex={0}
            >
              {section.text}
            </div>
          </article>
          <footer className={s.provenance}>
            Report updated {report.updatedAt.slice(0, 16).replace("T", " ")} UTC
          </footer>
        </>
      )}
    </div>
  );
}
