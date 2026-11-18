"use client";
import { useMemo, useState, type CSSProperties } from "react";
import type { Research } from "@/lib/types";
import { researchAccumulation } from "@/lib/accumulation-policy-v7";
import { paceMonthHistory } from "@/lib/pace-month-history";
import { paceChartColours } from "@/lib/pace-chart-levels";
import { PACE_LEVELS } from "@/lib/pace-presentation";
import { amount, dateLabel } from "@/lib/format";
import s from "./PaceMonthHistory.module.css";
export default function PaceMonthHistory({ research }: { research: Research }) {
  const model = useMemo(
    () =>
      researchAccumulation(
        research.history,
        research.retrievedAt,
        research.company.assetType === "crypto" ? "crypto" : "us-equity",
      ),
    [research.history, research.retrievedAt, research.company.assetType],
  );
  const rows = useMemo(
    () => paceMonthHistory(model.history, research.retrievedAt),
    [model.history, research.retrievedAt],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find((r) => r.month === selected) ?? rows.at(-1);
  const count = rows.filter((r) => r.reading).length;
  if (!count)
    return (
      <section className={s.root} aria-label="Previous 12 months Pace history">
        <header>
          <h3>Monthly Pace history</h3>
        </header>
        <p className={s.note}>
          No eligible completed monthly readings in the previous 12 months. More
          settled history is needed; no zones are estimated.
        </p>
      </section>
    );
  return (
    <section className={s.root} aria-label="Previous 12 months Pace history">
      <header>
        <h3>Monthly Pace history</h3>
        <span>{count} of 12 previous months covered</span>
      </header>
      <div
        className={s.scroll}
        role="region"
        aria-label="Monthly Pace readings"
        tabIndex={0}
      >
        <div className={s.months}>
          {rows.map((row) => {
            const level = row.reading?.multiplier;
            const label = new Date(
              row.month + "-01T12:00:00Z",
            ).toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
              timeZone: "UTC",
            });
            return (
              <button
                key={row.month}
                type="button"
                aria-pressed={active?.month === row.month}
                aria-label={`${label}: ${level == null ? "reading unavailable" : `P${level} ${PACE_LEVELS[level]}`}`}
                onClick={() => setSelected(row.month)}
                style={
                  {
                    "--zone":
                      level == null ? "var(--muted)" : paceChartColours[level],
                  } as CSSProperties
                }
              >
                <span className={s.track} aria-hidden="true">
                  <i style={{ height: level == null ? 4 : 12 + level * 9 }} />
                </span>
                <strong>{level == null ? "—" : `P${level}`}</strong>
                <small>{label}</small>
              </button>
            );
          })}
        </div>
      </div>
      <div className={s.readout} aria-live="polite">
        {active?.reading ? (
          <>
            <strong>
              P{active.reading.multiplier} ·{" "}
              {PACE_LEVELS[active.reading.multiplier]}
            </strong>
            <span>
              Completed {dateLabel(active.reading.date)} · close{" "}
              {amount(active.reading.close, research.company.currency)}
              {active.reading.policyVersion
                ? ` · ${active.reading.policyVersion}`
                : ""}
            </span>
            <p>{active.reading.reason}</p>
          </>
        ) : (
          <p>
            No eligible completed reading for{" "}
            {active
              ? new Date(active.month + "-01T12:00:00Z").toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric", timeZone: "UTC" },
                )
              : "this period"}
            . Missing history is not a P0 reading.
          </p>
        )}
      </div>
      <small className={s.note}>
        Historical price zones, not executed purchases or returns. Current
        forming month is separate; business and risk checks still apply.
      </small>
    </section>
  );
}
