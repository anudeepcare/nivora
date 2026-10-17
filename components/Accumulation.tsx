"use client";
import type { Research } from "@/lib/types";
import { accumulation } from "@/lib/engine";
import { amount, dateLabel, percent } from "@/lib/format";
import { Help, Notice } from "./Ui";
export default function Accumulation({ research }: { research: Research }) {
  const result = accumulation(
      research.history,
      research.retrievedAt,
      false,
      research.company.assetType === "crypto" ? "crypto" : "us-equity",
    ),
    signal = result.confirmed;
  return (
    <section>
      <header className="section-heading">
        <div>
          <span className="eyebrow">MONTHLY ACCUMULATION</span>
          <h2>A steadier way to read price.</h2>
          <p>Your usual contribution is the baseline. No amount is required.</p>
        </div>
        <Help label="Monthly accumulation">
          AURYN's original experimental price policy compares completed monthly
          closes with a 24-month average and closing high. Multipliers describe
          contribution intensity, not leverage or expected returns. It does not
          assess whether the business is suitable for you.
        </Help>
      </header>
      <div className="accumulation-hero">
        <div>
          <span className="metric-label">Last completed month</span>
          <strong>
            {signal
              ? signal.multiplier === 0
                ? "Pause"
                : `${signal.multiplier}×`
              : "—"}
          </strong>
          <p>
            {signal
              ? `${dateLabel(signal.month + "-01")} · ${signal.reason}`
              : result.reason}
          </p>
        </div>
        <div className="accumulation-scale">
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} data-active={signal?.multiplier === n}>
              <span>{n === 0 ? "Pause" : `${n}×`}</span>
              <i />
              <small>
                {
                  [
                    "Extended",
                    "Baseline",
                    "Pullback",
                    "Deep pullback",
                    "Extreme",
                  ][n]
                }
              </small>
            </div>
          ))}
        </div>
      </div>
      <div className="two-col support">
        <article className="panel">
          <span className="metric-label">Current month · forming</span>
          <h3>
            {result.forming
              ? result.forming.multiplier === 0
                ? "Pause zone"
                : `${result.forming.multiplier}× zone`
              : "No forming observation"}
          </h3>
          <p>
            {result.forming?.reason ||
              "A settled observation in the current month is needed."}
          </p>
          <small>This can change until the month closes.</small>
        </article>
        <article className="panel">
          <span className="metric-label">Keep the business in view</span>
          <h3>Price weakness is only one input.</h3>
          <p>
            Review cash runway, dilution, business performance and position
            concentration before increasing purchases.
          </p>
          <small>Experimental policy · {result.version}</small>
        </article>
      </div>
      <header className="section-heading support">
        <h2>Confirmed monthly history</h2>
        <span className="muted small">Last 24 observations</span>
      </header>
      {result.history.length ? (
        <>
          <div className="signal-timeline">
            {result.history.slice(-24).map((s) => (
              <div
                key={s.month}
                title={`${s.month}: ${s.multiplier}× · ${s.reason}`}
              >
                <span data-multiple={s.multiplier}>
                  {s.multiplier === 0 ? "P" : `${s.multiplier}×`}
                </span>
                <small>{s.month.slice(2)}</small>
              </div>
            ))}
          </div>
          <div className="table-scroll support">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Zone</th>
                  <th>Close</th>
                  <th>From closing high</th>
                </tr>
              </thead>
              <tbody>
                {result.history
                  .slice(-12)
                  .reverse()
                  .map((s) => (
                    <tr key={s.month}>
                      <td>{s.month}</td>
                      <td className="violet">
                        {s.multiplier === 0 ? "Pause" : `${s.multiplier}×`}
                      </td>
                      <td>{amount(s.close, research.quote.currency)}</td>
                      <td>{percent(s.drawdown)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Notice>
          More complete price history is needed to show monthly zones.
        </Notice>
      )}
      <p className="footnote">
        Historical zones are recalculated from available provider history and
        may change after source corrections. This is not a backtest or proof
        that variable contributions outperform a fixed schedule.
      </p>
    </section>
  );
}
