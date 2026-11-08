"use client";
import styles from "./AnalystTargets.module.css";
import type { Research } from "@/lib/types";
import { consensusOutlook } from "@/lib/outlook";
import { amount, percent, dateLabel } from "@/lib/format";
export default function AnalystTargets({
  research: r,
  showUnavailable = false,
}: {
  research: Research;
  showUnavailable?: boolean;
}) {
  const c = consensusOutlook(r);
  if (!c)
    return showUnavailable ? (
      <section
        className={`analyst-target-fallback ${styles.root}`}
        aria-label="Analyst price targets"
      >
        <span className="analyst-target-kicker">Wall Street consensus</span>
        <p>
          No current, usable analyst target is available in the supplied data.
        </p>
        <small>
          AURYN scenarios below are a separate calculation; they do not fill
          missing analyst coverage.
        </small>
      </section>
    ) : null;
  const reference = c.change == null ? null : r.quote.price;
  const minimum = Math.min(c.low ?? c.target, reference ?? c.target) * 0.95;
  const maximum = Math.max(c.high ?? c.target, reference ?? c.target) * 1.05;
  const position = (n: number) =>
    10 + ((n - minimum) / (maximum - minimum || 1)) * 280;

  return (
    <section
      className={`analyst-target-fallback ${styles.root}`}
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
            <line x1="10" x2="290" y1="20" y2="20" stroke="#e0e4e0" />
            {[
              [c.low, "#bd4a5b"],
              [c.target, "#a38232"],
              [c.high, "#098770"],
            ].map(([value, color]) => (
              <circle
                key={value}
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
      )}
    </section>
  );
}
