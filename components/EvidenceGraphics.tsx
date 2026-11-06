import { seriesGeometry, type EvidencePoint } from "@/lib/evidence-graphics";
import { amount, percent } from "@/lib/format";
export function EvidenceSeries({
  points,
  label,
  kind = "bar",
  tone = "blue",
  format = "amount",
  currency = "USD",
}: {
  points: EvidencePoint[];
  label: string;
  kind?: "bar" | "line";
  tone?: "blue" | "green" | "violet";
  format?: "amount" | "percent" | "number";
  currency?: string;
}) {
  const g = seriesGeometry(points, kind);
  if (!g) return null;
  const fmt = (v: number) =>
    format === "percent"
      ? percent(v)
      : format === "amount"
        ? amount(v, currency, true)
        : v.toFixed(0);
  return (
    <figure
      className="evidence-series"
      data-tone={tone}
      data-direction={g.points.at(-1)!.value < 0 ? "negative" : "nonnegative"}
    >
      <figcaption>
        {label}
        <strong>{fmt(g.points.at(-1)!.value)}</strong>
      </figcaption>
      <svg
        viewBox="0 0 240 104"
        role="img"
        aria-label={`${label}: ${g.points.map((p) => `${p.label} ${fmt(p.value)}`).join("; ")}`}
      >
        <line
          x1="5"
          x2="235"
          y1={kind === "bar" ? g.zero : 75}
          y2={kind === "bar" ? g.zero : 75}
          className="graphic-baseline"
        />
        {kind === "line" && g.points.length > 1 && (
          <polyline
            points={g.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {g.points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            {kind === "bar" ? (
              <rect
                x={p.x - 9}
                y={Math.min(p.y, g.zero)}
                width="18"
                height={Math.max(1, Math.abs(p.y - g.zero))}
                rx="3"
                fill="currentColor"
                opacity={0.4 + (0.6 * (i + 1)) / g.points.length}
              />
            ) : (
              <circle cx={p.x} cy={p.y} r="3" fill="currentColor" />
            )}
            <title>{`${p.label}: ${fmt(p.value)}`}</title>
            {(g.points.length <= 6 || i === 0 || i === g.points.length - 1) && (
              <text x={p.x} y="97" textAnchor="middle" className="graphic-axis">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}
export function RsiGraphic({ value }: { value: number | null }) {
  if (value == null || !Number.isFinite(value)) return null;
  return (
    <div className="rsi-graphic">
      <div>
        <span>Momentum · RSI (14)</span>
        <strong>
          {value.toFixed(0)}
          <small>/100</small>
        </strong>
      </div>
      <svg
        viewBox="0 0 220 48"
        role="img"
        aria-label={`RSI ${value.toFixed(1)} out of 100. Below 30 is conventionally oversold; above 70 overbought.`}
      >
        <rect
          x="8"
          y="10"
          width="61"
          height="10"
          rx="5"
          fill="var(--green-soft)"
        />
        <rect
          x="71"
          y="10"
          width="78"
          height="10"
          rx="5"
          fill="var(--blue-soft)"
        />
        <rect
          x="151"
          y="10"
          width="61"
          height="10"
          rx="5"
          fill="var(--red-soft)"
        />
        <circle
          cx={8 + (204 * Math.max(0, Math.min(100, value))) / 100}
          cy="15"
          r="6"
          fill="currentColor"
          stroke="var(--surface)"
          strokeWidth="2"
        />
        <text x="8" y="40" className="graphic-axis">
          0
        </text>
        <text x="69" y="40" className="graphic-axis">
          30
        </text>
        <text x="149" y="40" className="graphic-axis">
          70
        </text>
        <text x="212" y="40" textAnchor="end" className="graphic-axis">
          100
        </text>
      </svg>
    </div>
  );
}
