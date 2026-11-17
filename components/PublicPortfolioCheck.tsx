"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./PublicFrame.module.css";
import PublicFrame from "./PublicFrame";
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
    <PublicFrame
      title="See where your portfolio is concentrated."
      intro="Enter current holding values to see each weight and your largest exposures. No account connection; entries stay in this page and are not saved."
    >
      <div className={s.layout}>
        <div className={s.entry}>
          <label>
            One holding per line: symbol, current value in USD
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"AAPL, 5000\nMSFT, 3000\nCASH, 2000"}
            />
          </label>
          <div className={s.actions}>
            <button
              onClick={() => setInput("AAPL, 5000\nMSFT, 3000\nCASH, 2000")}
            >
              Try an example
            </button>
            <button disabled={!input} onClick={() => setInput("")}>
              Clear entries
            </button>
          </div>
          <p className={s.hint}>
            Up to 500 lines. Use current USD values without thousands
            separators. Repeated symbols are combined.
          </p>
        </div>
        <section aria-label="Concentration results" aria-live="polite">
          {usable ? (
            <>
              <div className={s.summary}>
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
              <ul className={s.weights}>
                {sorted.map(([name, value]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <meter
                      min={0}
                      max={100}
                      value={(value / total) * 100}
                      aria-label={`${name} weight`}
                    />
                    <b>{((value / total) * 100).toFixed(1)}%</b>
                  </li>
                ))}
              </ul>
              <p>
                Repeated symbols are combined. These weights include cash if you
                enter it. This check does not measure diversification inside
                funds, sector exposure, debt, correlations or investment
                quality.
              </p>
              <button onClick={() => setInput("")}>Clear my entries</button>
            </>
          ) : (
            <p role="status">
              Enter up to 500 lines with a symbol and a positive USD value. Use
              plain numbers without thousands separators.
            </p>
          )}
        </section>
      </div>
      <p>
        <Link href="/track-record">See our evidence standards →</Link>
      </p>
    </PublicFrame>
  );
}
