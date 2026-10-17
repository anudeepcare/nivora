"use client";
import type { Research } from "@/lib/types";
import { accumulation } from "@/lib/engine";
import { amount, percent } from "@/lib/format";
import { Help, Notice } from "./Ui";
import { PriceChart } from "./Charts";
export default function Accumulation({ research }: { research: Research }) {
  const result = accumulation(
    research.history,
    research.retrievedAt,
    false,
    research.company.assetType === "crypto" ? "crypto" : "us-equity",
  );
  const signal = result.confirmed;
  return (
    <section className="dca-page">
      <div className="panel">
        <div className="dca-hero">
          <div className="dca-orb">
            <b>{signal ? `${signal.multiplier}×` : "—"}</b>
            <small>CONFIRMED MONTH</small>
          </div>
          <div>
            <span className="eyebrow">
              MONTHLY DCA · {signal?.month || "HISTORY NEEDED"}
            </span>
            <h2>
              {signal
                ? signal.multiplier === 0
                  ? "Pause contributions"
                  : signal.multiplier === 1
                    ? "Your baseline contribution"
                    : `${signal.multiplier}× your usual contribution`
                : "More monthly history needed"}
            </h2>
            <p className="muted">{signal?.reason || result.reason}</p>
          </div>
          <Help label="Monthly DCA">
            AURYN’s original experimental price policy compares completed
            monthly closes with a 24-month average and closing high. Multipliers
            describe your usual contribution, not leverage or expected returns.
            No amount is required. It does not establish business quality or
            suitability.
          </Help>
        </div>
        <div className="zone-scale" aria-label="Monthly contribution zones">
          {[0, 1, 2, 3, 4].map((n) => (
            <div
              className={`zone ${signal?.multiplier === n ? "active" : ""}`}
              key={n}
            >
              <b>{n}×</b>
              <span>
                {
                  ["Pause", "Baseline", "Pullback", "Deep pullback", "Extreme"][
                    n
                  ]
                }
              </span>
            </div>
          ))}
        </div>
        <div className="dca-explain">
          <div>
            <h3>Current month · forming</h3>
            <p>
              {result.forming
                ? `${result.forming.multiplier}× zone · ${result.forming.reason}`
                : "No settled observation in the current month."}{" "}
              This may change until the month closes.
            </p>
          </div>
          <div>
            <h3>Keep the business in view</h3>
            <p>
              A lower price can reflect a weaker business. Review cash
              generation, funding and concentration before increasing purchases.
            </p>
          </div>
        </div>
      </div>
      <section className="panel support">
        <header className="section-heading">
          <h2>Price & monthly context</h2>
          <span className="muted small">Last 12 months</span>
        </header>
        <PriceChart
          bars={research.history.filter(
            (b) =>
              Date.parse(b.time) >=
              Date.parse(
                research.history.at(-1)?.time || research.retrievedAt,
              ) -
                365 * 86400000,
          )}
          range="DCA context"
        />
        {result.history.length ? (
          <div className="timeline">
            {result.history.slice(-6).map((s) => (
              <div key={s.month} title={s.reason}>
                <small>{s.month}</small>
                <b>{s.multiplier}×</b>
              </div>
            ))}
          </div>
        ) : (
          <Notice>
            At least 24 complete monthly observations are needed for a confirmed
            zone.
          </Notice>
        )}
      </section>
      {result.history.length > 0 && (
        <section className="panel support">
          <h2>Confirmed monthly history</h2>
          <div className="table-scroll">
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
                      <td className="violet">{s.multiplier}×</td>
                      <td>{amount(s.close, research.quote.currency)}</td>
                      <td>{percent(s.drawdown)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <p className="footnote">
        Experimental policy · {result.version}. Historical zones may change
        after source corrections. These observations are not simulated returns
        or proof that variable contributions outperform a fixed schedule.
      </p>
    </section>
  );
}
