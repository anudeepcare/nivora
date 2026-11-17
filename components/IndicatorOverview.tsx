"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { businessIndicatorOverview } from "@/lib/business-indicator-overview";
import { indicatorOverview } from "@/lib/indicator-overview";
import { dateLabel } from "@/lib/format";
import styles from "./ResearchLens.module.css";

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
            label: "Business evidence · reported annual periods",
            rows: business,
          },
        ]
      : []),
    { label: "Market evidence · completed daily prices", rows },
  ];
  return (
    <section
      aria-label="Historical indicator overview"
      className={styles.indicators}
    >
      <header className={styles.heading}>
        <h2>Indicators</h2>
        <span>Reported business performance and completed market evidence</span>
      </header>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3>{group.label}</h3>
          <div className={styles.sparkgrid}>
            {group.rows.map((row) => {
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
              const display = (value: number | null | undefined) =>
                value == null
                  ? "History needed"
                  : `${value.toFixed(2)}${row.unit}`;
              return (
                <article key={row.key} className={styles.indicator}>
                  <header>
                    <h3>{row.label}</h3>
                    <details className={styles.info}>
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
                  <strong>{display(last?.value)}</strong>
                  {values.length > 1 ? (
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
                  ) : (
                    <p className={styles.empty}>
                      Insufficient completed history
                    </p>
                  )}
                  <details className={styles.observations}>
                    <summary>Dates &amp; values</summary>
                    <div
                      tabIndex={0}
                      role="region"
                      aria-label={`${row.label} observations`}
                    >
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
                                {display(point.value)}
                                {"currency" in point && (
                                  <small>
                                    {" "}
                                    · {String(point.currency)} ·{" "}
                                    {String(point.basis)}
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
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
