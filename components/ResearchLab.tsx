"use client";
import { useMemo, useState } from "react";
import { Download, FlaskConical } from "lucide-react";
import { useProduct } from "./Session";
import { api } from "@/lib/client";
import { compareDca } from "@/lib/planning";
import { amount, percent, symbolInput, dateLabel } from "@/lib/format";
import type { Research } from "@/lib/types";
import { PageHeading, Notice, Empty, Help } from "./Ui";
import { MiniChart } from "./Charts";
export default function ResearchLab() {
  const { demo } = useProduct(),
    [symbol, setSymbol] = useState(""),
    [cost, setCost] = useState(10),
    [data, setData] = useState<Research | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const result = useMemo(
    () =>
      data
        ? compareDca(
            data.history,
            data.retrievedAt,
            cost,
            data.company.assetType === "crypto" ? "crypto" : "us-equity",
          )
        : null,
    [data, cost],
  );
  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setData(null);
    setBusy(true);
    setMessage("");
    try {
      const s = symbolInput(symbol);
      const r = demo
        ? demo.research[s]
        : await api<Research>(
            `research/${encodeURIComponent(s.replace("/", "-"))}`,
          );
      if (!r)
        throw Error("No history available for that company in this preview.");
      setData(r);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "History unavailable.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!result) return;
    const csv = [
      "month,fixed_value,adaptive_value,adaptive_cash,prior_month_multiplier",
      ...result.history.map((r) =>
        [r.month, r.fixed, r.adaptive, r.cash, r.multiplier].join(","),
      ),
    ].join("\n");
    const u = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "auryn-monthly-policy-comparison.csv";
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <section>
      <PageHeading
        title="Strategy lab"
        subtitle="Compare monthly policies using the same budget and completed history."
      />
      <form className="alert-builder panel" onSubmit={run}>
        <label>
          Company
          <input
            required
            disabled={busy}
            value={symbol}
            placeholder="Ticker or crypto pair"
            onChange={(e) => {
              setSymbol(e.target.value.toUpperCase());
              setData(null);
              setMessage("");
            }}
          />
        </label>
        <label>
          Fees + slippage · basis points
          <input
            type="number"
            min="0"
            max="200"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </label>
        <button className="button primary" disabled={busy}>
          <FlaskConical size={16} />
          {busy ? "Loading history…" : "Compare monthly policies"}
        </button>
      </form>
      {message && <Notice error>{message}</Notice>}
      {result && result.months > 0 ? (
        <>
          <header className="section-heading support">
            <h2>
              {data?.company.symbol} · {result.months} months
            </h2>
            <button className="button" onClick={download}>
              <Download size={16} />
              Export
            </button>
          </header>
          <div className="two-col">
            {[
              ["Fixed DCA", result.fixed, "blue"],
              ["Adaptive monthly policy", result.adaptive, "violet"],
            ].map(([label, state, color]) => {
              const x = state as typeof result.fixed;
              return (
                <section className="panel" key={String(label)}>
                  <span className="eyebrow">{String(label)}</span>
                  <strong className="metric-value">
                    {amount(x.value, data?.quote.currency)}
                  </strong>
                  <MiniChart
                    color={String(color)}
                    values={result.history.map((r) =>
                      label === "Fixed DCA" ? r.fixed : r.adaptive,
                    )}
                  />
                  <div className="data-list">
                    <div>
                      <span>Total contributions</span>
                      <b>{amount(x.contributed, data?.quote.currency)}</b>
                    </div>
                    <div>
                      <span>Uninvested cash</span>
                      <b>{amount(x.cash, data?.quote.currency)}</b>
                    </div>
                    <div>
                      <span>Modeled costs</span>
                      <b>{amount(x.costs, data?.quote.currency)}</b>
                    </div>
                    <div>
                      <span>Flow-adjusted drawdown</span>
                      <b>{percent(x.drawdown)}</b>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          <p className="footnote">
            Equal-budget, hypothetical comparison · History through{" "}
            {dateLabel(data?.history.at(-1)?.time)}.{" "}
            {result.limitations.join(" ")}
          </p>
        </>
      ) : (
        <Empty
          title={
            result
              ? "More completed history is required"
              : "Compare before adopting a policy"
          }
        >
          Both policies receive the same cash at the same time. Stronger
          multipliers cannot borrow from future contributions.
        </Empty>
      )}
    </section>
  );
}
