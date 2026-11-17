"use client";
import { useState } from "react";
import type { SentiSenseDataset, SentiSenseResult } from "@/lib/sentisense-api";
import { intelligenceView } from "@/lib/sentisense-view";
import { useResource } from "./Session";
import SentiSenseConsensus from "./SentiSenseConsensus";
import s from "./SentiSensePanels.module.css";
const groups = {
  analysts: [
    ["consensus", "Consensus"],
    ["estimates", "Estimates"],
    ["consensusHistory", "Revisions"],
    ["analystActions", "Analyst actions"],
    ["analystCoverage", "Coverage"],
  ],
  ownership: [
    ["holders", "Institutions"],
    ["ownershipHistory", "Ownership history"],
    ["insiders", "Insiders"],
    ["politicians", "Public officials"],
    ["stockEtfs", "Fund exposure"],
    ["float", "Free float"],
  ],
  events: [
    ["earnings", "Earnings reports"],
    ["earningsReactions", "Market reactions"],
    ["filingChanges", "Filing changes"],
    ["documents", "Publications"],
  ],
  options: [
    ["options", "Positioning"],
    ["optionsHistory", "Daily history"],
    ["optionsIntraday", "Intraday snapshots"],
  ],
  indicators: [
    ["kpis", "Company KPIs"],
    ["kpiTypes", "Metric catalog"],
    ["profile", "Company profile"],
    ["fundamentalsCurrent", "Trailing profile"],
    ["fundamentalsQuarterly", "Quarterly statements"],
    ["fundamentalsAnnual", "Annual statements"],
    ["shortInterest", "Short interest"],
    ["shortVolume", "Short-sale volume"],
  ],
} as const;
export type SentiSenseGroupName = keyof typeof groups;
export default function SentiSensePanels({
  symbol,
  group,
  preview = false,
}: {
  symbol: string;
  group: SentiSenseGroupName;
  preview?: boolean;
}) {
  const choices = groups[group];
  const [selection, setSelection] = useState<string>(choices[0][0]);
  const dataset = (
    choices.some(([id]) => id === selection) ? selection : choices[0][0]
  ) as SentiSenseDataset;
  if (preview) return null;
  return (
    <section className={s.panel} aria-label="SentiSense research">
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>RESEARCH INTELLIGENCE</span>
          <h2>Go beyond the price</h2>
        </div>
        <span className={s.provider}>SentiSense</span>
      </header>
      <nav className={s.tabs} aria-label={`${group} intelligence datasets`}>
        {choices.map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={dataset === id}
            onClick={() => setSelection(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {dataset === "consensus" ? (
        <SentiSenseConsensus symbol={symbol} preview={false} />
      ) : (
        <Dataset
          key={`${symbol}:${dataset}`}
          symbol={symbol}
          dataset={dataset}
        />
      )}
    </section>
  );
}
function Dataset({
  symbol,
  dataset,
}: {
  symbol: string;
  dataset: SentiSenseDataset;
}) {
  const resource = useResource<SentiSenseResult>(
    `intelligence/${encodeURIComponent(symbol)}?dataset=${dataset}`,
    undefined,
    60_000,
  );
  const result = resource.data;
  const available =
    result?.status === "available" || result?.status === "preview";
  const view = intelligenceView(dataset, result?.data);
  const count = view.groups.reduce((n, g) => n + g.rows.length, 0);
  return (
    <div className={s.content}>
      <div className={s.intro}>
        <h3>{view.title}</h3>
        <p>{view.note}</p>
      </div>
      {resource.loading ? (
        <p className={s.state} role="status">
          Loading {view.title.toLowerCase()}…
        </p>
      ) : resource.error ? (
        <p className={s.state} role="status">
          {resource.error}
        </p>
      ) : !available ? (
        <p className={s.state} role="status">
          This dataset is {result?.status.replaceAll("-", " ") ?? "unavailable"}{" "}
          for {symbol}. No substitute records are shown.
        </p>
      ) : (
        <>
          {result?.isPreview && (
            <p className={s.notice}>
              Limited provider preview. Coverage and fields may be reduced.
            </p>
          )}
          {!count ? (
            <p className={s.state}>
              No displayable records were returned for this section. This does
              not imply zero activity.
            </p>
          ) : (
            view.groups.map(
              (group) =>
                group.rows.length > 0 && (
                  <section className={s.group} key={group.title}>
                    <div className={s.groupHeading}>
                      <h4>{group.title}</h4>
                      <span>{group.rows.length} displayed</span>
                    </div>
                    <div className={s.records}>
                      {group.rows.map((row, i) => (
                        <article
                          className={s.record}
                          key={`${row.label}:${row.date}:${i}`}
                        >
                          <header>
                            <h5>
                              {row.href ? (
                                <a
                                  href={row.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {row.label} ↗
                                </a>
                              ) : (
                                row.label
                              )}
                            </h5>
                            <time>{row.date ?? "Date not supplied"}</time>
                          </header>
                          {row.cells.length > 0 && (
                            <dl className={s.metrics}>
                              {row.cells.map((cell, j) => (
                                <div key={`${cell.label}:${j}`}>
                                  <dt>{cell.label}</dt>
                                  <dd>{cell.value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          {row.text && (
                            <details className={s.readout}>
                              <summary>Read provider summary</summary>
                              <p>{row.text}</p>
                            </details>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                ),
            )
          )}
          <footer className={s.provenance}>
            <span>
              Evidence date {result?.asOf?.slice(0, 10) ?? "not supplied"}
            </span>
            <span>
              Retrieved {result?.retrievedAt?.slice(0, 19).replace("T", " ")}{" "}
              UTC
            </span>
            {result?.totalCount != null && (
              <span>
                {result.totalCount.toLocaleString()} provider records in scope;
                this view may be a subset
              </span>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
