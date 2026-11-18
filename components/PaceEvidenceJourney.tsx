"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { financialPeriods } from "@/lib/engine";
import { upcomingEstimates, estimateValue } from "@/lib/evidence-display";
import {
  journeyGrowth,
  journeyPlot,
  type JourneyPoint,
} from "@/lib/pace-evidence-journey";
import { dateLabel, percent } from "@/lib/format";
import s from "./PaceEvidenceJourney.module.css";
type Point = JourneyPoint & {
  source?: string;
  filed?: string;
  low?: number | null;
  high?: number | null;
  analysts?: number | null;
};
function EvidencePath({
  points,
  forecast,
  metric,
}: {
  points: Point[];
  forecast: boolean;
  metric: string;
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const index =
    selection != null && selection < points.length
      ? selection
      : points.length - 1;
  const selected = points[index],
    plot = journeyPlot(points),
    growth = journeyGrowth(points);
  const money = (value: number | null | undefined) =>
    estimateValue(value, selected?.currency ?? null, metric === "revenue");
  return (
    <section
      className={s.path}
      data-forecast={forecast}
      aria-label={forecast ? "Analyst estimate path" : "Reported business path"}
    >
      <header>
        <span>
          {forecast
            ? "FORWARD · ANALYST ESTIMATES"
            : "PAST → CURRENT · REPORTED"}
        </span>
        <small>
          {forecast ? "Not a price forecast" : "Annual fiscal periods"}
        </small>
      </header>
      <div className={s.readout}>
        <strong>{selected ? money(selected.value) : "Not supplied"}</strong>
        <span>
          {selected ? dateLabel(selected.date) : "No comparable periods"}
          <small>{selected?.currency ?? "Currency not supplied"}</small>
        </span>
      </div>
      {plot.dots.length ? (
        <>
          <svg
            viewBox="0 0 400 160"
            role="group"
            aria-label={`${forecast ? "Estimated" : "Reported"} ${metric}. Select a dated observation.`}
          >
            <line
              x1="18"
              x2="382"
              y1={plot.zeroY}
              y2={plot.zeroY}
              className={s.baseline}
            />
            {plot.segments
              .filter((p) => p.length > 1)
              .map((p, i) => (
                <polyline
                  key={i}
                  points={p.join(" ")}
                  fill="none"
                  className={s.line}
                />
              ))}
            {plot.dots.map((p) => (
              <g
                key={p.index}
                role="button"
                tabIndex={0}
                aria-pressed={p.index === index}
                aria-label={`${dateLabel(points[p.index].date)}: ${estimateValue(points[p.index].value, points[p.index].currency, metric === "revenue")}`}
                onClick={() => setSelection(p.index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelection(p.index);
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.index === index ? 6 : 4}
                  className={s.dot}
                />
              </g>
            ))}
          </svg>
          <label className={s.select}>
            Inspect period
            <select
              value={index}
              onChange={(e) => setSelection(Number(e.target.value))}
            >
              {points.map((p, i) => (
                <option key={p.date} value={i}>
                  {dateLabel(p.date)}
                  {p.value == null ? " · unavailable" : ""}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <p className={s.empty}>
          {forecast
            ? "Usable annual estimates with a supplied currency are unavailable. No projection is drawn."
            : "Usable reported annual history with a supplied currency is unavailable. No trend is invented."}
        </p>
      )}
      {selected && (
        <div className={s.detail}>
          <span>
            {forecast
              ? "Provider estimate basis not specified; may differ from reported earnings."
              : `${selected.basis} · filed ${dateLabel(selected.filed)}`}
          </span>
          {forecast &&
            selected.low != null &&
            selected.high != null &&
            selected.low <= selected.high && (
              <span>
                Supplied range {money(selected.low)}–{money(selected.high)}
              </span>
            )}
          {forecast && selected.analysts != null && (
            <span>
              {selected.analysts} EPS estimate contributors (revenue coverage
              not supplied)
            </span>
          )}
          {!forecast &&
            selected.source &&
            /^https:\/\//.test(selected.source) && (
              <a
                href={selected.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read reported source ↗
              </a>
            )}
        </div>
      )}
      <p className={s.change}>
        {growth == null
          ? "Comparable annual growth not established."
          : `${percent(growth, true)} between the latest two ${forecast ? "estimate" : "reported"} periods.`}
      </p>
    </section>
  );
}
export default function PaceEvidenceJourney({
  research: r,
}: {
  research: Research;
}) {
  const [metric, setMetric] = useState<"revenue" | "eps">("revenue");
  const { reported, estimated } = useMemo(() => {
    const periods = financialPeriods(r.facts, "annual", r.retrievedAt).slice(
        -6,
      ),
      last = periods.at(-1);
    const reported: Point[] = periods.map((p) => ({
      date: p.end,
      value:
        last && p.currency === last.currency && p.basis === last.basis
          ? (p[metric] ?? null)
          : null,
      currency: p.currency,
      basis: p.basis,
      filed: p.filed,
      source: p.sourceUrl,
    }));
    const estimates = upcomingEstimates(r, true),
      currency = estimates[0]?.currency;
    const estimated: Point[] = estimates.map((p) => ({
      date: p.date,
      value: p.currency === currency ? (p[metric] ?? null) : null,
      currency: p.currency,
      basis: "Provider consensus · accounting basis not supplied",
      low: metric === "eps" ? p.epsLow : p.revenueLow,
      high: metric === "eps" ? p.epsHigh : p.revenueHigh,
      analysts: p.analysts,
    }));
    return { reported, estimated };
  }, [r, metric]);
  if (r.company.assetType !== "stock") return null;
  return (
    <section className={s.root} aria-label="Pace business evidence journey">
      <header className={s.heading}>
        <div>
          <span>BUSINESS PATH</span>
          <h3>What changed. What is expected next.</h3>
          <p>
            Read growth evidence alongside Pace’s price conditions, not as a
            prediction of the stock price.
          </p>
        </div>
        <div
          className={s.toggle}
          role="group"
          aria-label="Business path metric"
        >
          {(["revenue", "eps"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              {m === "eps" ? "EPS" : "Revenue"}
            </button>
          ))}
        </div>
      </header>
      <div className={s.paths}>
        <EvidencePath
          key={`${r.company.symbol}-${metric}-reported`}
          points={reported}
          forecast={false}
          metric={metric}
        />
        <EvidencePath
          key={`${r.company.symbol}-${metric}-forecast`}
          points={estimated}
          forecast
          metric={metric}
        />
      </div>
      <p className={s.note}>
        Separate scales and accounting bases. Dashed lines connect supplied
        estimates only, not a continuous forecast or a bridge from reported
        results. Missing or incompatible periods break the path. Snapshot
        retrieved {dateLabel(r.retrievedAt)}; forecasts can be revised.
      </p>
      <details className={s.explain}>
        <summary>What would change the reading?</summary>
        <p>
          Pace’s technical reading changes with price, trend, momentum and
          volatility under its existing model. Reported growth and analyst
          expectations do not directly set a Pace zone. Compare the next filing
          with this business path: weaker revenue or earnings calls for
          revisiting the business case, even when a price zone looks favorable.
        </p>
        <p>
          Estimate source: {r.evidence?.source || "not supplied"}. Estimate
          update date is not supplied separately from the retrieved snapshot.
          Estimates are supplied opinions, not promised outcomes. No revision
          trend is inferred from this single snapshot.
        </p>
      </details>
    </section>
  );
}
