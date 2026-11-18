"use client";
import { analystRangePosition } from "@/lib/analyst-range-geometry";
import { consensusTarget } from "@/lib/analyst-presentation";
import layout from "./SentiSenseConsensus.module.css";
import EtfAggregateEvidence from "./EtfAggregateEvidence";
import EtfComposition from "./EtfComposition";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import { useResource } from "./Session";
import { dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import type { ReactNode } from "react";
import s from "./ResearchWorkspace.module.css";
const value = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "Not supplied";
/** Loaded only when the analyst tab is opened; never replaces modeled scenarios. */
export default function SentiSenseConsensus({
  symbol,
  preview,
  fallback,
}: {
  symbol: string;
  preview: boolean;
  fallback?: ReactNode;
}) {
  const profile = useResource<SentiSenseResult>(
    preview
      ? null
      : `intelligence/${encodeURIComponent(symbol)}?dataset=profile`,
    undefined,
    86400000,
  );
  const profileData = profile.data?.data as { kind?: string } | null;
  const kind = profileData?.kind;
  const classified =
    profile.data?.status === "available" &&
    (kind === "STOCK" || kind === "ETF");
  const r = useResource<SentiSenseResult>(
    preview || !classified
      ? null
      : `intelligence/${encodeURIComponent(symbol)}?dataset=${kind === "ETF" ? "etfAnalyst" : "consensus"}`,
    undefined,
    60_000,
  );
  if (preview) return null;
  if (!classified)
    return (
      <div>
        <p role="status">
          {profile.loading
            ? "Checking instrument type…"
            : "Instrument type is not confirmed. Analyst evidence is withheld rather than treating a fund as a company."}
        </p>
        {!profile.loading && (
          <button type="button" className="button" onClick={profile.refresh}>
            Retry instrument check
          </button>
        )}
      </div>
    );
  const result = r.data;
  const data =
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
      ? (result.data as Record<string, unknown>)
      : null;
  const rangePosition = analystRangePosition(
    data?.targetLow,
    data?.targetMean,
    data?.targetHigh,
  );
  const available =
    result?.status === "available" || result?.status === "preview";
  if (kind === "ETF") {
    const aggregate = data as {
      weightedConsensus?: { upsidePercent?: number };
      coverage?: {
        holdingsCount?: number;
        holdingsCovered?: number;
        weightCovered?: number;
        partial?: boolean;
      };
      asOfDate?: string;
    } | null;
    return (
      <section
        className={s.workspace}
        aria-label="Fund constituent analyst aggregate"
      >
        <h3>Constituent analyst outlook</h3>
        <p className={s.caption}>
          Holdings-weighted evidence, normalized to covered constituents. Not an
          analyst price target for this fund.
        </p>
        {r.loading ? (
          <p role="status">Loading constituent coverage…</p>
        ) : !available || !aggregate ? (
          <p role="status">
            Constituent analyst coverage is unavailable or insufficient. No
            stock consensus is substituted.
          </p>
        ) : (
          <>
            <div className={s.stats}>
              <div className={s.stat}>
                <span>Weighted constituent upside</span>
                <strong>
                  {value(aggregate.weightedConsensus?.upsidePercent)}
                  {typeof aggregate.weightedConsensus?.upsidePercent ===
                  "number"
                    ? "%"
                    : ""}
                </strong>
              </div>
              <div className={s.stat}>
                <span>Portfolio weight covered</span>
                <strong>
                  {value(aggregate.coverage?.weightCovered)}
                  {typeof aggregate.coverage?.weightCovered === "number"
                    ? "%"
                    : ""}
                </strong>
              </div>
              <div className={s.stat}>
                <span>Holdings covered</span>
                <strong>
                  {value(aggregate.coverage?.holdingsCovered)} /{" "}
                  {value(aggregate.coverage?.holdingsCount)}
                </strong>
              </div>
            </div>
            <p className={s.caption}>
              Composition date{" "}
              {aggregate.asOfDate
                ? dateLabel(aggregate.asOfDate)
                : "not supplied"}
              .{" "}
              {aggregate.coverage?.partial
                ? "Partial holdings file; not the full fund."
                : "Coverage applies only to the returned holdings."}
            </p>
          </>
        )}
        {!r.loading && (r.error || !available || !aggregate) && (
          <button type="button" className="button" onClick={r.refresh}>
            Retry constituent evidence
          </button>
        )}
        <EtfComposition symbol={symbol} />
        <EtfAggregateEvidence key={symbol} symbol={symbol} />
      </section>
    );
  }
  return (
    <section
      className={`${s.workspace} ${layout.container}`}
      aria-label="Analyst consensus"
    >
      <h3>Analyst target range</h3>
      <p className={s.caption}>
        Provider consensus is separate from AURYN’s calculated scenarios.
      </p>
      {r.loading ? (
        <p role="status">Loading analyst coverage…</p>
      ) : r.error && !fallback ? (
        <p role="status">{r.error}</p>
      ) : (r.error || !available || !data) && fallback ? (
        <div>
          <p className={s.caption}>
            Primary analyst coverage is unavailable. The separately dated
            alternate source below is not merged with it.
          </p>
          {fallback}
        </div>
      ) : !available || !data ? (
        <p role="status">
          Analyst coverage is{" "}
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
          {rangePosition !== null ? (
            <div
              className={layout.rangeFigure}
              role="img"
              aria-label={`Analyst target range: low ${consensusTarget(data.targetLow, data.currency)}, mean ${consensusTarget(data.targetMean, data.currency)}, high ${consensusTarget(data.targetHigh, data.currency)}. ${data.targetLow === data.targetHigh ? "All three targets are equal." : "Marker position shows the mean within the supplied range."}`}
            >
              <div className={layout.rangeTrack} aria-hidden="true">
                <span style={{ left: `${rangePosition}%` }} />
              </div>
              <div className={layout.rangeLabels} aria-hidden="true">
                <span>Low</span>
                <span>Mean marker</span>
                <span>High</span>
              </div>
            </div>
          ) : (
            <p className={s.caption}>
              Range visualization unavailable: ordered low, mean and high
              targets are required. Supplied readings remain below.
            </p>
          )}
          <div className={`${s.stats} ${layout.stats}`}>
            {[
              ["Low target", consensusTarget(data.targetLow, data.currency)],
              ["Mean target", consensusTarget(data.targetMean, data.currency)],
              ["High target", consensusTarget(data.targetHigh, data.currency)],
              [
                "Analyst consensus",
                typeof data.consensusLabel === "string"
                  ? data.consensusLabel
                      .replaceAll("_", " ")
                      .toLowerCase()
                      .replace(/^./, (letter: string) => letter.toUpperCase())
                  : "Not supplied",
              ],
            ].map(([label, v]) => (
              <div
                className={s.stat}
                key={label}
                data-target={label}
                data-kind={
                  label === "Mean target"
                    ? "mean"
                    : label === "Low target"
                      ? "low"
                      : label === "High target"
                        ? "high"
                        : "consensus"
                }
              >
                <span className={layout.metricLabel}>
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {label === "Analyst consensus" ? (
                      <>
                        <circle cx="9" cy="7" r="3" />
                        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-3-5" />
                      </>
                    ) : label === "Mean target" ? (
                      <>
                        <circle cx="12" cy="12" r="8" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : label === "Low target" ? (
                      <>
                        <path d="M4 5v14h16M8 15h8M8 15l3-3M8 15l3 3" />
                      </>
                    ) : (
                      <>
                        <path d="M4 5v14h16M8 8h8M16 8l-3-3M16 8l-3 3" />
                      </>
                    )}
                  </svg>
                  {label}
                </span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <p className={s.caption}>
            Target publishers: {value(data.numberOfAnalysts)}. Targets are
            opinions, not live prices. Evidence date:{" "}
            {result?.asOf ? dateLabel(result.asOf) : "not supplied"}. Retrieved{" "}
            {dateLabel(result?.retrievedAt)}.
            <Help label="Analyst range source and comparability">
              SentiSense analyst consensus. Compare low, mean and high only with
              the same provider cohort, evidence date and target currency. AURYN
              conditional models and historical price ranges are different
              measures; matching another service is not established.
            </Help>
          </p>
        </>
      )}
      {!r.loading && (r.error || !available || !data) && (
        <button type="button" className="button" onClick={r.refresh}>
          Retry analyst evidence
        </button>
      )}
    </section>
  );
}
