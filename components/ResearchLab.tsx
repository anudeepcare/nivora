"use client";
import { providerSymbol, sameProviderSymbol } from "@/lib/provider-symbol";
import { verifiedResearch } from "@/lib/comparison";
import PaceHelp from "./PaceHelp";
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
    [mode, setMode] = useState<"current-v6" | "legacy">("current-v6"),
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
            mode,
          )
        : null,
    [data, cost, mode],
  );
  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const s = providerSymbol(symbol);
      if (data && !sameProviderSymbol(data.company.symbol, s)) setData(null);
      const r = demo
        ? demo.research[s]
        : await api<Research>(
            `research/${encodeURIComponent(s.replace("/", "-"))}`,
          );
      if (!verifiedResearch(r, s))
        throw Error(
          "The selected company could not be verified. Check the ticker and retry.",
        );
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
      "month,signal_date,execution_date,policy_version,fixed_value,pace_value,pace_cash,contribution_multiple",
      ...result.history.map((r) =>
        [
          r.month,
          r.signalDate,
          r.executionDate,
          r.policyVersion,
          r.fixed,
          r.adaptive,
          r.cash,
          r.multiplier,
        ].join(","),
      ),
    ].join("\n");
    const u = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = `auryn-${mode}-comparison.csv`;
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <section>
      <PaceHelp trigger="Understand AURYN Pace" />
      <PageHeading
        title="Strategy lab"
        subtitle="Compare contribution rules with the same cash, dates and modeled costs."
      />
      <p className="footnote">
        {mode === "current-v6"
          ? "Current v6 technical rules: P0/P1 retain cash, P2 starts at 1×, P3 adds at 2× and P4 uses up to 4× the regular contribution, limited by available cash. Only completed months after model release qualify."
          : "The legacy v5 simulation buys at P1. It does not implement current P1 Watch/Hold guidance or the v6 model."}{" "}
        Neither replay includes historical business eligibility, valuation or
        personal position limits. Results cannot validate the full AURYN
        decision.
      </p>
      <form className="alert-builder panel" onSubmit={run}>
        <label>
          Rule set
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "current-v6" | "legacy")}
          >
            <option value="current-v6">
              Current v6 · technical rules only
            </option>
            <option value="legacy">Legacy v5 · price-only research</option>
          </select>
        </label>
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
            <small>
              {mode === "current-v6"
                ? "Current technical model"
                : "Legacy price-only model"}{" "}
              {result.policy} · hypothetical comparison
            </small>
          </header>
          <div className="two-col">
            {[
              ["Fixed contributions", result.fixed, "blue"],
              [
                mode === "current-v6"
                  ? "Current v6 technical rules"
                  : "Legacy price-only policy",
                result.adaptive,
                "violet",
              ],
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
                      label === "Fixed contributions" ? r.fixed : r.adaptive,
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
          <button className="button" type="button" onClick={download}>
            <Download size={16} /> Export dated comparison
          </button>
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
              ? mode === "current-v6"
                ? "Current v6 evidence is still accumulating"
                : "More completed history is required"
              : "Compare before adopting a policy"
          }
        >
          {result?.reason && <span>{result.reason} </span>}
          {mode === "current-v6" && (
            <span>
              The frozen model was released November 7, 2026. No older
              performance is relabeled as v6, and a price replay is not a
              verified prospective record.{" "}
            </span>
          )}
          Both policies receive the same cash at the same time. Stronger
          multipliers cannot borrow from future contributions.
        </Empty>
      )}
    </section>
  );
}
