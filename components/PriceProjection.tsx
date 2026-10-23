"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { financialPeriods } from "@/lib/engine";
import { modelCoverage } from "@/lib/research-depth";
import { projectEarnings, type ProjectionInputs } from "@/lib/price-projection";
import { amount, dateLabel } from "@/lib/format";
export default function PriceProjection({
  research: r,
}: {
  research: Research;
}) {
  const p = useMemo(
    () => financialPeriods(r.facts, "annual", r.retrievedAt).at(-1),
    [r],
  );
  const family = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.company.sector,
    industry: r.evidence?.profile?.industry,
  }).family;
  const supported =
    family === "operating-company" &&
    p &&
    p.currency === r.quote.currency &&
    p.revenue !== null &&
    p.revenue > 0 &&
    p.netIncome !== null &&
    p.netIncome > 0 &&
    p.weightedShares !== null &&
    p.weightedShares !== undefined &&
    p.weightedShares > 0 &&
    p.eps != null &&
    p.eps > 0 &&
    Math.abs(p.netIncome / p.weightedShares / p.eps - 1) < 0.25 &&
    !r.company.foreignListing &&
    Date.parse(r.retrievedAt) - Date.parse(p.end) < 550 * 86400000;
  const defaults: ProjectionInputs = {
    revenue: p?.revenue ?? 0,
    shares: p?.weightedShares ?? 0,
    growth: 0,
    margin:
      p?.netIncome && p.revenue
        ? Math.min(100, (p.netIncome / p.revenue) * 100)
        : 10,
    multiple: 20,
    dilution: 0,
    discount: 10,
  };
  const [input, setInput] = useState(defaults),
    [years, setYears] = useState(3),
    [selected, setSelected] = useState("Base");
  const cases = [
    {
      name: "Bear",
      growth: input.growth - 10,
      margin: input.margin * 0.8,
      multiple: input.multiple * 0.75,
      dilution: input.dilution + 2,
    },
    { name: "Base", ...input },
    {
      name: "Bull",
      growth: input.growth + 10,
      margin: Math.min(100, input.margin * 1.1),
      multiple: Math.min(100, input.multiple * 1.25),
      dilution: input.dilution,
    },
  ].map((c) => ({
    name: c.name,
    rows: projectEarnings(
      {
        ...input,
        growth: c.growth,
        margin: c.margin,
        multiple: c.multiple,
        dilution: c.dilution,
      },
      years,
    ),
  }));
  const active = cases.find((c) => c.name === selected) ?? cases[1];
  const last = active.rows?.at(-1);
  const spot = r.quote.price;
  return (
    <section className="options-card price-projection">
      <header className="options-heading">
        <div>
          <span className="eyebrow">Conditional earnings model</span>
          <h3>How the business could translate into price</h3>
        </div>
        <div className="options-nav" aria-label="Projection horizon">
          {[1, 3, 5].map((y) => (
            <button
              type="button"
              key={y}
              aria-pressed={years === y}
              onClick={() => setYears(y)}
            >
              {y}Y
            </button>
          ))}
        </div>
      </header>
      {!supported ? (
        <p>
          This earnings model requires positive annual earnings, revenue and
          dated weighted shares in the listing currency. Sector-specific and
          existing supported scenarios remain available separately.
        </p>
      ) : (
        <>
          <p>
            Starting financials: {dateLabel(p.end)} · {p.currency}. Growth
            starts at 0%; P/E starts at an illustrative 20×, not an analyst
            forecast. Change the assumptions to explore your case.
          </p>
          <div className="options-kpis">
            {cases.map((c) => {
              const target = c.rows?.at(-1)?.price;
              return (
                <article key={c.name} data-scenario={c.name}>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={selected === c.name}
                    onClick={() => setSelected(c.name)}
                  >
                    {c.name}
                  </button>
                  <strong>
                    {target === undefined
                      ? "Unsupported assumptions"
                      : amount(target, r.quote.currency)}
                  </strong>
                  <small>
                    {target !== undefined && spot && spot > 0
                      ? `${((target / spot - 1) * 100).toFixed(1)}% total price change over ${years} years`
                      : "Future scenario price; not fair value today."}
                  </small>
                </article>
              );
            })}
          </div>
          <div className="projection-chart">
            <svg
              viewBox="0 0 700 220"
              role="img"
              aria-label="Bear base bull hypothetical earnings projection"
            >
              <title>
                Conditional future prices; no probabilities assigned
              </title>
              {cases.map((c, j) => {
                const max = Math.max(
                  1,
                  ...cases.flatMap((c) => c.rows?.map((x) => x.price) ?? []),
                  spot ?? 0,
                );
                const values = [
                  spot ?? 0,
                  ...(c.rows?.map((x) => x.price) ?? []),
                ];
                return (
                  <polyline
                    key={c.name}
                    points={values
                      .map(
                        (price, i) =>
                          `${35 + (i / years) * 620},${185 - (price / max) * 150}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke={
                      ["var(--red)", "var(--blue)", "var(--teal,var(--blue))"][
                        j
                      ]
                    }
                    strokeWidth={selected === c.name ? 4 : 2}
                  />
                );
              })}
              <text x="35" y="210" fill="currentColor">
                Today
              </text>
              <text x="655" y="210" textAnchor="end" fill="currentColor">
                Year {years}
              </text>
            </svg>
          </div>
          <div className="options-scroll">
            <table>
              <caption>{selected} scenario · years from model start</caption>
              <thead>
                <tr>
                  {[
                    "Year",
                    "Revenue",
                    "Earnings",
                    "Shares",
                    "EPS",
                    "Future price",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.rows?.map((row) => (
                  <tr key={row.year}>
                    <th>Year {row.year}</th>
                    <td>{amount(row.revenue, p.currency)}</td>
                    <td>{amount(row.earnings, p.currency)}</td>
                    <td>
                      {row.shares.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td>{amount(row.eps, p.currency)}</td>
                    <td>{amount(row.price, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="projection-inputs">
            <summary>Adjust assumptions</summary>
            <p>
              Controls define Base. Bear reduces growth 10 percentage points,
              margin 20% and multiple 25%, with 2 percentage points more annual
              dilution. Bull increases growth 10 points, margin 10% and multiple
              25%. These are illustrative stresses, not estimated probabilities.
            </p>
            <div className="options-toolbar">
              {(
                [
                  ["growth", "Revenue growth / year (%)", -50, 70],
                  ["margin", "Net margin (%)", 1, 80],
                  ["multiple", "Exit P/E (×)", 1, 80],
                  ["dilution", "Share dilution / year (%)", 0, 30],
                  ["discount", "Required return (%)", 1, 30],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step="0.5"
                    value={input[key]}
                    onChange={(e) =>
                      setInput({ ...input, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="button"
              onClick={() => {
                setInput(defaults);
                setSelected("Base");
              }}
            >
              Reset to baseline
            </button>
          </details>
          <p>
            {last
              ? `Discounted terminal price: ${amount(last.presentValue, r.quote.currency)} at ${input.discount}% required return. `
              : ""}
            This excludes interim dividends and cash flows and is not a full
            DCF. Price change excludes fees and taxes. Forecast growth, margins
            and multiples can all fail to materialize.
          </p>
        </>
      )}
    </section>
  );
}
