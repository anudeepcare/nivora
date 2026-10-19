"use client";
import type { Research } from "@/lib/types";
import { consensusOutlook } from "@/lib/outlook";
import { amount, dateLabel } from "@/lib/format";
export default function ValuationMethods({
  research: r,
  cashCases,
}: {
  research: Research;
  cashCases: { name: string; value: number | null }[];
}) {
  const consensus = consensusOutlook(r),
    rows = [
      {
        label: "Cash-flow sensitivity · your assumptions",
        note: "Ten-year discounted flows and terminal value; not a dated analyst target.",
        points: cashCases
          .filter(
            (p) => p.value != null && Number.isFinite(p.value) && p.value > 0,
          )
          .map((p) => ({ label: p.name, value: p.value! })),
      },
      ...(consensus
        ? [
            {
              label: "Analyst consensus · target horizon not supplied",
              note: "Published opinion; not intrinsic value.",
              points: [{ label: "Consensus", value: consensus.target }],
            },
          ]
        : []),
    ].filter((row) => row.points.length);
  const price = r.quote.price;
  if (!price || price <= 0 || r.quote.stale || !rows.length) return null;
  const max =
      Math.max(
        price,
        ...rows.flatMap((row) => row.points.map((p) => p.value)),
      ) * 1.12,
    x = (value: number) => 30 + (940 * value) / max;
  return (
    <section className="valuation-methods">
      <header>
        <span className="eyebrow">
          VALUATION TRIANGULATION · ONE PRICE SCALE
        </span>
        <h3>Different questions, different values</h3>
        <p>
          Cash-flow assumptions, forecast multiples and analyst opinions are
          separate methods. Their central values can disagree without either
          being a verified fair value. All displayed values are in{" "}
          {r.quote.currency}.
        </p>
      </header>
      <svg
        viewBox={`0 0 1000 ${rows.length * 92 + 40}`}
        role="img"
        aria-label={`Shared linear scale; current ${amount(price, r.quote.currency)}. ${rows.map((row) => row.label + ": " + row.points.map((p) => p.label + " " + amount(p.value, r.quote.currency)).join(", ")).join(". ")}`}
      >
        <line
          x1={x(price)}
          x2={x(price)}
          y1="12"
          y2={rows.length * 92 + 15}
          stroke="var(--ink)"
          strokeWidth="2"
        />
        <text
          x={Math.min(840, x(price) + 8)}
          y="16"
          fill="var(--ink)"
          fontSize="13"
        >
          Current {amount(price, r.quote.currency)}
        </text>
        {rows.map((row, i) => (
          <g key={row.label}>
            <text x="30" y={44 + i * 92} fill="var(--muted)" fontSize="12">
              {row.label}
            </text>
            <line
              x1="30"
              x2="970"
              y1={62 + i * 92}
              y2={62 + i * 92}
              stroke="var(--line)"
              strokeWidth="4"
            />
            {row.points.map((p, j) => (
              <circle
                key={p.label}
                cx={x(p.value)}
                cy={62 + i * 92}
                r="7"
                fill={`var(--${j === 0 && row.points.length > 1 ? "red" : j === 2 ? "green" : "blue"})`}
              >
                <title>
                  {p.label} {amount(p.value, r.quote.currency)}
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="method-values">
        {rows.map((row) => (
          <section key={row.label}>
            <h4>{row.label}</h4>
            <div>
              {row.points.map((p) => (
                <span key={p.label}>
                  {p.label}
                  <strong>{amount(p.value, r.quote.currency)}</strong>
                </span>
              ))}
            </div>
            <small>{row.note}</small>
          </section>
        ))}
      </div>
    </section>
  );
}
