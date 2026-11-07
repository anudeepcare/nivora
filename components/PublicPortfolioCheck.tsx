"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./FocusTools.module.css";
export default function PublicPortfolioCheck() {
  const [input, setInput] = useState("");
  const lines = input.trim() ? input.trim().split("\n") : [];
  const entries = lines.map((line) => {
    const [symbol, value, ...rest] = line.split(",");
    return {
      symbol: symbol.trim().toUpperCase(),
      value: Number(value),
      valid:
        rest.length === 0 &&
        !!symbol.trim() &&
        value?.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) > 0,
    };
  });
  const valid =
    entries.length > 0 &&
    entries.length <= 500 &&
    entries.every((x) => x.valid);
  const grouped = new Map<string, number>();
  if (valid)
    entries.forEach((x) =>
      grouped.set(x.symbol, (grouped.get(x.symbol) || 0) + x.value),
    );
  const sorted = [...grouped].sort((a, b) => b[1] - a[1]),
    total = sorted.reduce((sum, x) => sum + x[1], 0);
  const usable = valid && Number.isFinite(total);
  return (
    <main className={s.page}>
      <Link href="/">AURYN · Home</Link>
      <h1>Know what dominates your portfolio.</h1>
      <p>
        A quick concentration check with values you provide. No signup, quotes
        or account connection. Calculations stay in this page; entries are not
        saved.
      </p>
      <div className={s.form}>
        <label>
          One holding per line: symbol, current value in USD
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"AAPL, 5000\nMSFT, 3000\nCASH, 2000"}
          />
        </label>
      </div>
      {usable ? (
        <>
          <div className={s.result}>
            <strong>
              ${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              entered
            </strong>
            <p>
              Largest holding: {sorted[0][0]} ·{" "}
              {((sorted[0][1] / total) * 100).toFixed(1)}%. Top three:{" "}
              {(
                (sorted.slice(0, 3).reduce((n, x) => n + x[1], 0) / total) *
                100
              ).toFixed(1)}
              %.
            </p>
          </div>
          <ul className={s.list}>
            {sorted.map(([name, value]) => (
              <li key={name}>
                <strong>{name}</strong>
                <p>{((value / total) * 100).toFixed(1)}% of entered value</p>
              </li>
            ))}
          </ul>
          <p>
            Repeated symbols are combined. These weights include cash if you
            enter it. This check does not measure diversification inside funds,
            sector exposure, debt, correlations or investment quality.
          </p>
          <button onClick={() => setInput("")}>Clear my entries</button>
        </>
      ) : (
        <p role="status">
          Enter up to 500 lines with a symbol and a positive USD value. Use
          plain numbers without thousands separators.
        </p>
      )}
      <p>
        <Link href="/track-record">See our evidence standards →</Link>
      </p>
    </main>
  );
}
