"use client";
import EtfComposition from "./EtfComposition";
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
      <p role="status">
        {profile.loading
          ? "Checking instrument type…"
          : "Instrument type is not confirmed. Analyst evidence is withheld rather than treating a fund as a company."}
      </p>
    );
  const result = r.data;
  const data =
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
      ? (result.data as Record<string, unknown>)
      : null;
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
        <EtfComposition symbol={symbol} />
      </section>
    );
  }
  return (
    <section className={s.workspace} aria-label="Analyst consensus">
      <h3>Analyst perspective</h3>
      <p className={s.caption}>
        Provider consensus is separate from AURYN’s calculated scenarios.
      </p>
      {r.loading ? (
        <p role="status">Loading analyst coverage…</p>
      ) : r.error ? (
        <p role="status">{r.error}</p>
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
