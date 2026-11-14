"use client";
import { useMemo } from "react";
import { TrendingUp, Diamond, Target, ShieldAlert } from "lucide-react";
import type { Research } from "@/lib/types";
import { latestFinancialEvidence } from "@/lib/analysis";
import { consensusOutlook } from "@/lib/outlook";
import { aurynDecision } from "@/lib/auryn-decision";
import { amount, dateLabel, percent } from "@/lib/format";
import s from "./ResearchBrief.module.css";

export function OverviewBrief({
  research: r,
  now,
  owns = false,
  decision: provided,
}: {
  research: Research;
  now: number;
  owns?: boolean;
  decision?: ReturnType<typeof aurynDecision>;
}) {
  const model = useMemo(() => {
    const decision = provided ?? aurynDecision(r, { now, ownsPosition: owns });
    const consensus = consensusOutlook(r);
    const rows = [];
    rows.push({
      key: "pace",
      label: owns ? "Your holding" : "New purchase",
      icon: Diamond,
      tone: "pace",
      text: `${decision.actionLabel}${decision.pace?.level != null ? ` · Zone P${decision.pace.level}` : ""}. ${decision.headline ?? "Review business eligibility before adding."}`,
    });
    rows.push({
      key: "business",
      label: "Business",
      icon: TrendingUp,
      tone: "neutral",
      text:
        decision.brief?.business.reason ??
        "Comparable business evidence is incomplete.",
    });
    if (consensus?.referencePrice != null && consensus.target > 0)
      rows.push({
        key: "target",
        label: "Analyst view",
        icon: Target,
        tone: "target",
        text: `${percent((consensus.target / consensus.referencePrice - 1) * 100, true)} to the ${amount(consensus.target, r.quote.currency)} analyst target; not fair value.`,
      });
    rows.push({
      key: "risk",
      label: "What to watch",
      icon: ShieldAlert,
      tone: "caution",
      text:
        decision.risks?.[0] ??
        decision.changeConditions?.[0] ??
        "Review valuation uncertainty and position concentration.",
    });
    return rows.slice(0, 4);
  }, [r, now, owns, provided]);
  return (
    <section className={s.brief} aria-label="The 30-second read">
      <header>
        <h2>The 30-second read</h2>
        <small>Workspace refreshed {dateLabel(r.retrievedAt)}</small>
      </header>
      <div className={s.briefGrid}>
        {model.map(({ key, label, icon: Icon, tone, text }) => (
          <article key={key} data-tone={tone}>
            <span className={s.icon}>
              <Icon
                size={18}
                fill={key === "pace" ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </span>
            <div>
              <b className={s.rowLabel}>{label}</b>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DataFreshness({
  research: r,
  now,
  wide = false,
  decision,
}: {
  research: Research;
  now: number;
  wide?: boolean;
  decision?: ReturnType<typeof aurynDecision>;
}) {
  const d = useMemo(
    () => decision ?? aurynDecision(r, { now }),
    [r, now, decision],
  );
  const financial = useMemo(() => latestFinancialEvidence(r), [r]);
  const validDate = (value: string | null | undefined) => {
    if (!value || !Number.isFinite(now)) return undefined;
    const stamp = Date.parse(value),
      day = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(stamp) &&
      stamp <= now &&
      new Date(stamp).toISOString().slice(0, 10) === day
      ? value
      : undefined;
  };
  const datasetDate = validDate(r.evidence?.updatedAt);
  const target = consensusOutlook(r);
  const separateTargets = target?.source === "SentiSense";
  const targetDate = validDate(target?.asOf);
  const financialDate = validDate(financial.latest?.end);
  const analystCurrent =
    !!datasetDate && now - Date.parse(datasetDate) <= 120 * 86400000;
  const financialCurrent =
    !!financialDate && now - Date.parse(financialDate) <= 550 * 86400000;
  const quoteTime =
    d.reference?.basis === "quote" &&
    d.reference.asOf.includes("T") &&
    validDate(d.reference.asOf)
      ? ` · ${new Date(d.reference.asOf).toISOString().slice(11, 16)} UTC`
      : "";

  const rows = [
    {
      label: "Price",
      date: validDate(d.reference?.asOf),
      current: !!d.reference,
      context:
        d.reference?.basis === "settled-close"
          ? "Completed close"
          : `Quote${quoteTime}`,
    },
    {
      label: "Analyst dataset",
      date: separateTargets
        ? targetDate
        : r.evidence?.consensus || r.evidence?.estimates?.length
          ? datasetDate
          : undefined,
      current: separateTargets
        ? !!targetDate && now - Date.parse(targetDate) <= 7 * 86400000
        : analystCurrent,
      context: separateTargets
        ? `SentiSense targets · ${r.evidence?.source ?? "Provider"} estimates/ratings ${datasetDate ? dateLabel(datasetDate) : "date unavailable"}${datasetDate && !analystCurrent ? " · older dataset" : ""}`
        : analystCurrent
          ? ""
          : "Older dataset · refresh",
    },
    {
      label: "Financial period",
      date: financialDate,
      current: financialCurrent,
      context: `${financial.periodBasis}${financialDate && !financialCurrent ? " · Older report · refresh" : ""}`,
    },
    {
      label: "Ownership dataset",
      date:
        r.evidence &&
        (r.evidence.ownership?.institutions != null ||
          r.evidence.ownership?.insiders != null ||
          r.evidence.holders?.length)
          ? datasetDate
          : undefined,
      current: false,
      context: "Dated disclosure · verify source",
    },
  ];
  return (
    <section
      className={s.freshness}
      data-wide={wide || undefined}
      aria-label="Data freshness"
    >
      <header>
        <h2>Data freshness</h2>
      </header>
      <dl>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <i
                data-available={!!row.date && row.current}
                aria-hidden="true"
              />
              {row.date
                ? `${dateLabel(row.date)}${row.context ? " · " + row.context : ""}`
                : "Not supplied"}
            </dd>
          </div>
        ))}
      </dl>
      <small>
        {d.reference
          ? `Price reference ${amount(d.reference.price, d.reference.currency)} · ${dateLabel(d.reference.asOf)}. Dataset dates are not individual filing dates. A dated observation is not proof of current coverage.`
          : "A comparable price reference is not yet available."}
      </small>
    </section>
  );
}
