"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./PublicFrame.module.css";
import PublicFrame from "./PublicFrame";
export default function PublicPortfolioCheck() {
  const [input, setInput] = useState("");
  const [example, setExample] = useState(false);
  const clear = () => {
    setInput("");
    setExample(false);
  };
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
      tool="portfolio-check"
      title="See where your portfolio is concentrated."
      intro="Enter current holding values to see each weight and your largest exposures. No account connection; entries stay in this page and are not saved."
    >
      <div className={s.layout}>
        <div className={s.entry}>
          <h2>Enter holdings</h2>
          <label>
            One holding per line: symbol, current value in USD
            <textarea
              value={input}
              aria-describedby="portfolio-input-format"
              onChange={(e) => {
                setInput(e.target.value);
                setExample(false);
              }}
              placeholder={"AAPL, 5000\nMSFT, 3000\nCASH, 2000"}
            />
          </label>
          <div className={s.actions}>
            <button
              onClick={() => {
                setInput("AAPL, 5000\nMSFT, 3000\nCASH, 2000");
                setExample(true);
              }}
            >
              Try an example
            </button>
            <button disabled={!input} onClick={clear}>
              Clear entries
            </button>
          </div>
          <p className={s.hint} id="portfolio-input-format">
            Up to 500 lines. Use current USD values without thousands
            separators. Example values are illustrative.
          </p>
        </div>
        <section className={s.results} aria-labelledby="concentration-heading">
          <h2 id="concentration-heading">Concentration results</h2>
          {usable ? (
            <>
              <div className={s.summary} aria-live="polite">
                {example && (
                  <span className={s.exampleLabel}>Illustrative example</span>
                )}
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
              <ul
                className={s.weights}
                role="list"
                aria-label="Holding weights"
                tabIndex={0}
              >
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
            </>
          ) : (
            <div className={s.resultStatus} role="status">
              <strong>
                {!lines.length
                  ? "No holdings entered"
                  : lines.length > 500
                    ? "Maximum 500 holdings"
                    : !valid
                      ? `Check line ${entries.findIndex((entry) => !entry.valid) + 1}`
                      : "Total is too large"}
              </strong>
              <p>
                {!lines.length
                  ? "Enter a holding to see its weight, or try the illustrative example."
                  : lines.length > 500
                    ? "Remove extra lines to see results."
                    : !valid
                      ? "Each line needs one symbol and a positive USD value."
                      : "Enter smaller USD values to see the breakdown."}
              </p>
            </div>
          )}
        </section>
      </div>
      <nav className={s.nextLinks} aria-label="Next steps">
        <Link href="/track-record">See our evidence standards →</Link>
      </nav>
    </PublicFrame>
  );
}
