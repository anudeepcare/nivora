"use client";
import { useMemo, useState } from "react";
import { Download, FlaskConical } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { compareDca } from "@/lib/planning";
import { amount, percent, symbolInput, dateLabel } from "@/lib/format";
import type { Research } from "@/lib/types";
import { PageHeading, Notice, Empty, Help } from "./Ui";
import { MiniChart } from "./Charts";
export default function ResearchLab() {
  const { demo, workspace } = useProduct(),
    [symbol, setSymbol] = useState(""),
    [cost, setCost] = useState(10),
    [data, setData] = useState<Research | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const observationPreview = useMemo(
    () => (demo ? { observations: [] } : undefined),
    [demo],
  );
  const observations = useResource<{
    observations: {
      symbol: string;
      snapshot_id: string;
      observed_at: string;
      payload: any;
    }[];
  }>("observations", observationPreview);
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
        title="Test the idea. Keep the evidence."
        subtitle="Transparent historical comparisons and dated research records."
      />
      <form className="alert-builder panel" onSubmit={run}>
        <label>
          Company
          <input
            required
            value={symbol}
            placeholder="Ticker or crypto pair"
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
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
            <h2>Equal-budget comparison · {result.months} months</h2>
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
          <p className="footnote">{result.limitations.join(" ")}</p>
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
      <header className="section-heading support">
        <h2>Saved research observations</h2>
        <span className="muted small">
          Evidence records, not verified investment outcomes
        </span>
      </header>
      {observations.error && <Notice>{observations.error}</Notice>}
      {observations.data?.observations.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Saved</th>
                <th>Business</th>
                <th>Timing</th>
                <th>Policy</th>
              </tr>
            </thead>
            <tbody>
              {observations.data.observations.map((r) => (
                <tr key={`${r.symbol}:${r.snapshot_id}`}>
                  <td>{r.symbol}</td>
                  <td>{dateLabel(r.observed_at)}</td>
                  <td>{r.payload.business}</td>
                  <td>{r.payload.timing}</td>
                  <td>{r.payload.policy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Start a record you can revisit">
          Save a dated snapshot from a company's Business tab. Original
          observations remain separate from later research.
        </Empty>
      )}
    </section>
  );
}
