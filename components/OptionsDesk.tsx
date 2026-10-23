"use client";
import { useEffect, useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { api } from "@/lib/client";
import {
  optionMid,
  liquidity,
  optionsSummary,
  expirationPayoff,
  payoffRisk,
  type OptionContract,
  type PayoffLeg,
} from "@/lib/options-analysis";
import { amount, dateLabel } from "@/lib/format";
type Chain = {
  status: string;
  message?: string;
  contracts: OptionContract[];
  complete: boolean;
  frequency?: string;
};
const fmt = (n: number | null, d = 2) =>
  n === null
    ? "Unavailable"
    : n.toLocaleString(undefined, { maximumFractionDigits: d });
function Plot({
  points,
  label,
}: {
  points: { x: number; y: number }[];
  label: string;
}) {
  if (points.length < 2) return <p>Not enough observations for this chart.</p>;
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x)),
    minY = Math.min(0, ...points.map((p) => p.y)),
    maxY = Math.max(0, ...points.map((p) => p.y));
  const X = (n: number) => 40 + ((n - minX) / Math.max(1, maxX - minX)) * 620,
    Y = (n: number) => 170 - ((n - minY) / Math.max(1, maxY - minY)) * 135;
  return (
    <figure className="options-plot">
      <svg viewBox="0 0 700 210" role="img" aria-label={label}>
        <line
          x1="40"
          x2="660"
          y1={Y(0)}
          y2={Y(0)}
          stroke="currentColor"
          opacity=".25"
        />
        <polyline
          fill="none"
          stroke="var(--blue)"
          strokeWidth="3"
          points={points.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}
        />
        <text x="40" y="200" fill="currentColor" fontSize="12">
          {fmt(minX)}
        </text>
        <text
          x="660"
          y="200"
          textAnchor="end"
          fill="currentColor"
          fontSize="12"
        >
          {fmt(maxX)}
        </text>
        <text x="40" y="18" fill="currentColor" fontSize="12">
          {fmt(maxY)}
        </text>
        <text x="40" y="185" fill="currentColor" fontSize="12">
          {fmt(minY)}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
export default function OptionsDesk({
  research,
  preview = false,
}: {
  research: Research;
  preview?: boolean;
}) {
  const spot = research.quote.price ?? 0;
  const [chain, setChain] = useState<Chain | null>(null),
    [knownExpiries, setKnownExpiries] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [expiry, setExpiry] = useState(""),
    [view, setView] = useState("positioning"),
    [kind, setKind] = useState("all"),
    [onlyLiquid, setOnlyLiquid] = useState(true),
    [strategy, setStrategy] = useState("call"),
    [selected, setSelected] = useState(""),
    [second, setSecond] = useState(""),
    [visibleCount, setVisibleCount] = useState(100);
  useEffect(() => {
    if (preview) return;
    const abort = new AbortController();
    setBusy(true);
    setError("");
    api<Chain>(
      `options/${encodeURIComponent(research.company.symbol)}${expiry ? "?expiry=" + expiry : ""}`,
      undefined,
      abort.signal,
    )
      .then((data) => {
        setChain(data);
        setKnownExpiries((old) =>
          [...new Set([...old, ...data.contracts.map((c) => c.expiry)])].sort(),
        );
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [research.company.symbol, expiry, preview]);
  const contracts = chain?.contracts ?? [];
  const expiries = knownExpiries;
  const active = expiry || expiries[0] || "";
  const summary = useMemo(
    () =>
      optionsSummary(
        contracts,
        spot,
        active,
        Date.now(),
        chain?.complete ?? false,
      ),
    [contracts, spot, active, chain?.complete],
  );
  const nearby = [...summary.buckets]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, 40)
    .sort((a, b) => a.strike - b.strike);
  const rows = summary.rows.filter(
    (c) =>
      (kind === "all" || c.type === kind) &&
      (!onlyLiquid || liquidity(c).eligible),
  );
  const calls = summary.rows.filter(
      (c) => c.type === "call" && liquidity(c).eligible,
    ),
    puts = summary.rows.filter(
      (c) => c.type === "put" && liquidity(c).eligible,
    );
  const candidates = ["put", "protective", "cash-put", "put-spread"].includes(
    strategy,
  )
    ? puts
    : calls;
  const first =
    candidates.find((c) => c.id === selected) ??
    candidates.reduce<OptionContract | undefined>(
      (a, c) =>
        !a || Math.abs(c.strike - spot) < Math.abs(a.strike - spot) ? c : a,
      undefined,
    );
  const higher = candidates.filter((c) => first && c.strike > first.strike);
  const other = higher.find((c) => c.id === second) ?? higher[0];
  const isDebit = strategy === "call-spread",
    isCredit = strategy === "put-spread";
  let legs: PayoffLeg[] = [];
  let shares = 0;
  if (first && first.ask !== null && first.bid !== null) {
    legs = [
      {
        type: first.type,
        strike: first.strike,
        premium: ["covered", "cash-put"].includes(strategy)
          ? first.bid
          : first.ask,
        quantity: ["covered", "cash-put"].includes(strategy) ? -1 : 1,
      },
    ];
    if (["covered", "protective"].includes(strategy)) shares = 100;
    if (
      (isDebit || isCredit) &&
      other &&
      other.ask !== null &&
      other.bid !== null
    ) {
      legs = isDebit
        ? [
            {
              type: "call",
              strike: first.strike,
              premium: first.ask,
              quantity: 1,
            },
            {
              type: "call",
              strike: other.strike,
              premium: other.bid,
              quantity: -1,
            },
          ]
        : [
            {
              type: "put",
              strike: first.strike,
              premium: first.ask,
              quantity: 1,
            },
            {
              type: "put",
              strike: other.strike,
              premium: other.bid,
              quantity: -1,
            },
          ];
    } else if (isDebit || isCredit) legs = [];
  }
  const risk = legs.length ? payoffRisk(legs, shares, spot) : null;
  const payoff = legs.length
    ? Array.from({ length: 81 }, (_, i) => {
        const x = spot * (i / 40);
        return { x, y: expirationPayoff(x, legs, shares, spot) };
      })
    : [];
  return (
    <div className="options-desk">
      <header className="options-heading">
        <div>
          <span className="eyebrow">Options & positioning</span>
          <h2>Understand the move. Define the risk.</h2>
          <p>Explore positioning, calls, puts and longer-dated contracts.</p>
        </div>
        <label>
          Expiry
          <select
            value={active}
            onChange={(e) => {
              setExpiry(e.target.value);
              setSelected("");
              setSecond("");
            }}
            disabled={!expiries.length}
          >
            {!expiries.length && <option value="">No chain loaded</option>}
            {[...new Set([active, ...expiries])].filter(Boolean).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </header>
      {!!active && !expiry && (
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() => setExpiry(active)}
        >
          Load selected expiry only
        </button>
      )}
      <label className="options-expiry-date">
        Load a specific expiry (including longer-dated contracts)
        <input
          type="date"
          value={expiry}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            if (e.target.value) {
              setKnownExpiries((old) =>
                [...new Set([...old, e.target.value])].sort(),
              );
              setExpiry(e.target.value);
            }
          }}
        />
      </label>
      <nav className="options-nav" aria-label="Options sections">
        {[
          ["positioning", "Positioning"],
          ["chain", "Chain"],
          ["leaps", "LEAPS"],
          ["strategy", "Strategies"],
          ["learn", "Learn"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {busy && <p role="status">Loading the selected options snapshot…</p>}
      {error && (
        <p role="alert" className="options-notice">
          {error} Last successfully loaded data, if any, is retained.
        </p>
      )}
      {(preview || chain?.status === "unavailable") && (
        <p className="options-notice">
          {preview
            ? "Preview mode: no options prices are fabricated. The payoff tools use real chain data once connected."
            : chain?.message}
        </p>
      )}
      {!!contracts.length && (
        <p className="options-stamp">
          Options observed{" "}
          {summary.asOf ? dateLabel(summary.asOf) : "date unavailable"} ·
          Underlying {amount(spot)} (
          {research.quote.asOf
            ? dateLabel(research.quote.asOf)
            : "time unavailable"}
          ) · {chain?.frequency}{" "}
          {!chain?.complete &&
            "Partial chain: aggregate values are incomplete."}
        </p>
      )}
      {view === "positioning" && (
        <>
          <div className="options-kpis">
            <article>
              <span>ATM straddle cost</span>
              <strong>
                {summary.straddle === null
                  ? "Unavailable"
                  : amount(summary.straddle)}
              </strong>
              <small>
                Call + put midpoint at strike {fmt(summary.nearest)}; an expiry
                move proxy, not a probability guarantee.
              </small>
            </article>
            <article>
              <span>Modeled net GEX / 1% move</span>
              <strong>
                {summary.netGex === null
                  ? "Unavailable"
                  : amount(summary.netGex)}
              </strong>
              <small>
                {fmt(summary.gammaCoverage * 100, 0)}% of selected contracts
                have gamma and open interest. Calls positive / puts negative
                convention; re-scaled to the displayed underlying price.
              </small>
            </article>
            <article>
              <span>Put / call open interest</span>
              <strong>{fmt(summary.putCallOi)}</strong>
              <small>
                Position counts do not establish bullish or bearish intent.
              </small>
            </article>
          </div>
          <section className="options-card">
            <h3>Gamma exposure by strike</h3>
            <p>
              Model estimate using snapshot gamma × open interest × contract
              size × spot² × 1%. This is not observed dealer inventory.
            </p>
            {summary.buckets.length ? (
              <>
                <Plot
                  points={nearby.map((b) => ({ x: b.strike, y: b.net }))}
                  label="Nearest 40 strikes · net modeled GEX, dollars per 1% move"
                />
                <details>
                  <summary>Detailed strike values</summary>
                  <div className="options-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Strike</th>
                          <th>Call GEX</th>
                          <th>Put GEX magnitude</th>
                          <th>Net estimate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearby.map((b) => (
                          <tr key={b.strike}>
                            <th>{fmt(b.strike)}</th>
                            <td>{amount(b.callGex)}</td>
                            <td>{amount(b.putGex)}</td>
                            <td>{amount(b.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <p>Gamma data is unavailable for this selection.</p>
            )}
          </section>
          <section className="options-card">
            <h3>Open interest by strike</h3>
            {summary.buckets.length ? (
              <div className="options-oi">
                {nearby.map((b) => {
                  const max = Math.max(
                    1,
                    ...summary.buckets.map((x) => x.callOi + x.putOi),
                  );
                  return (
                    <div key={b.strike}>
                      <span>{fmt(b.strike)}</span>
                      <meter min={0} max={max} value={b.callOi}>
                        Calls {b.callOi}
                      </meter>
                      <meter min={0} max={max} value={b.putOi}>
                        Puts {b.putOi}
                      </meter>
                      <small>
                        Calls {fmt(b.callOi, 0)} / puts {fmt(b.putOi, 0)}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Open interest is unavailable.</p>
            )}
          </section>
          <section className="options-card">
            <h3>Estimated gamma flip</h3>
            <strong>
              {summary.flips.length
                ? summary.flips.map((x) => amount(x)).join(" · ")
                : "No supported crossing"}
            </strong>
            <p>
              {summary.profile.length
                ? "Repriced across 50–150% of spot with a European Black–Scholes approximation; flat IV, 4% interest and zero dividend yield. American exercise, dividends and actual dealer holdings can change the result."
                : "Requires a complete, same-date chain with gamma, IV and open interest for every selected standard contract."}
            </p>
            {!!summary.profile.length && (
              <Plot
                points={summary.profile.map((p) => ({ x: p.spot, y: p.gex }))}
                label="Modeled GEX across hypothetical underlying prices"
              />
            )}
          </section>
          <section className="options-card">
            <h3>Volatility skew</h3>
            <Plot
              points={summary.rows
                .filter((c) => c.type === "put" && c.iv !== null)
                .map((c) => ({ x: c.strike, y: c.iv! * 100 }))}
              label="Put implied volatility by strike (%)"
            />
          </section>
        </>
      )}
      {(view === "chain" || view === "leaps") && (
        <section className="options-card">
          <h3>
            {view === "leaps"
              ? "Longer-dated contract explorer"
              : "Options chain"}
          </h3>
          <p>
            {view === "leaps"
              ? "Select an expiry at least 365 days away. Compare cost, time decay and liquidity; longer duration does not eliminate risk."
              : "Premiums are per share. A standard contract represents 100 shares. Snapshot bid/ask are not guaranteed fills."}
          </p>
          <div className="options-toolbar">
            <label>
              Contract type
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="all">Calls & puts</option>
                <option value="call">Calls</option>
                <option value="put">Puts</option>
              </select>
            </label>
            <label className="options-check">
              <input
                type="checkbox"
                checked={onlyLiquid}
                onChange={(e) => setOnlyLiquid(e.target.checked)}
              />
              Liquidity filter: OI ≥ 100, positive bid, spread ≤ 20%
            </label>
          </div>
          <div className="options-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Type",
                    "Expiry",
                    "Strike",
                    "Bid",
                    "Ask",
                    "Spread",
                    "OI",
                    "Volume",
                    "IV",
                    "Delta",
                    "Gamma",
                    "Theta",
                    "Vega",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter(
                    (c) =>
                      view !== "leaps" ||
                      Date.parse(c.expiry) - Date.now() >= 365 * 86400000,
                  )
                  .slice(0, visibleCount)
                  .map((c) => (
                    <tr key={c.id}>
                      <th>{c.type}</th>
                      <td>{c.expiry}</td>
                      <td>{amount(c.strike)}</td>
                      <td>{c.bid === null ? "—" : amount(c.bid)}</td>
                      <td>{c.ask === null ? "—" : amount(c.ask)}</td>
                      <td>
                        {liquidity(c).spread === null
                          ? "—"
                          : fmt(liquidity(c).spread! * 100) + "%"}
                      </td>
                      <td>{fmt(c.oi, 0)}</td>
                      <td>{fmt(c.volume, 0)}</td>
                      <td>{c.iv === null ? "—" : fmt(c.iv * 100) + "%"}</td>
                      <td>{fmt(c.delta, 3)}</td>
                      <td>{fmt(c.gamma, 5)}</td>
                      <td>{fmt(c.theta, 3)}</td>
                      <td>{fmt(c.vega, 3)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {rows.length > visibleCount && (
            <button
              type="button"
              className="button"
              onClick={() => setVisibleCount((n) => n + 100)}
            >
              Show 100 more contracts
            </button>
          )}
          {!rows.length && (
            <p>
              No contracts pass the selected filters. Broaden filters or select
              another expiry.
            </p>
          )}
        </section>
      )}
      {view === "strategy" && (
        <section className="options-card">
          <h3>Compare a strategy—not a promise</h3>
          <p>
            Illustrations use one standard contract per leg, buying at ask and
            selling at bid. Fees, slippage and taxes are excluded. Stock-based
            strategies assume 100 shares purchased at the displayed underlying
            price.
          </p>
          <div className="options-toolbar">
            <label>
              Strategy
              <select
                value={strategy}
                onChange={(e) => {
                  setStrategy(e.target.value);
                  setSelected("");
                  setSecond("");
                }}
              >
                {[
                  ["call", "Long call · bullish"],
                  ["put", "Long put · bearish"],
                  ["covered", "Covered call · capped upside"],
                  ["protective", "Protective put · downside hedge"],
                  ["cash-put", "Cash-secured put · purchase obligation"],
                  ["call-spread", "Bull call spread · defined risk"],
                  ["put-spread", "Bull put spread · defined risk"],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isDebit || isCredit ? "Lower strike" : "Contract"}
              <select
                value={first?.id ?? ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="" disabled>
                  Select a liquid contract
                </option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type} {amount(c.strike)} · {c.expiry}
                  </option>
                ))}
              </select>
            </label>
            {(isDebit || isCredit) && (
              <label>
                Higher strike
                <select
                  value={other?.id ?? ""}
                  onChange={(e) => setSecond(e.target.value)}
                >
                  {higher.map((c) => (
                    <option key={c.id} value={c.id}>
                      {amount(c.strike)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {risk ? (
            <>
              <div className="options-kpis">
                <article>
                  <span>Maximum loss at expiry</span>
                  <strong>
                    {Number.isFinite(risk.maxLoss)
                      ? amount(risk.maxLoss)
                      : "Unbounded"}
                  </strong>
                </article>
                <article>
                  <span>Maximum gain at expiry</span>
                  <strong>
                    {Number.isFinite(risk.maxGain)
                      ? amount(risk.maxGain)
                      : "Unbounded"}
                  </strong>
                </article>
                <article>
                  <span>Breakeven at expiry</span>
                  <strong>
                    {risk.breakEven.map((x) => amount(x)).join(" / ") ||
                      "None in nonnegative prices"}
                  </strong>
                </article>
              </div>
              <Plot
                points={payoff}
                label="Expiry profit / loss in USD versus underlying price · one contract per leg"
              />
              {strategy === "cash-put" && first && (
                <p>
                  Cash collateral before premium: {amount(first.strike * 100)}.
                </p>
              )}
              {shares > 0 && (
                <p>
                  Illustrated stock purchase: {amount(spot * 100)}. This does
                  not verify your existing holdings or cost basis.
                </p>
              )}
            </>
          ) : (
            <p>
              Select a supported expiry and liquid contracts to calculate the
              payoff.
            </p>
          )}
          <p className="options-notice">
            Short options can be assigned before expiry. Spreads require
            managing both legs; assignment can temporarily create stock exposure
            and margin obligations. Confirm prices and requirements with your
            broker. No orders are submitted here.
          </p>
        </section>
      )}
      {view === "learn" && (
        <section className="options-card">
          <h3>Read the evidence</h3>
          {[
            [
              "Delta",
              "Approximate sensitivity to a $1 underlying move; not an exact probability of profit.",
            ],
            ["Gamma", "How quickly delta changes as the underlying moves."],
            [
              "Theta",
              "Modeled sensitivity to the passage of time; confirm provider units before comparing contracts.",
            ],
            [
              "Vega",
              "Sensitivity to implied volatility; provider scaling conventions can differ.",
            ],
            [
              "GEX",
              "A positioning estimate under stated sign assumptions. Open interest does not reveal dealer direction.",
            ],
            [
              "LEAPS",
              "Longer-dated options can still lose the full premium and become illiquid.",
            ],
            [
              "Implied move",
              "An options-price-based range proxy, not a forecast direction or guaranteed containment.",
            ],
            [
              "No IV rank yet",
              "A historical volatility series is required; one chain snapshot cannot establish IV rank or percentile.",
            ],
          ].map(([h, p]) => (
            <article className="options-explainer" key={h}>
              <h4>{h}</h4>
              <p>{p}</p>
            </article>
          ))}
        </section>
      )}
      <footer className="options-disclosure">
        Research illustrations, not personalized trade recommendations. Options
        involve leverage and can lose their entire premium; short strategies may
        create additional obligations. <a href="/risk">Research risks</a> ·{" "}
        <a
          href="https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the OCC options disclosure ↗
        </a>
      </footer>
    </div>
  );
}
