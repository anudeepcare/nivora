"use client";
import type { Research } from "@/lib/types";
import { consensusOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
export default function AnalystTargets({
  research: r,
}: {
  research: Research;
}) {
  const c = consensusOutlook(r);
  if (!c) return null;
  return (
    <section
      className="analyst-target-fallback"
      aria-label="Analyst price targets"
    >
      <span className="eyebrow">ANALYST PRICE TARGETS</span>
      <div className="analyst-target-main">
        <div>
          <span>Consensus</span>
          <strong>{amount(c.target, r.quote.currency)}</strong>
        </div>
        <div>
          <span>
            {c.referenceStatus === "older"
              ? "Versus older quote"
              : c.referenceStatus === "unavailable"
                ? "Price comparison unavailable"
                : "Versus current price"}
          </span>
          <strong
            className={
              c.change != null && c.change < 0 ? "negative" : "positive"
            }
          >
            {percent(c.change, true)}
          </strong>
        </div>
      </div>
      <p>
        {c.referenceStatus === "older"
          ? "Older quote"
          : c.referenceStatus === "unavailable"
            ? "Last recorded quote"
            : "Current"}{" "}
        {amount(r.quote.price, r.quote.currency)} · observed{" "}
        {dateLabel(r.quote.asOf)}
      </p>
      <small>
        Target dataset updated {dateLabel(c.asOf)}. Target horizon and low/high
        range not supplied. Analyst opinion—not AURYN fair value or a guaranteed
        return.
      </small>
    </section>
  );
}
