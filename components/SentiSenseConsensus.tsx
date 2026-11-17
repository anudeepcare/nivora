"use client";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import { useResource } from "./Session";
import { dateLabel } from "@/lib/format";
import s from "./ResearchWorkspace.module.css";
const value = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "Not supplied";
/** Loaded only when the analyst tab is opened; never replaces modeled scenarios. */
export default function SentiSenseConsensus({
  symbol,
  preview,
}: {
  symbol: string;
  preview: boolean;
}) {
  const r = useResource<SentiSenseResult>(
    preview
      ? null
      : `intelligence/${encodeURIComponent(symbol)}?dataset=consensus`,
    undefined,
    60_000,
  );
  if (preview) return null;
  const result = r.data;
  const data =
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
      ? (result.data as Record<string, unknown>)
      : null;
  const available =
    result?.status === "available" || result?.status === "preview";
  return (
    <section className={s.workspace} aria-label="SentiSense analyst consensus">
      <h3>Analyst perspective</h3>
      <p className={s.caption}>
        SentiSense consensus is separate from AURYN’s calculated scenarios.
      </p>
      {r.loading ? (
        <p role="status">Loading analyst coverage…</p>
      ) : r.error ? (
        <p role="status">{r.error}</p>
      ) : !available || !data ? (
        <p role="status">
          SentiSense coverage is{" "}
          {result?.status.replaceAll("-", " ") ?? "unavailable"} for this
          company. No substitute values are shown.
        </p>
      ) : (
        <>
          {result?.isPreview && (
            <p>
              Limited provider preview. This is not complete analyst coverage.
            </p>
          )}
          <div className={s.stats}>
            {[
              [
                "Consensus",
                typeof data.consensusLabel === "string"
                  ? data.consensusLabel
                  : "Not supplied",
              ],
              ["Mean target", value(data.targetMean)],
              ["Low target", value(data.targetLow)],
              ["High target", value(data.targetHigh)],
              ["Target publishers", value(data.numberOfAnalysts)],
            ].map(([label, v]) => (
              <div className={s.stat} key={label}>
                <span>{label}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <p className={s.caption}>
            Targets in the provider’s quoted currency; not live prices. Evidence
            date: {result?.asOf ? dateLabel(result.asOf) : "not supplied"}.
            Retrieved {dateLabel(result?.retrievedAt)}.
          </p>
        </>
      )}
    </section>
  );
}
