"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Diamond,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  history,
  selectHistory,
  stages,
  stageLabel,
} from "@/lib/presentation/preview";
import s from "./Preview.module.css";
export function Brand() {
  return (
    <span className={s.brand}>
      <svg viewBox="0 0 36 38" aria-hidden="true">
        <path d="M3 31 16 5h5L8 31Z" fill="currentColor" />
        <path d="m18 15 10 16h6L22 10Z" fill="currentColor" opacity=".5" />
        <path d="m13 25 4-8 5 8Z" fill="currentColor" />
      </svg>
      <span>
        AURYN<span className={s.brandDot}>.</span>
      </span>
    </span>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
}) {
  return (
    <button className={secondary ? s.secondary : s.primary} onClick={onClick}>
      {children}
    </button>
  );
}
export function Title({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className={s.title}>
      <div>
        <span className={s.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Metric({
  label,
  value,
  detail,
  positive = false,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <div className={s.metric}>
      <span>{label}</span>
      <strong className={positive ? s.positive : ""}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function Section({
  title,
  detail,
  children,
  action,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={s.section}>
      <header className={s.sectionHead}>
        <div>
          <h2>{title}</h2>
          {detail && <p>{detail}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Pace({
  stage = 3,
  onEvidence,
  hero = false,
}: {
  stage?: number;
  onEvidence?: () => void;
  hero?: boolean;
}) {
  const [selected, setSelected] = useState(stage);
  return (
    <section className={`${s.pace} ${hero ? s.paceHero : ""}`}>
      <header>
        <span>
          <Diamond size={15} /> AURYN PACE
        </span>
        <span className={s.paceTag}>Illustrative</span>
      </header>
      <div className={s.paceHeading}>
        <span>YOUR NEXT STEP</span>
        <h2>
          {stageLabel(selected)}
          <em>.</em>
        </h2>
        <p>
          {selected < 2
            ? "Observe the conditions. Keep your plan in view."
            : "A measured contribution. Within your limits."}
        </p>
      </div>
      <div className={s.paceSteps} aria-label="Explore Pace stages">
        {stages.map((label, i) => (
          <button
            key={label}
            onClick={() => setSelected(i)}
            aria-label={`P${i} ${label}`}
            aria-pressed={selected === i}
            className={selected === i ? s.paceSelected : ""}
          >
            <span>P{i}</span>
            <div>
              <i />
              <i />
              <i />
            </div>
            <small>{["Pause", "Watch", "Start", "Gradual", "Deep"][i]}</small>
          </button>
        ))}
      </div>
      <div className={s.paceFoot}>
        <span>
          <ShieldCheck size={16} /> Business checks supported
        </span>
        <span>Confirmed · Oct 31</span>
      </div>
      <button className={s.paceLink} onClick={onEvidence}>
        Why this Pace? <ArrowRight size={16} />
      </button>
    </section>
  );
}
export function Chart({
  compact = false,
  price = 128.4,
}: {
  compact?: boolean;
  price?: number;
}) {
  const [range, setRange] = useState("1Y");
  const [candles, setCandles] = useState(false);
  const [average, setAverage] = useState(false);
  const [point, setPoint] = useState<number | null>(null);
  const scaledHistory = history.map((p) => ({
    ...p,
    value: (p.value * price) / 128.4,
  }));
  const points = selectHistory(scaledHistory, range);
  const min = Math.min(...points.map((p) => p.value)) - 4,
    max = Math.max(...points.map((p) => p.value)) + 4;
  const x = (i: number) => 40 + (i / Math.max(1, points.length - 1)) * 700,
    y = (v: number) => 220 - ((v - min) / (max - min)) * 175;
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
    .join(" ");
  const active =
    point == null ? points.length - 1 : Math.min(point, points.length - 1);
  return (
    <div className={s.chart}>
      <div className={s.chartTools}>
        <div className={s.segment}>
          {["1W", "1M", "3M", "6M", "1Y", "All"].map((r) => (
            <button
              aria-pressed={range === r}
              onClick={() => {
                setRange(r);
                setPoint(null);
              }}
              key={r}
            >
              {r}
            </button>
          ))}
        </div>
        <button className={s.quiet} onClick={() => setCandles(!candles)}>
          {candles ? "Candles" : "Line"} <ChevronDown size={14} />
        </button>
      </div>
      <div className={s.chartQuote}>
        <span>{points[active].date} · Sample close</span>
        <strong>${points[active].value.toFixed(2)}</strong>
      </div>
      <svg
        className={compact ? s.chartCompact : s.chartSvg}
        viewBox="0 0 800 270"
        role="img"
        aria-label={`Illustrative ${range} price chart, ${candles ? "candlesticks" : "line"}`}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          setPoint(
            Math.round(
              Math.max(
                0,
                Math.min(
                  1,
                  (((e.clientX - b.left) / b.width) * 800 - 40) / 700,
                ),
              ) *
                (points.length - 1),
            ),
          );
        }}
        onPointerLeave={() => setPoint(null)}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="40"
              x2="740"
              y1={45 + i * 44}
              y2={45 + i * 44}
              className={s.gridline}
            />
            <text x="754" y={49 + i * 44}>
              {(max - (i * (max - min)) / 4).toFixed(0)}
            </text>
          </g>
        ))}
        {candles ? (
          points
            .filter(
              (_, i) => i % Math.max(1, Math.floor(points.length / 55)) === 0,
            )
            .map((p, i, arr) => {
              const open = p.value + Math.sin(i * 7) * 2;
              return (
                <g key={p.date} stroke={open < p.value ? "#087f68" : "#b83e4b"}>
                  <line
                    x1={40 + (i / (arr.length - 1)) * 700}
                    x2={40 + (i / (arr.length - 1)) * 700}
                    y1={y(p.value + 2)}
                    y2={y(p.value - 2)}
                  />
                  <rect
                    x={37 + (i / (arr.length - 1)) * 700}
                    y={Math.min(y(open), y(p.value))}
                    width="6"
                    height={Math.max(2, Math.abs(y(open) - y(p.value)))}
                    fill="currentColor"
                    style={{ color: open < p.value ? "#087f68" : "#b83e4b" }}
                  />
                </g>
              );
            })
        ) : (
          <>
            <path d={`${path} L740,221 L40,221Z`} fill="var(--chart-fill)" />
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </>
        )}
        {average && (
          <path
            d={points
              .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value * 0.96)}`)
              .join(" ")}
            fill="none"
            stroke="#b07925"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}
        {point !== null && (
          <>
            <line
              x1={x(active)}
              x2={x(active)}
              y1="35"
              y2="222"
              stroke="var(--muted)"
              strokeDasharray="3 4"
            />
            <circle
              cx={x(active)}
              cy={y(points[active].value)}
              r="5"
              fill="var(--accent)"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}
        <text x="40" y="251">
          {points[0].date}
        </text>
        <text x="640" y="251">
          {points.at(-1)?.date}
        </text>
      </svg>
      <footer className={s.chartFoot}>
        <button
          className={s.quiet}
          aria-pressed={average}
          onClick={() => setAverage(!average)}
        >
          <span className={s.swatch} /> {average ? "Hide" : "Show"} trend
          reference
        </button>
        <small>Illustrative history · hover to inspect</small>
      </footer>
    </div>
  );
}
export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className={s.tableScroll}>
      <table className={s.table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className={s.note}>
      <Info size={16} />
      <span>{children}</span>
    </p>
  );
}
export function LinkAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={s.link} onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
