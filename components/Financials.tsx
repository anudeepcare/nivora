"use client";
import { useMemo, useRef, useState } from "react";
import { Maximize2, Search, X } from "lucide-react";
import type { Research, FinancialPeriod } from "@/lib/types";
import {
  researchPeriods,
  applicableMetrics,
  type FinancialScope,
  type FinancialGroup,
  type MetricDefinition,
} from "@/lib/financial-catalog";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, Source, Empty } from "./Ui";
import s from "./ResearchWorkspace.module.css";
const groups: FinancialGroup[] = [
  "Essentials",
  "Profitability",
  "Cash flow",
  "Balance sheet",
];
export function metricText(
  m: MetricDefinition,
  v: number | null | undefined,
  currency: string,
) {
  if (v == null || !Number.isFinite(v)) return "—";
  return m.unit === "percent"
    ? percent(v)
    : m.unit === "ratio"
      ? `${v.toFixed(2)}×`
      : m.unit === "shares"
        ? Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 2,
          }).format(v)
        : amount(v, currency, m.unit !== "perShare");
}
export function FinancialPlot({
  rows,
  metric,
}: {
  rows: FinancialPeriod[];
  metric: MetricDefinition;
}) {
  const values = rows.map((r) => r[metric.key] ?? null),
    valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  const [active, setActive] = useState<number | null>(null);
  const activeIndex = active != null && active < rows.length ? active : null;
  if (valid.length < 2)
    return <div className={s.chartGap}>More comparable periods needed</div>;
  const min = Math.min(0, ...valid),
    max = Math.max(0, ...valid),
    span = max - min || 1,
    y = (v: number) => 146 - ((v - min) / span) * 120;
  const width = 238 / rows.length,
    base = y(0),
    color =
      metric.color === "green"
        ? "var(--teal)"
        : metric.color === "violet"
          ? "var(--purple)"
          : metric.color === "amber"
            ? "var(--amber)"
            : "var(--blue)";
  return (
    <div>
      <svg
        className={s.plot}
        viewBox="0 0 320 180"
        role="group"
        aria-label={`${metric.label} history`}
      >
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line
              x1="4"
              x2="246"
              y1={y(v)}
              y2={y(v)}
              stroke="var(--line)"
              strokeDasharray={v === 0 ? "0" : "3 4"}
            />
            <text x="252" y={y(v) + 4}>
              {metricText(metric, v, rows[0].currency)}
            </text>
          </g>
        ))}
        {values.map((v, i) =>
          v == null ? (
            <text
              key={i}
              x={6 + i * width + width / 2}
              y={base - 5}
              textAnchor="middle"
            >
              —
            </text>
          ) : (
            <rect
              key={i}
              x={6 + i * width + 3}
              y={Math.min(base, y(v))}
              width={Math.max(3, width - 9)}
              height={Math.max(1, Math.abs(base - y(v)))}
              rx="3"
              fill={color}
              opacity={active == null || active === i ? 1 : 0.45}
              tabIndex={0}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`${dateLabel(rows[i].end)}: ${metricText(metric, v, rows[i].currency)}`}
            >
              <title>
                {dateLabel(rows[i].end)} ·{" "}
                {metricText(metric, v, rows[i].currency)}
              </title>
            </rect>
          ),
        )}
        {rows.map((r, i) => (
          <text
            key={`${r.start}-${r.end}`}
            x={6 + i * width + width / 2}
            y="170"
            textAnchor="middle"
          >
            {rows.length <= 6
              ? new Date(r.end).toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                })
              : i % 2 === 0
                ? r.end.slice(0, 4)
                : ""}
          </text>
        ))}
      </svg>
      <p className={s.caption} aria-live="polite">
        {activeIndex != null
          ? `${dateLabel(rows[activeIndex].end)} · ${metricText(metric, values[activeIndex], rows[activeIndex].currency)}`
          : `${dateLabel(rows[0].end)} – ${dateLabel(rows.at(-1)!.end)}`}
      </p>
    </div>
  );
}
export default function Financials({
  research,
  compact = false,
}: {
  research: Research;
  compact?: boolean;
}) {
  const [scope, setScope] = useState<FinancialScope>(() =>
      researchPeriods(research, "ttm").length ? "ttm" : "annual",
    ),
    [group, setGroup] = useState<FinancialGroup>("Essentials"),
    [query, setQuery] = useState(""),
    [view, setView] = useState<"charts" | "statements">("charts"),
    [selected, setSelected] = useState<MetricDefinition | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const rows = useMemo(
      () => researchPeriods(research, scope).slice(-8),
      [research, scope],
    ),
    last = rows.at(-1);
  const all = useMemo(() => applicableMetrics(research), [research]);
  const available = all.filter((m) => rows.some((r) => r[m.key] != null));
  const core = [
    "revenue",
    "netIncome",
    "fcf",
    "margin",
    "grossMargin",
    "fcfMargin",
  ];
  const shown = compact
    ? core
        .map((k) => available.find((m) => m.key === k))
        .filter((m): m is MetricDefinition => !!m)
    : available.filter((m) =>
        query
          ? `${m.label} ${m.help}`.toLowerCase().includes(query.toLowerCase())
          : group === "Essentials"
            ? core.includes(m.key) || m.group === "Essentials"
            : m.group === group,
      );
  return (
    <section className={s.workspace}>
      <header className={s.heading}>
        <div>
          <h2>{compact ? "Financial picture" : "Financials"}</h2>
          <p>
            {last
              ? `${scope === "ttm" ? "Trailing 12 months" : scope === "quarterly" ? "Standalone quarters" : "Annual statements"} · ${last.currency} · ${last.basis}`
              : "Reported company evidence"}
          </p>
        </div>
        <div className={s.controls} aria-label="Financial period">
          {(["annual", "quarterly", "ttm"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={scope === v}
              onClick={() => setScope(v)}
            >
              {v === "ttm" ? "TTM" : v === "annual" ? "Annual" : "Quarterly"}
            </button>
          ))}
        </div>
      </header>
      {!last ? (
        <Empty title="Financial history is unavailable">
          {research.issues.find((i) => /compan|financial|filing/i.test(i)) ||
            "No comparable reported periods were returned."}
        </Empty>
      ) : (
        <>
          {!compact && (
            <>
              <div className={s.filters}>
                <label className={s.search}>
                  <Search size={17} />
                  <input
                    aria-label="Search financial metrics"
                    placeholder="Find a metric — cash flow, margins, debt…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className={s.controls}>
                  {(["charts", "statements"] as const).map((v) => (
                    <button
                      key={v}
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                    >
                      {v === "charts" ? "Charts" : "Statements"}
                    </button>
                  ))}
                </div>
              </div>
              <div className={s.filters} aria-label="Metric groups">
                {groups.map((g) => (
                  <button
                    key={g}
                    aria-pressed={group === g && !query}
                    onClick={() => {
                      setGroup(g);
                      setQuery("");
                    }}
                  >
                    {g}
                  </button>
                ))}
                <span className={s.caption}>
                  {available.length} supported metrics
                </span>
              </div>
            </>
          )}
          {view === "charts" || compact ? (
            <div className={s.grid}>
              {shown.map((m) => (
                <article key={m.key} className={s.card}>
                  <div className={s.cardTop}>
                    <span>{m.label}</span>
                    <div>
                      <Help label={m.label}>{m.help}</Help>
                      <button
                        className={s.expand}
                        aria-label={`Expand ${m.label}`}
                        onClick={() => {
                          setSelected(m);
                          dialog.current?.showModal();
                        }}
                      >
                        <Maximize2 size={15} />
                      </button>
                    </div>
                  </div>
                  <strong className={s.number}>
                    {metricText(m, last[m.key], last.currency)}
                  </strong>
                  {last[m.key] == null && (
                    <small>Not reported for the latest period</small>
                  )}
                  <FinancialPlot rows={rows.slice(-6)} metric={m} />
                </article>
              ))}
            </div>
          ) : (
            <div className={s.table}>
              <table>
                <caption>
                  {group} · {last.currency}
                </caption>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {[...rows].reverse().map((r) => (
                      <th key={r.end}>{dateLabel(r.end)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => (
                    <tr key={m.key}>
                      <th>
                        {m.label} <Help label={m.label}>{m.help}</Help>
                      </th>
                      {[...rows].reverse().map((r) => (
                        <td key={r.end}>
                          {metricText(m, r[m.key], r.currency)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!shown.length && (
            <p className={s.empty}>
              No reported values match this selection. Try another group or
              period.
            </p>
          )}
          <div className={s.source}>
            <span>Period ended {dateLabel(last.end)}</span>
            {(last.sourceUrls ?? [last.sourceUrl])
              .filter(Boolean)
              .map((url, i) => (
                <Source key={url} href={url}>
                  Filing {i + 1}
                </Source>
              ))}
            {scope === "ttm" && (
              <span>
                Four consecutive quarters; balance sheet at final period end.
              </span>
            )}
          </div>
        </>
      )}
      <dialog
        ref={dialog}
        className={s.dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        aria-label={selected?.label || "Metric detail"}
      >
        <header className={s.heading}>
          <h2>{selected?.label}</h2>
          <button
            className={s.close}
            aria-label="Close metric detail"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        {selected && (
          <>
            <p className={s.caption}>{selected.help}</p>
            <FinancialPlot rows={rows} metric={selected} />
            <div className={s.table}>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Value</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.end}>
                      <th>{dateLabel(r.end)}</th>
                      <td>
                        {metricText(selected, r[selected.key], r.currency)}
                      </td>
                      <td>
                        <Source href={r.sourceUrl}>Filing</Source>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
