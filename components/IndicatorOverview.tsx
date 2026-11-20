"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { businessIndicatorOverview } from "@/lib/business-indicator-overview";
import { indicatorOverview } from "@/lib/indicator-overview";
import { dateLabel } from "@/lib/format";
import wall from "./DirectResearchLenses.module.css";
import styles from "./ResearchLens.module.css";
import coverage from "./IndicatorOverview.module.css";

export default function IndicatorOverview({
  research,
}: {
  research: Research;
}) {
  const rows = useMemo(
    () => indicatorOverview(research.history, research.retrievedAt),
    [research.history, research.retrievedAt],
  );
  const business = useMemo(
    () => businessIndicatorOverview(research),
    [research],
  );
  const groups = [
    ...(business.length
      ? [
          {
            family: "business" as const,
            label: "reported annual periods",
            metricBasis: "annual-report",
            noHistory: "No reported annual periods were supplied.",
            partialHistory:
              "Reported annual periods were supplied, but they do not support these metrics.",
            rows: business,
          },
        ]
      : []),
    {
      family: "market" as const,
      label: "completed daily prices",
      metricBasis: "daily-price",
      noHistory: "No completed daily prices were supplied.",
      partialHistory:
        "Completed daily prices were supplied, but they do not support these metrics.",
      rows,
    },
  ].map((group) => ({
    ...group,
    available: group.rows.filter((row) =>
      row.points.some((point) => point.value != null),
    ),
    unavailable: group.rows.filter((row) =>
      row.points.every((point) => point.value == null),
    ),
  }));
  type Row = (typeof groups)[number]["rows"][number];
  const display = (value: number | null | undefined, unit: string) =>
    value == null ? "Unavailable" : `${value.toFixed(2)}${unit}`;
  const observationDate = (point: Row["points"][number] | undefined) =>
    point?.date && Number.isFinite(Date.parse(point.date)) ? (
      <>
        {"currency" in point ? "Period ended " : "Completed session "}
        <time dateTime={point.date}>{dateLabel(point.date)}</time>
      </>
    ) : (
      "Observation date unavailable"
    );
  const observations = (row: Row) => (
    <details className={styles.observations}>
      <summary>Dates &amp; values</summary>
      <div tabIndex={0} role="region" aria-label={`${row.label} observations`}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {[...row.points].reverse().map((point) => (
              <tr key={point.date}>
                <td>{dateLabel(point.date)}</td>
                <td>
                  {display(point.value, row.unit)}
                  {"currency" in point && (
                    <small>
                      {" "}
                      · {String(point.currency)} · {String(point.basis)}
                      {point.filed
                        ? ` · filed ${dateLabel(String(point.filed))}`
                        : ""}
                      {typeof point.sourceUrl === "string" &&
                        /^https:\/\//.test(point.sourceUrl) && (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={point.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Source
                            </a>
                          </>
                        )}
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
  return (
    <section
      aria-label="Historical indicator overview"
      className={styles.indicators}
    >
      <header className={styles.heading}>
        <h2>Indicators</h2>
      </header>
      <div className={wall.grid}>
        {groups.flatMap((group) =>
          group.available.map((row) => {
            const values = row.points.flatMap((point) =>
              point.value == null ? [] : [point.value],
            );
            const low = Math.min(...values),
              high = Math.max(...values);
            const segments: string[][] = [];
            let segment: string[] = [];
            row.points.forEach((point, index) => {
              if (point.value == null) {
                if (segment.length) segments.push(segment);
                segment = [];
                return;
              }
              segment.push(
                `${(index / Math.max(1, row.points.length - 1)) * 300},${high === low ? 36 : 64 - ((point.value - low) / (high - low)) * 56}`,
              );
            });
            if (segment.length) segments.push(segment);
            const last = row.points.at(-1);
            return (
              <article
                key={row.key}
                data-evidence-family={group.family}
                className={`${styles.indicator} ${wall.metric}`}
              >
                <header>
                  <h3>{row.label}</h3>
                  <details className={styles.info} data-info-disclosure>
                    <summary aria-label={`About ${row.label}`}>ⓘ</summary>
                    <p>
                      {row.note} Historical observations only; not a trading
                      signal.
                      {last && "currency" in last && "basis" in last
                        ? ` Reporting currency: ${last.currency}; basis: ${last.basis}.`
                        : ""}
                    </p>
                  </details>
                </header>
                <strong>
                  {last?.value == null
                    ? "Latest value unavailable"
                    : display(last.value, row.unit)}
                </strong>
                <small className={wall.basis}>
                  {group.label} · {observationDate(last)}
                </small>
                {values.length > 1 && (
                  <svg
                    viewBox="0 0 300 72"
                    role="img"
                    aria-label={`${row.label}, ${row.points.length} dated observations`}
                  >
                    {segments.map((points, index) => (
                      <polyline
                        key={index}
                        points={points.join(" ")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </svg>
                )}
                {observations(row)}
              </article>
            );
          }),
        )}
        {groups.map((group) =>
          group.unavailable.length ? (
            <section
              key={group.family}
              className={coverage.missing}
              aria-label={`${group.metricBasis} coverage`}
            >
              <p>
                {group.rows.some((row) => row.points.length)
                  ? group.partialHistory
                  : group.noHistory}
              </p>
              <details className={coverage.disclosure}>
                <summary>
                  {group.unavailable.length} unavailable {group.metricBasis}{" "}
                  {group.unavailable.length === 1 ? "metric" : "metrics"}
                </summary>
                <dl className={coverage.metrics}>
                  {group.unavailable.map((row) => (
                    <div key={row.key}>
                      <dt>{row.label}</dt>
                      <dd>
                        {row.note}
                        {row.points.length > 0 && (
                          <>
                            <small>{observationDate(row.points.at(-1))}</small>
                            {observations(row)}
                          </>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>
          ) : null,
        )}
      </div>
    </section>
  );
}
