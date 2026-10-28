"use client";
import { useMemo, useRef, useState } from "react";
import { Upload, Download } from "lucide-react";
import { api } from "@/lib/client";
import {
  parseHoldingsCsv,
  tradePreview,
  stressPortfolio,
} from "@/lib/planning";
import { portfolioTotals } from "@/lib/engine";
import { amount, percent } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { useProduct } from "./Session";
import { Notice, Help } from "./Ui";
export default function PortfolioTools({
  quotes,
}: {
  quotes: Record<string, Quote>;
}) {
  const { workspace, demo, reloadWorkspace } = useProduct(),
    [file, setFile] = useState<ReturnType<typeof parseHoldingsCsv>>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [purchase, setPurchase] = useState(100),
    [maxPct, setMaxPct] = useState(20),
    [symbol, setSymbol] = useState(""),
    [shock, setShock] = useState(-20);
  const positions = workspace?.positions || [],
    totals = portfolioTotals(positions, quotes),
    cash = positions
      .filter(
        (p) =>
          p.assetType === "cash" && p.currency === "USD" && p.symbol === "USD",
      )
      .reduce((s, p) => s + p.quantity, 0),
    existing = positions
      .filter((p) => p.symbol === symbol && p.assetType !== "cash")
      .reduce(
        (s, p) =>
          s +
          p.quantity *
            (quotes[p.symbol]?.currency === "USD" && !quotes[p.symbol].stale
              ? (quotes[p.symbol].price ?? 0)
              : 0),
        0,
      ),
    preview = tradePreview(totals.knownValue, cash, existing, purchase, maxPct),
    stress = stressPortfolio(
      [{ symbol: "investments", value: Math.max(0, totals.knownValue - cash) }],
      shock,
    );
  const requestId = useRef("");
  async function read(input: File | undefined) {
    if (!input) return;
    try {
      setFile(parseHoldingsCsv(await input.text()));
      requestId.current = crypto.randomUUID();
      setMessage(
        "Review the import below. Existing holdings will remain unchanged.",
      );
    } catch (e) {
      setFile([]);
      setMessage(e instanceof Error ? e.message : "Invalid file.");
    }
  }
  async function save() {
    setBusy(true);
    try {
      if (demo)
        throw Error("Imports are disabled in this illustrative preview.");
      await api("portfolio-import", {
        rows: file,
        requestId: requestId.current,
      });
      setFile([]);
      await reloadWorkspace();
      setMessage("Positions imported.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }
  function template() {
    const u = URL.createObjectURL(
      new Blob(["symbol,quantity,cost,currency\n"], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "auryn-holdings-template.csv";
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <section className="support portfolio-tools">
      <header className="section-heading">
        <h2>Before your next investment</h2>
        <Help label="Portfolio scenarios">
          These are assumption-based previews using priced USD holdings and
          recorded cash. They do not place trades or forecast outcomes. Unpriced
          holdings prevent a complete exposure assessment.
        </Help>
      </header>
      <div className="two-col">
        <section className="panel">
          <h3>Purchase impact</h3>
          <div className="form-grid two">
            <label>
              Ticker
              <input
                value={symbol}
                placeholder="Company"
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </label>
            <label>
              Purchase · USD
              <input
                type="number"
                min="1"
                value={purchase}
                onChange={(e) => setPurchase(Number(e.target.value))}
              />
            </label>
            <label>
              Position limit · %
              <input
                type="number"
                min="1"
                max="100"
                value={maxPct}
                onChange={(e) => setMaxPct(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="data-list">
            <div>
              <span>Cash after</span>
              <b>{symbol.trim() ? amount(preview.cashAfter) : "—"}</b>
            </div>
            <div>
              <span>Position after</span>
              <b>{symbol.trim() ? percent(preview.weightAfter) : "—"}</b>
            </div>
          </div>
          <p className="footnote">
            {!symbol.trim()
              ? "Enter a ticker to preview the purchase."
              : totals.missing.length
                ? "Full pricing is required before judging total exposure."
                : preview.reasons.join(" ") ||
                  "Within the cash and concentration assumptions shown. Not an instruction to buy."}
          </p>
        </section>
        <section className="panel">
          <h3>Portfolio stress</h3>
          <label className="support">
            Assumed investment-price move · {shock}%
            <input
              type="range"
              min="-60"
              max="30"
              step="5"
              value={shock}
              onChange={(e) => setShock(Number(e.target.value))}
            />
          </label>
          <strong className="metric-value">
            {amount(stress.after + cash)}
          </strong>
          <p className="footnote">
            {amount(stress.change)} hypothetical change across priced
            investments. Recorded cash is unchanged; correlations, currency
            movements and liquidity effects are not modeled.
          </p>
        </section>
      </div>
      <section className="support">
        <header className="section-heading">
          <h2>Import positions</h2>
        </header>
        <label className="button file-picker">
          <Upload size={16} />
          Choose CSV
          <input
            className="upload-input"
            aria-label="Choose holdings CSV"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => read(e.target.files?.[0])}
          />
        </label>
        {message && <Notice>{message}</Notice>}
        {file.length > 0 && (
          <div className="support">
            <p>
              {file.length} new positions ·{" "}
              {file
                .slice(0, 8)
                .map((r) => r.symbol)
                .join(", ")}
              {file.length > 8 ? "…" : ""}
            </p>
            <button className="button primary" disabled={busy} onClick={save}>
              {busy ? "Importing…" : "Confirm import"}
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
