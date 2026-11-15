"use client";
import { Help } from "./Ui";
import styles from "./AnalystTargets.module.css";
import type { Research } from "@/lib/types";
import { consensusOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
export default function AnalystTargets({
  research: r,
  showUnavailable = false,
  embedded = false,
}: {
  research: Research;
  showUnavailable?: boolean;
  embedded?: boolean;
}) {
  const c = consensusOutlook(r);
  if (!c)
    return showUnavailable ? (
      <section
        className={`analyst-target-fallback ${styles.root}`}
        data-embedded={embedded || undefined}
        aria-label="Analyst price targets"
      >
        <span className="analyst-target-kicker">Wall Street consensus</span>
        <p>Current target unavailable.</p>
        <Help label="Missing analyst target">
          AURYN scenarios are separate calculations, not substitutes for missing
          analyst targets.
        </Help>
      </section>
    ) : null;
  const reference = c.referencePrice;
  const minimum = Math.min(c.low ?? c.target, reference ?? c.target) * 0.95;
  const maximum = Math.max(c.high ?? c.target, reference ?? c.target) * 1.05;
  const position = (n: number) =>
    10 + ((n - minimum) / (maximum - minimum || 1)) * 280;

  return (
    <section
      className={`analyst-target-fallback ${styles.root}`}
      data-embedded={embedded || undefined}
      aria-label="Analyst price targets"
    >
      <span className="analyst-target-kicker">Wall Street consensus</span>
      {c.low != null && c.high != null ? (
        <div className="analyst-target-range">
          <div>
            {[
              ["Low", c.low],
              ["Consensus", c.target],
              ["High", c.high],
            ].map(([label, value]) => (
              <section key={label} data-target={label}>
                <span>{label}</span>
                <strong>{amount(Number(value), r.quote.currency)}</strong>
                <small
                  className={
                    reference != null && Number(value) < reference
                      ? "negative"
                      : "positive"
                  }
                >
                  {reference != null
                    ? percent((Number(value) / reference - 1) * 100, true)
                    : "Comparison unavailable"}
                </small>
              </section>
            ))}
          </div>
          <svg
            viewBox="0 0 300 40"
            role="img"
            aria-label="Reported analyst low, consensus and high targets on one price scale"
          >
            <line x1="10" x2="290" y1="20" y2="20" stroke="var(--line)" />
            {[
              [c.low, "var(--negative)"],
              [c.target, "var(--neutral)"],
              [c.high, "var(--positive)"],
            ].map(([value, color]) => (
              <circle
                key={color}
                cx={position(Number(value))}
                cy="20"
                r="4"
                fill={String(color)}
              />
            ))}
            {reference != null && (
              <line
                x1={position(reference)}
                x2={position(reference)}
                y1="9"
                y2="31"
                stroke="currentColor"
              />
            )}
          </svg>
          <small>Analyst low · consensus · high</small>
        </div>
      ) : (
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
                  : c.referenceBasis === "settled-close"
                    ? "Versus closing price"
                    : "Versus current quote"}
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
      )}
      {c.rangeStatus !== "complete" && (
        <p>
          {c.rangeStatus === "missing"
            ? "Target range unavailable."
            : "Target range invalid."}
        </p>
      )}
      <small>
        Analyst opinion{c.analysts != null ? ` · ${c.analysts} analysts` : ""}
      </small>
      <Help label="Target dates and comparison">
        Updated {dateLabel(c.asOf)}. Individual revisions and forecast horizon
        are not supplied. This is not AURYN fair value or a guaranteed return.
        {c.referenceAsOf && (
          <p>
            Compared with {amount(c.referencePrice, r.quote.currency)} ·{" "}
            {c.referenceBasis === "settled-close" ? "closing price" : "quote"} ·{" "}
            {dateLabel(c.referenceAsOf)}.
          </p>
        )}
      </Help>
    </section>
  );
}
