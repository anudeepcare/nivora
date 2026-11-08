"use client";
import Link from "next/link";
import { ArrowUpRight, Diamond, ShieldAlert } from "lucide-react";
import {
  decisionAttention,
  type AttentionSignal,
} from "@/lib/decision-attention";
import { researchLink } from "@/lib/approved-workspace";
import { dateLabel } from "@/lib/format";
import s from "./DecisionAttention.module.css";
export default function DecisionAttention({
  symbols,
  held,
  rows,
  allocations,
  concentrationLimit,
  prefix,
  loading = false,
}: {
  symbols: string[];
  held: string[];
  rows: Record<string, { signal?: AttentionSignal; error?: string }>;
  allocations?: { symbol: string; weight: number }[];
  concentrationLimit?: number | null;
  prefix: string;
  loading?: boolean;
}) {
  if (!symbols.length) return null;
  const items = decisionAttention({
    symbols,
    held,
    rows,
    allocations,
    concentrationLimit,
  });
  const render = (item: (typeof items)[number]) => {
    const caution =
      item.sizeReview ||
      ["Sell", "Reduce", "Avoid", "Review"].includes(item.action);
    const Icon = caution ? ShieldAlert : Diamond;
    return (
      <article
        key={item.symbol}
        data-tone={
          caution
            ? "caution"
            : item.action === "Add" || item.action === "Buy"
              ? "positive"
              : "neutral"
        }
      >
        <div className={s.identity}>
          <Icon
            size={18}
            fill={caution ? "none" : "currentColor"}
            aria-hidden="true"
          />
          <Link href={researchLink(item.symbol, prefix)}>
            {item.symbol}
            <ArrowUpRight size={14} />
          </Link>
          <span>{item.label}</span>
        </div>
        <p>{item.reason}</p>
        <details>
          <summary>What to check next</summary>
          {item.risk && (
            <p>
              <strong>Risk:</strong> {item.risk}
            </p>
          )}
          <p>
            <strong>Reassess when:</strong>{" "}
            {item.changeCondition ??
              "Refresh the price and dated business evidence, then revisit the assessment."}
          </p>
          <small>
            {item.asOf
              ? `Price reference · ${dateLabel(item.asOf)}`
              : "Price reference date not supplied"}
            {item.businessPeriod
              ? ` · Financial period · ${dateLabel(item.businessPeriod)}`
              : ""}
            {item.sizeReview
              ? " · Weight excludes cash and unpriced holdings. A size review does not establish business deterioration."
              : ""}
          </small>
        </details>
      </article>
    );
  };
  return (
    <section className={s.root} aria-label="Review first">
      <header>
        <div>
          <h2>Review first</h2>
          <p>
            {loading
              ? "Assessments are loading; available rows appear first."
              : "Your existing assessments, ordered by review priority."}
          </p>
        </div>
        <span>{items.length} companies</span>
      </header>
      <div className={s.rows}>{items.slice(0, 3).map(render)}</div>
      {items.length > 3 && (
        <details className={s.more}>
          <summary>Review all {items.length} companies</summary>
          <div className={s.rows}>{items.slice(3).map(render)}</div>
        </details>
      )}
    </section>
  );
}
