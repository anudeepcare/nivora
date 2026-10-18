"use client";
import { useState, useEffect } from "react";
import type { Research } from "@/lib/types";
import { comparisonRows } from "@/lib/research-workbench";
import { readResource } from "@/lib/resource-cache";
import { api } from "@/lib/client";
import { symbolInput, amount, percent, dateLabel } from "@/lib/format";
import { useProduct } from "./Session";
import { Notice, SecurityLogo } from "./Ui";
import { downloadCsv } from "./ResearchWorkbench";
export default function ResearchCompare({
  research: r,
}: {
  research: Research;
}) {
  const { cache, demo } = useProduct();
  const [symbol, setSymbol] = useState(""),
    [reports, setReports] = useState<Research[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setReports([]);
    setMessage("");
  }, [r.company.symbol]);
  const items = [
      r,
      ...reports.filter((x) => x.company.symbol !== r.company.symbol),
    ].slice(0, 4),
    rows = comparisonRows(items);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMessage("");
    try {
      const s = symbolInput(symbol);
      if (items.some((x) => x.company.symbol === s))
        throw Error("This company is already shown.");
      if (items.length >= 4) throw Error("Compare up to four companies.");
      setBusy(true);
      const key = `research/${encodeURIComponent(s.replace("/", "-"))}`;
      const value = demo
        ? demo.research[s]
        : await readResource<Research>(cache, key, 300000, () =>
            api<Research>(key),
          );
      if (!value) throw Error("No report available for this symbol.");
      setReports((old) => [...old, value]);
      setSymbol("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Comparison unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="compare-workspace">
      <header className="section-head">
        <div>
          <span className="eyebrow">Side by side</span>
          <h3>Compare the evidence</h3>
          <p>Choose relevant peers. Sector and reporting dates matter.</p>
        </div>
      </header>
      <form className="compare-form" onSubmit={add}>
        <label htmlFor="compare-symbol">
          Company ticker
          <input
            id="compare-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Add a peer ticker"
            maxLength={18}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>
        <button
          className="button"
          disabled={busy || items.length >= 4 || !symbol.trim()}
        >
          {busy ? "Loading…" : "Add comparison"}
        </button>
      </form>
      {message && <Notice>{message}</Notice>}
      <div className="table-scroll">
        <table>
          <caption>
            Reported values, not rankings. TTM preferred; annual fallback is
            labelled. No automatic investment recommendation.
          </caption>
          <thead>
            <tr>
              <th>Measure</th>
              {rows.map((row) => (
                <th key={row.symbol}>
                  <div className="comparison-identity">
                    <SecurityLogo symbol={row.symbol} size={28} />
                    {row.symbol}
                  </div>
                  {row.symbol !== r.company.symbol && (
                    <button
                      className="text-button small"
                      aria-label={`Remove ${row.symbol}`}
                      onClick={() =>
                        setReports((old) =>
                          old.filter((x) => x.company.symbol !== row.symbol),
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                "scope",
                "basis",
                "start",
                "sector",
                "end",
                "currency",
                "revenue",
                "margin",
                "fcfMargin",
                "netDebt",
                "forwardPE",
              ] as const
            ).map((key) => (
              <tr key={key}>
                <th>
                  {
                    {
                      scope: "Period scope",
                      basis: "Accounting basis",
                      start: "Period start",
                      sector: "Sector",
                      end: "Period end",
                      currency: "Reporting currency",
                      revenue: "Revenue",
                      margin: "Operating margin",
                      fcfMargin: "FCF margin",
                      netDebt: "Net debt",
                      forwardPE: "Forward P/E",
                    }[key]
                  }
                </th>
                {rows.map((row) => (
                  <td key={row.symbol}>
                    {key === "end" || key === "start"
                      ? row[key]
                        ? dateLabel(row[key])
                        : "—"
                      : key === "revenue" || key === "netDebt"
                        ? amount(row[key], row.currency ?? undefined, true)
                        : key === "margin" || key === "fcfMargin"
                          ? percent(row[key])
                          : key === "forwardPE"
                            ? row[key] == null
                              ? "—"
                              : row[key]! > 0
                                ? `${row[key]!.toFixed(1)}×`
                                : "N/M"
                            : (row[key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th>Comparability</th>
              {rows.map((row) => (
                <td key={row.symbol}>
                  {row.comparable
                    ? "Scope / basis / currency / date aligned"
                    : "Different scope/basis/date/currency or missing period"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button
        className="text-button"
        onClick={() =>
          downloadCsv("auryn-comparison.csv", [
            [
              "symbol",
              "sector",
              "period",
              "start",
              "scope",
              "basis",
              "currency",
              "revenue",
              "operating_margin_pct",
              "fcf_margin_pct",
              "net_debt",
              "forward_pe",
              "retrieved_at",
            ],
            ...rows.map((row) => [
              row.symbol,
              row.sector,
              row.end,
              row.start,
              row.scope,
              row.basis,
              row.currency,
              row.revenue,
              row.margin,
              row.fcfMargin,
              row.netDebt,
              row.forwardPE,
              row.asOf,
            ]),
          ])
        }
      >
        Download comparison
      </button>
    </section>
  );
}
