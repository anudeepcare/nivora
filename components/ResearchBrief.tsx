"use client";
import { useMemo } from "react";
import { TrendingUp, Diamond, Target, Activity } from "lucide-react";
import type { Research } from "@/lib/types";
import { indicators, latestFinancialEvidence } from "@/lib/analysis";
import { consensusOutlook } from "@/lib/outlook";
import { movementContext } from "@/lib/movement-context";
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
    const movement = movementContext(r, [], { now });
    const technical = indicators(r.history, new Date(now).toISOString());
    const consensus = consensusOutlook(r);
    const rows = [];
    if (movement.change != null)
      rows.push({
        key: "movement",
        icon: TrendingUp,
        tone: movement.change < 0 ? "caution" : "positive",
        text: `${percent(movement.change, true)} between ${movement.priceBasis === "settled-close" ? "completed closes" : "the quoted session references"}.`,
      });
    rows.push({
      key: "pace",
      icon: Diamond,
      tone: "pace",
      text:
        decision.pace?.level != null
          ? `${decision.actionLabel} · Zone P${decision.pace.level}. ${decision.pace.level < 2 ? "Watch for an entry; review before adding." : "Adding depends on the business checks and your position limits."}`
          : "Price history is still being assessed. Review the business evidence first.",
    });
    if (consensus?.referencePrice != null && consensus.target > 0)
      rows.push({
        key: "target",
        icon: Target,
        tone: "target",
        text: `${percent((consensus.target / consensus.referencePrice - 1) * 100, true)} to the ${amount(consensus.target, r.quote.currency)} analyst target.`,
      });
    if (technical.rsi != null)
      rows.push({
        key: "momentum",
        icon: Activity,
        tone: technical.rsi > 70 || technical.rsi < 30 ? "caution" : "neutral",
        text: `RSI ${technical.rsi.toFixed(1)} · ${technical.rsi > 70 ? "overbought" : technical.rsi < 30 ? "oversold" : "within the 30–70 range"}.${technical.ma200 != null && decision.reference ? ` Price is ${decision.reference.price < technical.ma200 ? "below" : "above"} its 200-session average.` : ""}`,
      });
    return rows.slice(0, 4);
  }, [r, now, owns, provided]);
  return (
    <section className={s.brief} aria-label="The 30-second read">
      <header>
        <h2>The 30-second read</h2>
        <small>Evidence through {dateLabel(r.retrievedAt)}</small>
      </header>
      <div className={s.briefGrid}>
        {model.map(({ key, icon: Icon, tone, text }) => (
          <article key={key} data-tone={tone}>
            <span className={s.icon}>
              <Icon
                size={18}
                fill={key === "pace" ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </span>
            <p>{text}</p>
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
  const rows = [
    {
      label: "Price",
      date: d.reference?.asOf,
      context:
        d.reference?.basis === "settled-close" ? "Completed close" : "Quote",
    },
    {
      label: "Analyst dataset",
      date:
        r.evidence?.consensus || r.evidence?.estimates?.length
          ? r.evidence.updatedAt
          : undefined,
      context: "",
    },
    {
      label: "Financial period",
      date: financial.latest?.end,
      context: financial.periodBasis,
    },
    {
      label: "Ownership dataset",
      date:
        r.evidence &&
        (r.evidence.ownership?.institutions != null ||
          r.evidence.ownership?.insiders != null ||
          r.evidence.holders?.length)
          ? r.evidence.updatedAt
          : undefined,
      context: "",
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
              <i data-available={!!row.date} />
              {row.date
                ? `${dateLabel(row.date)}${row.context ? " · " + row.context : ""}`
                : "Not supplied"}
            </dd>
          </div>
        ))}
      </dl>
      <small>
        {d.reference
          ? `Price reference ${amount(d.reference.price, d.reference.currency)} · ${dateLabel(d.reference.asOf)}. Dataset dates are not individual filing dates.`
          : "A comparable price reference is not yet available."}
      </small>
    </section>
  );
}
