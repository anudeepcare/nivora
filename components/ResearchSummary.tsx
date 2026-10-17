"use client";
import { useMemo, useState } from "react";
import { ShieldAlert, TrendingUp, Info } from "lucide-react";
import type { Research } from "@/lib/types";
import { perspective, latestFinancialEvidence } from "@/lib/analysis";
import { researchPeriods } from "@/lib/financial-catalog";
import {
  financialCase,
  marketMultiples,
  earningsScenario,
} from "@/lib/research-summary";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, Source } from "./Ui";
import s from "./ResearchWorkspace.module.css";
export function ResearchSnapshot({
  research: r,
  onDca,
}: {
  research: Research;
  onDca: () => void;
}) {
  const p = useMemo(() => perspective(r), [r]);
  const rows = useMemo(() => researchPeriods(r, "annual"), [r]);
  const last = rows.at(-1),
    multiples = useMemo(() => marketMultiples(r, last), [r, last]);
  const metrics = [
    [
      "Revenue growth",
      percent(p.growth, true),
      "Comparable annual revenue growth; this is historical, not a forecast.",
    ],
    [
      "Gross margin",
      percent(last?.grossMargin),
      "Gross profit divided by revenue for the annual period.",
    ],
    [
      "Operating margin",
      percent(last?.margin),
      "Operating income as a share of annual revenue.",
    ],
    [
      "Free cash flow",
      amount(last?.fcf, last?.currency, true),
      "Operating cash flow less cash capital expenditure.",
    ],
    [
      "P/E · annual",
      multiples.pe == null ? "—" : `${multiples.pe.toFixed(1)}×`,
      "Current market capitalization divided by annual net income. Not forward or TTM P/E. Requires recent reconciled shares and a current same-currency quote.",
    ],
    [
      "FCF yield · annual",
      percent(multiples.fcfYield),
      "Annual free cash flow divided by current market capitalization; not a forecast yield.",
    ],
    [
      "Cash & equivalents",
      amount(last?.cash, last?.currency, true),
      "Cash and equivalents at the stated reporting date.",
    ],
    [
      "Entry trend",
      p.tech.trend,
      "Price relative to the 50- and 200-day averages. Separate from business quality.",
    ],
  ];
  return (
    <section className={s.summary}>
      <div className={s.summaryTitle}>
        <div>
          <span className={s.pill}>{r.snapshot?.newCapital ?? p.business}</span>
          <h2>{p.heading}</h2>
          <p>
            {last
              ? `Annual evidence · ${dateLabel(last.end)} · ${last.currency}`
              : "Financial evidence is incomplete."}
          </p>
        </div>
        <button className={s.dca} onClick={onDca}>
          <span>Monthly DCA</span>
          <strong>
            {p.dca.confirmed ? `${p.dca.confirmed.multiplier}×` : "—"}
          </strong>
          <span>
            {p.dca.confirmed
              ? `${p.dca.confirmed.month} · View rules`
              : "View coverage"}
          </span>
        </button>
      </div>
      <div className={s.stats}>
        {metrics.map(([label, value, help]) => (
          <div key={label} className={s.stat}>
            <span>
              {label}
              <Help label={label}>{help}</Help>
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
export function InvestmentCase({ research: r }: { research: Research }) {
  const evidence = useMemo(() => latestFinancialEvidence(r), [r]),
    last = evidence.latest,
    prior = evidence.prior,
    c = useMemo(() => financialCase(last, prior), [last, prior]);
  if (r.company.assetType === "crypto") return null;
  return (
    <section>
      <header className={s.heading}>
        <div>
          <h2>Financial strengths & risks</h2>
          <p>
            {evidence.periodBasis} evidence · {dateLabel(last?.end)}
          </p>
        </div>
        <Source href={r.filings.find((f) => f.url)?.url || last?.sourceUrl}>
          Source details
        </Source>
      </header>
      <div className={s.evidenceCards}>
        {[
          ...c.positive.map((f) => ({
            ...f,
            tone: "positive",
            label: "Strength",
            Icon: TrendingUp,
          })),
          ...c.risks.map((f) => ({
            ...f,
            tone: "risk",
            label: "Risk to assess",
            Icon: ShieldAlert,
          })),
          ...c.context.map((f) => ({
            ...f,
            tone: "context",
            label: "Balance sheet",
            Icon: Info,
          })),
        ].map(({ Icon, ...f }) => (
          <article className={s.evidenceCard} data-tone={f.tone} key={f.key}>
            <small>
              <Icon size={15} aria-hidden="true" />
              {f.label}
            </small>
            <div>
              <h3>{f.title}</h3>
              <strong>
                {f.unit === "percent"
                  ? percent(f.value)
                  : f.unit === "ratio"
                    ? `${f.value.toFixed(1)}×`
                    : amount(f.value, last?.currency, true)}
              </strong>
            </div>
            <p>{f.text}</p>
          </article>
        ))}
      </div>
      {c.gaps.length > 0 && (
        <p className={s.caption}>Evidence gaps: {c.gaps.join(" ")}</p>
      )}
      <p className={s.caption}>
        Financial evidence only. Business moat, catalysts and valuation are
        separate parts of the research.
      </p>
    </section>
  );
}
export function ValuationMultiples({ research: r }: { research: Research }) {
  const rows = useMemo(() => researchPeriods(r, "annual"), [r]),
    last = rows.at(-1),
    v = useMemo(() => marketMultiples(r, last), [r, last]);
  return (
    <section>
      <header className={s.heading}>
        <div>
          <h2>Price in context</h2>
          <p>
            Current quote against annual statements · {dateLabel(last?.end)}
          </p>
        </div>
        <Help label="Valuation multiples">
          These annual multiples are calculated from the dated financial
          evidence and current quote. No forward estimates or analyst targets
          are implied. Negative or missing denominators, stale quotes and
          unreconciled ADRs are withheld.
        </Help>
      </header>
      <div className={s.stats}>
        {[
          ["Market cap", amount(v.marketCap, r.quote.currency, true)],
          ["P/E", v.pe == null ? "—" : `${v.pe.toFixed(1)}×`],
          ["Price / sales", v.ps == null ? "—" : `${v.ps.toFixed(1)}×`],
          ["FCF yield", percent(v.fcfYield)],
        ].map(([k, v]) => (
          <div className={s.stat} key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
export function EarningsScenario({ research: r }: { research: Research }) {
  const [growth, setGrowth] = useState(10),
    [multiple, setMultiple] = useState(20),
    [discount, setDiscount] = useState(10);
  const p = useMemo(() => researchPeriods(r, "annual").at(-1), [r]);
  const current = useMemo(() => latestFinancialEvidence(r).latest, [r]);
  const adr = r.facts.some(
    (f) => f.end === p?.end && /^(20-F|40-F)/.test(f.form),
  );
  const eligible =
    current?.netIncome != null &&
    current.netIncome > 0 &&
    p?.eps != null &&
    p.eps > 0 &&
    p.currency === r.quote.currency &&
    !adr &&
    Date.parse(r.retrievedAt) - Date.parse(p.end) < 550 * 86400000;
  if (!eligible) return null;
  const scenarios = [
    ["Bear", growth - 10, Math.max(5, multiple - 5)],
    ["Base", growth, multiple],
    ["Bull", growth + 10, multiple + 5],
  ] as const;
  return (
    <section className={s.scenario}>
      <header className={s.heading}>
        <div>
          <h2>Your earnings assumptions</h2>
          <p>
            Five-year illustration · annual diluted EPS{" "}
            {amount(p!.eps, p!.currency)} · {dateLabel(p!.end)}
          </p>
        </div>
        <Help label="Earnings scenario">
          Grow annual diluted EPS by the stated rate for five years, apply an
          exit P/E, then discount that terminal share price. These are your
          assumptions, not consensus estimates. EPS growth is per share; no
          separate dilution assumption is added. Dividends are excluded. Bear
          and bull change growth by ten percentage points and the multiple by
          five.
        </Help>
      </header>
      <div className={s.scenarioGrid}>
        {scenarios.map(([name, g, pe]) => {
          const value = earningsScenario(p!.eps!, g, pe, discount, 0)!;
          return (
            <article key={name}>
              <span>{name}</span>
              <strong>{amount(value.presentValue, p!.currency)}</strong>
              <small>
                {g}% EPS growth · {pe}× exit P/E
                <br />
                Year-five price {amount(value.exitPrice, p!.currency)}
              </small>
            </article>
          );
        })}
      </div>
      <div className={s.inputs}>
        {[
          {
            label: "Base EPS growth",
            value: growth,
            set: setGrowth,
            min: -20,
            max: 40,
            suffix: "%",
          },
          {
            label: "Base exit P/E",
            value: multiple,
            set: setMultiple,
            min: 5,
            max: 50,
            suffix: "×",
          },
          {
            label: "Required return",
            value: discount,
            set: setDiscount,
            min: 5,
            max: 20,
            suffix: "%",
          },
        ].map((x) => (
          <label key={x.label}>
            {x.label}
            <b>
              {x.value}
              {x.suffix}
            </b>
            <input
              aria-label={x.label}
              type="range"
              min={x.min}
              max={x.max}
              value={x.value}
              onChange={(e) => x.set(Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <p className={s.caption}>
        Values shown are discounted scenarios, not price targets or automatic
        buy/sell ratings.
      </p>
    </section>
  );
}
