"use client";
import { useEffect, useState } from "react";
import type { Research } from "@/lib/types";
import type { PacePriceZones as Zones } from "@/lib/pace-price-zones";
import { amount, priceAmount } from "@/lib/format";
import { paceLadder } from "@/lib/pace-ladder";
import styles from "./PacePriceZones.module.css";
const labels = [
  "Pause",
  "Watch / hold",
  "Start small",
  "Build gradually",
  "Deep accumulation",
];
export default function PacePriceZones({
  research,
  asOf,
  period = "forming",
  active = true,
  compact = false,
  selected,
  onInspect,
}: {
  research: Research;
  asOf: string;
  period?: "forming" | "confirmed";
  active?: boolean;
  compact?: boolean;
  selected?: number | null;
  onInspect?: (level: number) => void;
}) {
  const [result, setResult] = useState<{
    symbol: string;
    zones: Zones | null;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setFailed(false);
    import("@/lib/pace-price-zones")
      .then(({ pacePriceZones }) =>
        pacePriceZones(
          research.history,
          asOf,
          period,
          research.company.assetType === "crypto" ? "crypto" : "us-equity",
          controller.signal,
        ),
      )
      .then((zones) => {
        if (!controller.signal.aborted)
          setResult({ symbol: research.company.symbol, zones });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [
    active,
    research.history,
    research.company.symbol,
    research.company.assetType,
    asOf,
    period,
  ]);
  const zones =
    result?.symbol === research.company.symbol ? result.zones : null;
  if (!active) return null;
  if (!zones)
    return (
      <p className={styles.pending} role="status">
        {failed || result
          ? "More settled history is needed for price zones."
          : "Calculating stock price zones…"}
      </p>
    );
  if (compact)
    return (
      <div
        className={styles.ladder}
        aria-label="Five Pace stages with price levels"
      >
        {paceLadder(zones, labels.length).map((step) => {
          const { level, current } = step;
          return (
            <button
              type="button"
              key={level}
              aria-label={`Explore P${level}: ${["Pause", "Watch", "Start", "Gradual", "Planned max"][level]}`}
              aria-pressed={selected === level}
              data-current={current}
              onClick={() => onInspect?.(level)}
            >
              <i className={styles.diamond} aria-hidden="true" />
              <strong>
                P{level}
                {current ? " · now" : ""}
              </strong>
              <small className={styles.stageAction}>{labels[level]}</small>
              <span
                title={
                  step.relation === "at-or-below"
                    ? "Nearest band for this stage begins at or below this price"
                    : step.relation === "at-or-above"
                      ? "Nearest band for this stage begins at or above this price"
                      : undefined
                }
              >
                {step.price == null
                  ? "—"
                  : `${step.relation === "at-or-below" ? "≤ " : step.relation === "at-or-above" ? "≥ " : ""}${priceAmount(step.price, research.quote.currency)}`}
              </span>
              {step.bands > 1 && (
                <small className={styles.bandCount}>{step.bands} bands</small>
              )}
            </button>
          );
        })}
        <small className={styles.currentPrice}>
          Pace reference {amount(zones.reference, research.quote.currency)} ·
          settled price history · ≤ / ≥ mark the nearest approximate zone edge
        </small>
      </div>
    );
  return (
    <div className={styles.zones} aria-label="Stock-specific Pace price zones">
      <table>
        <thead>
          <tr>
            <th scope="col">Zone</th>
            <th scope="col">Conditional price bands</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label, level) => {
            const ranges = zones.ranges.filter((x) => x.level === level);
            const current = ranges.some(
              (x) => x.low <= zones.reference && zones.reference <= x.high,
            );
            return (
              <tr key={level} data-current={current}>
                <th scope="row">
                  <strong>P{level}</strong>
                  <span>{label}</span>
                  {current && <small>Current</small>}
                </th>
                <td>
                  {ranges.length ? (
                    ranges.map((range, i) => (
                      <span key={i}>
                        ≈ {amount(range.low, research.quote.currency)} –{" "}
                        {amount(range.high, research.quote.currency)}
                      </span>
                    ))
                  ) : (
                    <span>No band in this scan</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <small>
        Estimated from current inputs · scanned{" "}
        {amount(zones.from, research.quote.currency)}–
        {amount(zones.to, research.quote.currency)}. Bands can change with new
        data.
      </small>
    </div>
  );
}
