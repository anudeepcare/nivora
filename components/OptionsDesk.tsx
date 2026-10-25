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
import {
  listedExpiries,
  leapsExpiry,
  displayedContracts,
} from "@/lib/options-presentation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Layers3,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { amount, dateLabel } from "@/lib/format";
type Chain = {
  status: string;
  message?: string;
  contracts: OptionContract[];
  complete: boolean;
  frequency?: string;
  availableExpiries?: string[];
  symbol?: string;
  loadedExpiry?: string | null;
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
      </svg>
      <div className="options-plot-axis">
        <span>{fmt(minX)}</span>
        <span>{fmt(maxX)}</span>
      </div>
      <figcaption>
        {label} · vertical range {fmt(minY)} to {fmt(maxY)}
      </figcaption>
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
    [onlyLiquid, setOnlyLiquid] = useState(false),
    [strategy, setStrategy] = useState("call"),
    [selected, setSelected] = useState(""),
    [second, setSecond] = useState(""),
    [visibleCount, setVisibleCount] = useState(100);
  useEffect(() => {
    setChain(null);
    setKnownExpiries([]);
    setExpiry("");
    setSelected("");
    setSecond("");
  }, [research.company.symbol]);
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
        if (abort.signal.aborted) return;
        setChain((old) => ({
          ...data,
          symbol: research.company.symbol,
          loadedExpiry: expiry || null,
          contracts: [
            ...new Map(
              [
                ...(old?.symbol === research.company.symbol
                  ? old.contracts
                  : []),
                ...data.contracts,
              ].map((c) => [c.id, c]),
            ).values(),
          ],
        }));
        setKnownExpiries((old) =>
          listedExpiries(data.contracts, [
            ...old,
            ...(data.availableExpiries ?? []),
          ]),
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
  const contracts =
    chain?.symbol === research.company.symbol ? chain.contracts : [];
  const expiries = knownExpiries;
  const active = expiry || expiries[0] || "";
  const summary = useMemo(
    () =>
      optionsSummary(
        contracts,
        spot,
        active,
        Date.now(),
        !!chain?.complete &&
          (!chain.loadedExpiry || chain.loadedExpiry === active),
      ),
    [contracts, spot, active, chain?.complete, chain?.loadedExpiry],
  );
  const heatExpiries = [...new Set(contracts.map((c) => c.expiry))]
    .sort()
    .slice(0, 6);
  const heatStrikes = [
    ...new Set(contracts.filter((c) => c.standard).map((c) => c.strike)),
  ]
    .sort((a, b) => Math.abs(a - spot) - Math.abs(b - spot))
    .slice(0, 12)
    .sort((a, b) => b - a);
  const heatCells = heatStrikes.map((strike) =>
    heatExpiries.map((date) => {
      const rows = contracts.filter(
        (c) => c.standard && c.strike === strike && c.expiry === date,
      );
      if (
        !spot ||
        !rows.length ||
        rows.some((c) => c.oi === null || c.gamma === null)
      )
        return null;
      if (new Set(rows.map((c) => c.observed)).size !== 1) return null;
      return rows.reduce(
        (sum, c) =>
          sum +
          (c.type === "call" ? 1 : -1) *
            c.gamma! *
            c.oi! *
            c.multiplier *
            spot *
            spot *
            0.01,
        0,
      );
    }),
  );
  const heatMax = Math.max(1, ...heatCells.flat().map((v) => Math.abs(v ?? 0)));
  const nearby = [...summary.buckets]
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))
    .slice(0, 40)
    .sort((a, b) => a.strike - b.strike);
  const rows = displayedContracts(
    summary.rows,
    kind,
    onlyLiquid,
    (c) => liquidity(c).eligible,
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
  if ((isDebit || isCredit) && !other) legs = [];
  const risk = legs.length ? payoffRisk(legs, shares, spot) : null;
  const payoff = legs.length
    ? Array.from({ length: 81 }, (_, i) => {
        const x = spot * (i / 40);
        return { x, y: expirationPayoff(x, legs, shares, spot) };
      })
    : [];
  const longExpiry = leapsExpiry(expiries);
  const hasGamma = summary.netGex !== null;
  const hasOi = summary.rows.some((c) => c.oi !== null);
  const topCall = hasOi
    ? [...summary.buckets]
        .sort((a, b) => b.callOi - a.callOi)
        .find((b) => b.callOi > 0)
    : null;
  const topPut = hasOi
    ? [...summary.buckets]
        .sort((a, b) => b.putOi - a.putOi)
        .find((b) => b.putOi > 0)
    : null;
  const heatAvailable = heatCells.some((row) => row.some((v) => v !== null));
  const observed = summary.asOf
    ? dateLabel(summary.asOf)
    : "No observation for this expiry";
  const expiryLabel = (date: string) =>
    new Date(date + "T12:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const days = active
    ? Math.max(
        0,
        Math.ceil((Date.parse(active + "T21:00:00Z") - Date.now()) / 86400000),
      )
    : 0;
  function chooseExpiry(date: string) {
    setExpiry(date);
    setSelected("");
    setSecond("");
    setVisibleCount(100);
  }
  function navigate(id: string) {
    setView(id);
    if (id === "leaps" && longExpiry) chooseExpiry(longExpiry);
  }
  const example = summary.rows.find(
    (c) => c.delta !== null && c.type === "call",
  );
  return (
    <div className="options-desk options-v2 depth-options">
      <header className="options-heading">
        <div>
          <span className="eyebrow">Options workspace</span>
          <h2>See the setup. Understand your risk.</h2>
          <p>Price the move, explore contracts and test the payoff.</p>
        </div>
        <label className="options-expiry-picker">
          Expiration
          <select
            aria-label="Options expiration"
            value={active}
            disabled={!expiries.length || busy}
            onChange={(e) => chooseExpiry(e.target.value)}
          >
            {!expiries.length && (
              <option value="">Waiting for contracts</option>
            )}
            {expiries.map((date) => (
              <option key={date} value={date}>
                {expiryLabel(date)}
              </option>
            ))}
          </select>
        </label>
      </header>
      <nav className="options-nav" aria-label="Options sections">
        {[
          ["positioning", "Market map"],
          ["chain", "Contracts"],
          ["leaps", "Long-term"],
          ["strategy", "Strategy builder"],
          ["learn", "Understand options"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => navigate(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="options-notice">
          {error} Previously loaded observations remain dated as shown.
        </p>
      )}
      {busy && (
        <p role="status" className="options-loading">
          Loading contract prices…
        </p>
      )}
      {!contracts.length ? (
        <section className="options-empty" hidden={view === "learn"}>
          <Layers3 size={32} />
          <h3>
            {busy
              ? "Connecting your options workspace"
              : "No options snapshot available"}
          </h3>
          <p>
            {chain?.message ||
              (preview
                ? "This preview does not invent contract prices."
                : error
                  ? "Try another listed company or reload when the connection is available."
                  : "No contracts were returned. Try another company.")}
          </p>
        </section>
      ) : (
        <>
          <section className="options-hero">
            <div className="options-hero-intro">
              <span>
                <Activity size={15} /> {research.company.symbol} ·{" "}
                {expiryLabel(active)} · {days} days
              </span>
              <h3>
                {summary.straddle !== null && spot > 0
                  ? `${amount(Math.max(0, spot - summary.straddle))} – ${amount(spot + summary.straddle)}`
                  : `${summary.rows.length} contracts in view`}
              </h3>
              <p>
                {summary.straddle !== null && spot > 0
                  ? "ATM straddle-based range at expiration. A pricing reference, not a forecast or guaranteed range."
                  : summary.rows.length
                    ? "Explore available bid/ask prices. Positioning appears only when gamma and open interest are supplied."
                    : "This expiration has no returned observations. Choose another listed expiration."}
              </p>
            </div>
            <div className="options-hero-meta">
              <span>Underlying</span>
              <strong>{spot > 0 ? amount(spot) : "Not priced"}</strong>
              <small>Options · {observed}</small>
              <small>
                {chain?.frequency?.startsWith("Indicative")
                  ? "Indicative · modified quotes / delayed trades"
                  : "Snapshot pricing"}
              </small>
            </div>
          </section>
          <div className="options-statusline">
            <span>
              <Clock3 size={14} /> Snapshot data · confirm executable prices
              with your broker
            </span>
            <details>
              <summary>Data details</summary>
              <p>
                {chain?.frequency}{" "}
                {!chain?.complete &&
                  "Partial chain; totals cover only returned contracts."}{" "}
                Underlying observation:{" "}
                {research.quote.asOf
                  ? dateLabel(research.quote.asOf)
                  : "unavailable"}
                . Open interest updates separately from quotes.
              </p>
            </details>
          </div>
          {view === "positioning" && (
            <>
              {(hasGamma || hasOi) && (
                <div className="options-insight-grid">
                  <article>
                    <span>
                      <Layers3 size={17} /> Call concentration
                    </span>
                    <strong>
                      {topCall ? amount(topCall.strike) : "Not measured"}
                    </strong>
                    <p>
                      {topCall
                        ? `${fmt(topCall.callOi, 0)} open calls at this strike`
                        : "Open interest is not supplied for this selection."}
                    </p>
                  </article>
                  <article>
                    <span>
                      <ShieldCheck size={17} /> Put concentration
                    </span>
                    <strong>
                      {topPut ? amount(topPut.strike) : "Not measured"}
                    </strong>
                    <p>
                      {topPut
                        ? `${fmt(topPut.putOi, 0)} open puts at this strike`
                        : "A missing value is not zero positioning."}
                    </p>
                  </article>
                  <article>
                    <span>
                      <Activity size={17} /> Estimated net gamma
                    </span>
                    <strong>
                      {hasGamma ? amount(summary.netGex) : "Not measured"}
                    </strong>
                    <p>
                      {hasGamma
                        ? `${fmt(summary.gammaCoverage * 100, 0)}% input coverage · per 1% stock move`
                        : "Gamma and dated open interest are required."}
                    </p>
                  </article>
                </div>
              )}
              {!hasGamma && !hasOi ? (
                <section className="options-empty options-empty-inline">
                  <Activity size={28} />
                  <div>
                    <h3>
                      Prices are available. Positioning is not yet measurable.
                    </h3>
                    <p>
                      This snapshot lacks usable gamma or open interest. There
                      is no supported GEX, gamma flip or positioning heatmap to
                      show.
                    </p>
                    <button
                      type="button"
                      className="button"
                      onClick={() => setView("chain")}
                    >
                      Explore available contracts <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              ) : (
                <div className="options-chart-grid">
                  {hasGamma && (
                    <section className="options-card">
                      <span className="eyebrow">Gamma map</span>
                      <h3>Where exposure clusters</h3>
                      <Plot
                        points={nearby.map((b) => ({ x: b.strike, y: b.net }))}
                        label="Strike price → · estimated net GEX ($ per 1% move)"
                      />
                      <p>
                        Calls positive, puts negative. This convention does not
                        establish actual dealer positions.
                      </p>
                    </section>
                  )}
                  {hasOi && (
                    <section className="options-card">
                      <span className="eyebrow">Open contracts</span>
                      <h3>Call & put concentrations</h3>
                      <div className="options-oi">
                        {[...nearby]
                          .sort(
                            (a, b) => b.callOi + b.putOi - (a.callOi + a.putOi),
                          )
                          .slice(0, 8)
                          .sort((a, b) => a.strike - b.strike)
                          .map((b) => (
                            <div key={b.strike}>
                              <strong>{amount(b.strike)}</strong>
                              <div className="options-oi-bars">
                                <span
                                  style={{
                                    width: `${(100 * b.callOi) / Math.max(1, ...nearby.map((x) => x.callOi + x.putOi))}%`,
                                  }}
                                />
                                <i
                                  style={{
                                    width: `${(100 * b.putOi) / Math.max(1, ...nearby.map((x) => x.callOi + x.putOi))}%`,
                                  }}
                                />
                              </div>
                              <small>
                                {fmt(b.callOi, 0)} calls · {fmt(b.putOi, 0)}{" "}
                                puts
                              </small>
                            </div>
                          ))}
                      </div>
                      <p>
                        <span className="options-dot" /> Calls{" "}
                        <span className="options-dot put" /> Puts ·
                        concentration is not confirmed support or resistance.
                      </p>
                    </section>
                  )}
                </div>
              )}
              {heatAvailable && (
                <section className="options-card options-heatmap">
                  <span className="eyebrow">Strike × expiration</span>
                  <h3>Gamma heatmap</h3>
                  <p>
                    Blue: call-positive estimate. Rose: put-negative estimate.
                    Blank cells lack required inputs.
                  </p>
                  <div className="options-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Strike</th>
                          {heatExpiries.map((date) => (
                            <th key={date}>{expiryLabel(date)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatStrikes.map((strike, i) => (
                          <tr key={strike}>
                            <th>{amount(strike)}</th>
                            {heatCells[i].map((v, j) => (
                              <td
                                key={j}
                                style={
                                  v === null
                                    ? undefined
                                    : {
                                        background: `color-mix(in srgb, ${v === 0 ? "transparent" : v > 0 ? "var(--blue)" : "#bf4058"} ${Math.round(12 + (Math.abs(v) / heatMax) * 45)}%, transparent)`,
                                      }
                                }
                              >
                                {v === null ? "—" : fmt(v, 0)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Dollar exposure per 1% stock move. Dates can differ across
                    cells; not synchronized dealer inventory.
                  </p>
                </section>
              )}
              {!!summary.profile.length && (
                <section className="options-card">
                  <h3>Gamma across possible stock prices</h3>
                  <strong>
                    {summary.flips.length
                      ? `Estimated flip: ${summary.flips.map((x) => amount(x)).join(" / ")}`
                      : "No crossing in the modeled range"}
                  </strong>
                  <Plot
                    points={summary.profile.map((p) => ({
                      x: p.spot,
                      y: p.gex,
                    }))}
                    label="Hypothetical stock price → · modeled gamma exposure"
                  />
                  <p>
                    European Black–Scholes approximation; fixed IV, 4% interest,
                    no dividends. Actual positions and American exercise are not
                    modeled.
                  </p>
                </section>
              )}
              {summary.rows.filter((c) => c.type === "put" && c.iv !== null)
                .length > 1 && (
                <section className="options-card">
                  <h3>How put volatility varies by strike</h3>
                  <Plot
                    points={summary.rows
                      .filter((c) => c.type === "put" && c.iv !== null)
                      .map((c) => ({ x: c.strike, y: c.iv! * 100 }))}
                    label="Put implied volatility (%) · strike price →"
                  />
                </section>
              )}
            </>
          )}
          {(view === "chain" || view === "leaps") && (
            <section className="options-card options-contracts">
              <div className="options-section-heading">
                <div>
                  <span className="eyebrow">
                    {view === "leaps" ? "365+ days" : "Listed contracts"}
                  </span>
                  <h3>
                    {view === "leaps"
                      ? "More time. Still defined risk."
                      : "Find a contract you can understand"}
                  </h3>
                </div>
                <span className="options-count">
                  {
                    rows.filter(
                      (c) =>
                        view !== "leaps" ||
                        Date.parse(c.expiry + "T21:00Z") - Date.now() >=
                          365 * 86400000,
                    ).length
                  }{" "}
                  shown
                </span>
              </div>
              <p>
                Premiums below are per share; a standard contract covers 100
                shares. Indicative prices are not executable quotes.
              </p>
              <div className="options-toolbar">
                <div className="options-segment" aria-label="Contract type">
                  {[
                    ["all", "All"],
                    ["call", "Calls"],
                    ["put", "Puts"],
                  ].map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={kind === id}
                      onClick={() => setKind(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="options-check">
                  <input
                    type="checkbox"
                    checked={onlyLiquid}
                    onChange={(e) => setOnlyLiquid(e.target.checked)}
                  />{" "}
                  Liquid contracts only
                </label>
              </div>
              {view === "leaps" && !longExpiry ? (
                <div className="options-empty">
                  <Clock3 />
                  <h3>No long-dated expirations in the returned dataset</h3>
                  <p>
                    Short-dated contracts are not shown as LEAPS. Partial chain
                    limits may omit later dates.
                  </p>
                </div>
              ) : (
                <>
                  <div className="options-scroll">
                    <table>
                      <thead>
                        <tr>
                          {[
                            "Contract",
                            "Strike",
                            "Bid / ask",
                            "Cost at ask¹",
                            "Open interest",
                            "IV",
                            "Delta",
                            "Spread",
                            "Explore",
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
                              Date.parse(c.expiry + "T21:00Z") - Date.now() >=
                                365 * 86400000,
                          )
                          .slice(0, visibleCount)
                          .map((c) => (
                            <tr key={c.id}>
                              <th>
                                <span className={`options-type ${c.type}`}>
                                  {c.type}
                                </span>
                                <small>{expiryLabel(c.expiry)}</small>
                              </th>
                              <td>{amount(c.strike)}</td>
                              <td>
                                {c.bid === null ? "—" : amount(c.bid)} /{" "}
                                {c.ask === null ? "—" : amount(c.ask)}
                              </td>
                              <td>
                                {c.ask === null ? "—" : amount(c.ask * 100)}
                              </td>
                              <td>
                                {c.oi === null ? "Not supplied" : fmt(c.oi, 0)}
                              </td>
                              <td>
                                {c.iv === null ? "—" : fmt(c.iv * 100, 1) + "%"}
                              </td>
                              <td>{fmt(c.delta, 2)}</td>
                              <td>
                                {liquidity(c).spread === null
                                  ? "—"
                                  : fmt(liquidity(c).spread! * 100, 1) + "%"}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="options-link"
                                  disabled={!liquidity(c).eligible}
                                  title={
                                    liquidity(c).eligible
                                      ? "Use in the strategy builder"
                                      : "Requires open interest ≥100, positive bid and spread ≤20%"
                                  }
                                  onClick={() => {
                                    setStrategy(c.type);
                                    setSelected(c.id);
                                    setView("strategy");
                                  }}
                                >
                                  Payoff <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {!rows.length && (
                    <div className="options-empty">
                      <h3>
                        {onlyLiquid
                          ? "No contracts meet the liquidity checks"
                          : "No matching contracts for this expiration"}
                      </h3>
                      <p>
                        {onlyLiquid
                          ? "Open interest may be missing, or the bid/spread fails the filter. Show all contracts to inspect the actual data."
                          : "Choose another listed expiration."}
                      </p>
                      {onlyLiquid && (
                        <button
                          type="button"
                          className="button"
                          onClick={() => setOnlyLiquid(false)}
                        >
                          Show all contracts
                        </button>
                      )}
                    </div>
                  )}
                  {rows.length > visibleCount && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => setVisibleCount((n) => n + 100)}
                    >
                      Show 100 more
                    </button>
                  )}
                </>
              )}
              <details className="options-method">
                <summary>All Greeks & activity</summary>
                <p>
                  Provider sensitivities describe exposure, not predicted
                  returns. Daily volume stays missing when the feed does not
                  supply it.
                </p>
                <div className="options-scroll">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Contract",
                          "Delta",
                          "Gamma",
                          "Theta",
                          "Vega",
                          "Daily volume",
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
                            Date.parse(c.expiry + "T21:00Z") - Date.now() >=
                              365 * 86400000,
                        )
                        .slice(0, visibleCount)
                        .map((c) => (
                          <tr key={c.id}>
                            <th>
                              {c.type} {amount(c.strike)}
                              <small>{expiryLabel(c.expiry)}</small>
                            </th>
                            <td>{fmt(c.delta, 3)}</td>
                            <td>{fmt(c.gamma, 5)}</td>
                            <td>{fmt(c.theta, 3)}</td>
                            <td>{fmt(c.vega, 3)}</td>
                            <td>
                              {c.volume === null
                                ? "Not supplied"
                                : fmt(c.volume, 0)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
              <details className="options-method">
                <summary>Reading this table</summary>
                <p>
                  ¹ Cost at ask assumes one 100-share contract and excludes
                  fees. Liquidity checks require open interest ≥100, a positive
                  bid and a spread ≤20% of midpoint. Missing open interest is
                  not zero. A disabled payoff link means those checks were not
                  met.
                </p>
              </details>
            </section>
          )}
          {view === "strategy" && (
            <section className="options-card">
              <span className="eyebrow">Risk before return</span>
              <h3>Build a payoff you understand</h3>
              <p>
                One standard contract per leg. Buy at ask, sell at bid; fees
                excluded. These are indicative illustrations.
              </p>
              <div className="options-strategies">
                {[
                  ["call", "Long call", "Bullish · premium at risk"],
                  ["put", "Long put", "Bearish · premium at risk"],
                  ["call-spread", "Call spread", "Bullish · capped payoff"],
                  ["put-spread", "Put spread", "Bullish · defined risk"],
                  ["covered", "Covered call", "100 shares · capped upside"],
                  [
                    "protective",
                    "Protective put",
                    "100 shares · downside hedge",
                  ],
                  ["cash-put", "Cash-secured put", "Obligation to buy shares"],
                ].map(([id, name, desc]) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={strategy === id}
                    onClick={() => {
                      setStrategy(id);
                      setSelected("");
                      setSecond("");
                    }}
                  >
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
              {!candidates.length ? (
                <div className="options-empty options-empty-inline">
                  <ShieldCheck size={28} />
                  <div>
                    <h3>No contract meets the strategy checks</h3>
                    <p>
                      {summary.rows.some((c) => c.oi === null)
                        ? "Open interest is missing for some contracts. We cannot establish liquidity from these quotes alone."
                        : "The returned contracts do not meet the bid, spread or open-interest checks."}
                    </p>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setOnlyLiquid(false);
                        setView("chain");
                      }}
                    >
                      Inspect contracts <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="options-toolbar">
                    <label>
                      {isDebit || isCredit ? "Lower strike" : "Contract"}
                      <select
                        value={first?.id ?? ""}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.type} {amount(c.strike)} ·{" "}
                            {expiryLabel(c.expiry)} · ask {amount(c.ask)}
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
                          {!higher.length && (
                            <option value="">No eligible second leg</option>
                          )}
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
                      <div className="options-insight-grid">
                        <article data-tone="risk">
                          <span>Maximum loss at expiry</span>
                          <strong>
                            {Number.isFinite(risk.maxLoss)
                              ? amount(risk.maxLoss)
                              : "Unbounded"}
                          </strong>
                        </article>
                        <article data-tone="gain">
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
                              "None at nonnegative prices"}
                          </strong>
                        </article>
                      </div>
                      <Plot
                        points={payoff}
                        label="Stock price at expiry → · profit / loss ($), one contract per leg"
                      />
                      {strategy === "cash-put" && first && (
                        <p>
                          Cash collateral before premium:{" "}
                          {amount(first.strike * 100)}.
                        </p>
                      )}
                      {shares > 0 && (
                        <p>
                          Includes an illustrative purchase of 100 shares for{" "}
                          {amount(spot * 100)}; your holdings are not verified.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Select two eligible strikes to model this spread.</p>
                  )}
                </>
              )}
              <details className="options-method">
                <summary>Assumptions & assignment risk</summary>
                <p>
                  Short options may be assigned before expiry. Spreads require
                  management of both legs and can temporarily create stock
                  exposure. Payoffs show expiration only, excluding fees, taxes
                  and slippage. Confirm prices, collateral and requirements with
                  your broker. No orders are submitted.
                </p>
              </details>
            </section>
          )}
        </>
      )}
      {view === "learn" && (
        <section className="options-card">
          <span className="eyebrow">
            <BookOpen size={15} /> Read an option in a minute
          </span>
          <h3>Start with cost, then risk, then sensitivity.</h3>
          <div className="options-learn-grid">
            {[
              [
                "01",
                "Premium",
                "The price per share. A $2.00 premium costs $200 for a standard 100-share contract.",
              ],
              [
                "02",
                "Expiration",
                "Your option has a deadline. An out-of-the-money long option can expire worthless.",
              ],
              [
                "03",
                "Delta",
                example
                  ? `This call has delta ${fmt(example.delta, 2)}: a $1 stock increase implies roughly ${amount(example.delta! * 100)} more contract value initially, holding other inputs fixed.`
                  : "Delta 0.50 means approximately $50 more value per standard call contract for an initial $1 stock rise, other inputs fixed.",
              ],
              [
                "04",
                "Gamma",
                "How quickly delta changes. High gamma means your exposure can change rapidly as the stock moves.",
              ],
              [
                "05",
                "Time & volatility",
                "Time decay can reduce a long option’s value. Changes in implied volatility can move its price even if the stock stays flat.",
              ],
              [
                "06",
                "Open interest & GEX",
                "Open interest counts outstanding contracts. GEX combines it with gamma under explicit sign assumptions; it does not reveal who is buying or dealer direction.",
              ],
            ].map(([n, title, body]) => (
              <article key={n}>
                <span>{n}</span>
                <h4>{title}</h4>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <footer className="options-disclosure">
        Options can lose their entire premium. Short positions can create
        additional obligations. <a href="/risk">Research risks</a> ·{" "}
        <a
          href="https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document"
          target="_blank"
          rel="noopener noreferrer"
        >
          OCC options disclosure ↗
        </a>
      </footer>
    </div>
  );
}
