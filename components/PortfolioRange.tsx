"use client";
import type { PortfolioRange as Range } from "@/lib/portfolio-range";
import { amount, dateLabel, percent } from "@/lib/format";
import s from "./PortfolioRange.module.css";

const text = { Bear: "Rough stretch", Base: "Typical", Bull: "Strong stretch" };
/** Portfolio-level bear/base/bull from the same shared history as the trend chart. */
export default function PortfolioRange({ range: r }: { range: Range }) {
  if (!r.available)
    return (
      <section className={s.root} aria-label="Portfolio bear, base and bull">
        <header className={s.heading}>
          <div>
            <span className={s.eyebrow}>Portfolio range</span>
            <h3>Bear, base &amp; bull</h3>
          </div>
        </header>
        <div className={s.unavailableCases}>
          {(["Bear", "Base", "Bull"] as const).map((name) => (
            <div key={name} data-case={name.toLowerCase()}>
              <span>{name}</span>
              <strong>—</strong>
            </div>
          ))}
        </div>
        <p className={s.unavailable}>
          {r.reason} No scenario values are invented.
          {r.excluded.length ? ` Not included: ${r.excluded.join(", ")}.` : ""}
        </p>
      </section>
    );
  const weeks = Math.round(r.horizon / 5);
  const period =
    r.horizon === 21 ? "1 month" : `${weeks} week${weeks === 1 ? "" : "s"}`;
  const top = r.drivers.slice(0, 5);
  const widest = Math.max(
    1,
    ...top.flatMap((d) => [d.weight, Math.abs(d.riskShare)]),
  );
  const lead = r.drivers[0];
  return (
    <section className={s.root} aria-label="Portfolio bear, base and bull">
      <header className={s.heading}>
        <div>
          <span className={s.eyebrow}>Portfolio range · {period}</span>
          <h3>Bear, base &amp; bull for these holdings</h3>
        </div>
        <p>
          {r.included.length} holdings · {percent(r.coverage)} of priced
          investments · {dateLabel(r.from)}–{dateLabel(r.through)}
        </p>
      </header>
      <div className={s.summary}>
        <div className={s.cases}>
          {r.cases.map((c) => (
            <div key={c.name} data-case={c.name.toLowerCase()}>
              <span>
                {c.name} · {text[c.name]}
              </span>
              <strong>{amount(c.value, "USD", c.value >= 1e6)}</strong>
              <small>
                {percent(c.change, true)} · {c.delta >= 0 ? "+" : "−"}
                {amount(Math.abs(c.delta), "USD", Math.abs(c.delta) >= 1e5)}
              </small>
            </div>
          ))}
        </div>
        <dl className={s.stats}>
          <div>
            <dt>Today, same holdings</dt>
            <dd>{amount(r.reference, "USD", r.reference >= 1e6)}</dd>
          </div>
          <div>
            <dt>Swing size · annualised</dt>
            <dd>{percent(r.volatility)}</dd>
          </div>
          <div>
            <dt>Largest fall in window</dt>
            <dd>{percent(-r.drawdown, true)}</dd>
          </div>
        </dl>
      </div>
      {top.length > 1 && (
        <div className={s.drivers}>
          <h4>What drives the swings</h4>
          <p>
            {lead.symbol} is {percent(lead.weight)} of the basket and
            contributed {percent(lead.riskShare)} of its daily variance.
          </p>
          <div
            className={s.bars}
            role="table"
            aria-label="Weight compared with share of movement"
          >
            <div className={s.key} role="row">
              <span role="columnheader">Holding</span>
              <span role="columnheader">
                <i data-kind="weight" /> Weight <i data-kind="risk" /> Share of
                movement
              </span>
            </div>
            {top.map((d) => (
              <div className={s.bar} key={d.symbol} role="row">
                <strong role="rowheader">{d.symbol}</strong>
                <span role="cell">
                  <i
                    data-kind="weight"
                    style={{ width: `${(d.weight / widest) * 100}%` }}
                  />
                  <i
                    data-kind="risk"
                    data-negative={d.riskShare < 0}
                    style={{
                      width: `${(Math.abs(d.riskShare) / widest) * 100}%`,
                    }}
                  />
                </span>
                <small role="cell">
                  {percent(d.weight)} · {percent(d.riskShare)}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
      <details className={s.basis}>
        <summary>
          Basis &amp; limits · {r.samples} overlapping windows, about{" "}
          {r.independent} independent
        </summary>
        <p>{r.caveat}</p>
        <p>
          Share of movement is each holding&rsquo;s contribution to the
          basket&rsquo;s daily variance in this window. A share above its weight
          means it moved more, or more in step with the rest; a negative share
          offset the others.
          {r.excluded.length ? ` Not included: ${r.excluded.join(", ")}.` : ""}
        </p>
      </details>
    </section>
  );
}
