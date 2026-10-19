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
      <span className="analyst-target-kicker">Wall Street consensus</span>
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
              c.change == null
                ? "muted"
                : c.change < 0
                  ? "negative"
                  : "positive"
            }
          >
            {percent(c.change, true)}
          </strong>
        </div>
      </div>
      <p className="analyst-target-quote">
        {c.referenceStatus === "older"
          ? "Older quote"
          : c.referenceStatus === "unavailable"
            ? "Last recorded quote"
            : "Current"}{" "}
        {amount(r.quote.price, r.quote.currency)} · observed{" "}
        {dateLabel(r.quote.asOf)}
      </p>
      <div className="analyst-target-note">
        <small>Analyst opinion · not AURYN fair value</small>
        <details>
          <summary>Coverage & dates</summary>
          <p>
            Target dataset updated {dateLabel(c.asOf)}. Target horizon and
            low/high range not supplied. This is not a guaranteed return.
          </p>
        </details>
      </div>
    </section>
  );
}
