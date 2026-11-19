"use client";
import { useState } from "react";
import {
  optionObservations,
  defaultOptionMetric,
  optionObservationMetrics,
  type OptionObservationMetric,
} from "@/lib/options-observations";
import styles from "./OptionsObservationChart.module.css";
export default function OptionsObservationChart({
  data,
  intraday,
}: {
  data: unknown;
  intraday: boolean;
}) {
  const [chosenMetric, setMetric] = useState<OptionObservationMetric | null>(
    null,
  );
  const metric = chosenMetric ?? defaultOptionMetric(data, intraday);
  const [selection, setSelection] = useState<{
    data: unknown;
    intraday: boolean;
    index: number;
  } | null>(null);
  const selected =
    selection && selection.data === data && selection.intraday === intraday
      ? selection.index
      : null;
  const setSelected = (index: number | null) =>
    setSelection(index == null ? null : { data, intraday, index });
  const { points, missing } = optionObservations(data, intraday, metric);
  const spec = optionObservationMetrics[metric];
  const first = points[0]?.timestamp ?? 0,
    last = points.at(-1)?.timestamp ?? 1;
  const low = Math.min(...points.map((p) => p.value)),
    high = Math.max(...points.map((p) => p.value));
  const x = (v: number) => 60 + ((v - first) / Math.max(1, last - first)) * 680;
  const y = (v: number) =>
    high === low ? 125 : 220 - ((v - low) / (high - low)) * 185;
  const active =
    points[Math.min(selected ?? points.length - 1, points.length - 1)];
  const format = (v: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
      notation: spec.unit === "contracts" ? "compact" : "standard",
    }).format(v);
  return (
    <section className={styles.chart} aria-label="Options observations chart">
      <nav aria-label="Options chart metric">
        {Object.entries(optionObservationMetrics).map(([id, s]) => (
          <button
            type="button"
            key={id}
            aria-pressed={metric === id}
            onClick={() => {
              setMetric(id as OptionObservationMetric);
              setSelected(null);
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <header>
        <div>
          <span>
            {intraday ? "DELAYED INTRADAY SNAPSHOTS" : "COMPLETED SESSIONS"}
          </span>
          <h4>{spec.label}</h4>
        </div>
        {active && (
          <p>
            <b>
              {format(active.value)} {spec.unit}
            </b>
            <time>{active.label}</time>
          </p>
        )}
      </header>
      {!points.length ? (
        <p>No dated observations supplied for this metric.</p>
      ) : (
        <>
          <svg
            viewBox="0 0 780 270"
            role="img"
            aria-label={`${spec.label}, ${points.length} actual observations from ${points[0].label} to ${points.at(-1)!.label}. Missing readings are not interpolated.`}
          >
            {/* Parser guarantees finite nonnegative values, so high-low cannot overflow. */}
            {[low, low + (high - low) / 2, high]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((v) => (
                <g key={v}>
                  <line x1="60" x2="740" y1={y(v)} y2={y(v)} />
                  <text x="52" y={y(v) + 4} textAnchor="end">
                    {format(v)}
                  </text>
                </g>
              ))}
            {points.map((p, i) => (
              <circle
                key={p.timestamp}
                cx={x(p.timestamp)}
                cy={y(p.value)}
                r={selected === i ? 5 : 3}
                onPointerEnter={() => setSelected(i)}
              >
                <title>{`${p.label}: ${format(p.value)} ${spec.unit}`}</title>
              </circle>
            ))}
            <text x="60" y="254">
              {points[0].label}
            </text>
            <text x="740" y="254" textAnchor="end">
              {points.at(-1)!.label}
            </text>
          </svg>
          <label className={styles.scrubber}>
            Inspect observation{" "}
            <input
              type="range"
              min="0"
              max={points.length - 1}
              value={Math.min(selected ?? points.length - 1, points.length - 1)}
              onChange={(e) => setSelected(Number(e.target.value))}
              aria-valuetext={
                active
                  ? `${active.label}: ${format(active.value)} ${spec.unit}`
                  : undefined
              }
            />
          </label>
        </>
      )}
      <p className={styles.note}>
        {missing} missing or ambiguous observations omitted. Points show
        reported snapshots, never an interpolated trade tape.{" "}
        {intraday
          ? "Calls and puts are cumulative session volume; intraday IV methodology differs from the daily snapshot."
          : "Open interest and implied volatility are research context, not executable prices."}
      </p>
    </section>
  );
}
