"use client";
import { valuationScale } from "@/lib/research-summary";
import { amount, percent } from "@/lib/format";
export default function CaseRange({
  cases,
  price,
  currency,
  referenceLabel = "Current",
}: {
  cases: { name: string; target: number; change: number }[];
  price: number | null;
  currency: string;
  referenceLabel?: string;
}) {
  const scale =
    price != null
      ? valuationScale(
          cases.map((c) => c.target),
          price,
        )
      : null;
  return (
    <section
      className="case-range"
      aria-label="Scenario values on a shared price scale"
    >
      {scale && (
        <>
          <div className="case-scale-caption">
            <span>Scenario price range</span>
            <span>
              {referenceLabel} {amount(price, currency)}
            </span>
          </div>
          <svg
            viewBox="0 0 1000 75"
            role="img"
            aria-label={`${referenceLabel} ${price}; ${cases.map((c) => `${c.name} ${c.target.toFixed(2)}`).join(", ")}. Shared linear price scale.`}
          >
            <line
              x1="20"
              x2="980"
              y1="40"
              y2="40"
              stroke="var(--line)"
              strokeWidth="5"
            />
            {cases.map((c, i) => (
              <circle
                key={c.name}
                cx={
                  20 + (960 * (c.target - scale.min)) / (scale.max - scale.min)
                }
                cy="40"
                r="8"
                fill={`var(--${i === 0 ? "red" : i === 2 ? "green" : "blue"})`}
              >
                <title>
                  {c.name}: {amount(c.target, currency)}
                </title>
              </circle>
            ))}
            <line
              x1={20 + 9.6 * scale.quotePosition}
              x2={20 + 9.6 * scale.quotePosition}
              y1="14"
              y2="65"
              stroke="var(--ink)"
              strokeWidth="3"
            />
          </svg>
        </>
      )}
      <div className="case-range-values">
        {cases.map((c, i) => (
          <section key={c.name}>
            <span
              style={{
                color: `var(--${i === 0 ? "red" : i === 2 ? "green" : "blue"})`,
              }}
            >
              {c.name}
            </span>
            <strong>{amount(c.target, currency)}</strong>
            <small className={c.change < 0 ? "negative" : "positive"}>
              {percent(c.change, true)}
            </small>
          </section>
        ))}
      </div>
      <p className="small muted">
        Each marker uses the same price scale. These are assumption-based
        scenarios, not probabilities or validated targets.
      </p>
    </section>
  );
}
