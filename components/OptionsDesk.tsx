"use client";
import { volatilityContext, rankContracts } from "@/lib/options-context";
import OptionsSnapshot from "./OptionsSnapshot";
import OptionsExpiryComparison from "./OptionsExpiryComparison";
import SearchableSelect from "./SearchableSelect";
import MarketWorkspace from "./MarketWorkspace";
import VannaMap from "./VannaMap";
import OptionsSimulation from "./OptionsSimulation";
import OptionsTape from "./OptionsTape";
import deskStyles from "./OptionsDesk.module.css";
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
    low = Math.min(...points.map((p) => p.y)),
    high = Math.max(...points.map((p) => p.y)),
    pad = Math.max((high - low) * 0.15, Math.abs(high) * 0.02, 0.01),
    minY = low - pad,
    maxY = high + pad;
  const X = (n: number) =>
      40 + ((n - minX) / Math.max(1e-9, maxX - minX)) * 620,
    Y = (n: number) => 170 - ((n - minY) / Math.max(1e-9, maxY - minY)) * 135;
  return (
    <figure className="options-plot">
      <svg
        viewBox="0 0 700 210"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        {[minY, (minY + maxY) / 2, maxY].map((y) => (
          <g key={y}>
            <line
              x1="40"
              x2="660"
              y1={Y(y)}
              y2={Y(y)}
              stroke="currentColor"
              opacity=".12"
            />
            <text
              x="36"
              y={Y(y) + 4}
              fontSize="10"
              textAnchor="end"
              fill="currentColor"
            >
              {new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(y)}
            </text>
          </g>
        ))}

        {minY <= 0 && maxY >= 0 && (
          <line
            x1="40"
            x2="660"
            y1={Y(0)}
            y2={Y(0)}
            stroke="currentColor"
            opacity=".3"
          />
        )}
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
    [visibleCount, setVisibleCount] = useState(100),
    [contractSort, setContractSort] = useState("strike"),
    [contractSearch, setContractSearch] = useState(""),
    [requestVersion, setRequestVersion] = useState(0);
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
  }, [research.company.symbol, expiry, preview, requestVersion]);
  const contracts =
    chain?.symbol === research.company.symbol ? chain.contracts : [];
  const expiries = knownExpiries;
  const active = expiry || expiries.find((date) => contracts.some((c) => c.expiry === date)) || expiries[0] || "";
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
  const filteredRows = displayedContracts(
    summary.rows,
    kind,
    onlyLiquid,
    (c) => liquidity(c).eligible,
  );
  const rows = rankContracts(
    filteredRows.filter(
      (c) =>
        !contractSearch ||
        `${c.id} ${c.strike}`
          .toLowerCase()
          .includes(contractSearch.toLowerCase()),
    ),
    contractSort,
  );
  const volatility = volatilityContext(
    contracts,
    research.history ?? [],
    spot,
    research.priceObservedAt ?? research.retrievedAt,
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
  const hasGamma = summary.netGex !== null && summary.allInputs;
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
    <div className={`${deskStyles.desk} options-desk options-v2 depth-options`}>
      <header className="options-heading">
        <div>
          <h2>
            <Layers3 size={21} /> Options
          </h2>
        </div>
        <div className="options-expiry-picker">
          <SearchableSelect
            label="Expiration date"
            value={active}
            disabled={!expiries.length}
            onChange={chooseExpiry}
            options={expiries.map((date) => ({
              value: date,
              label: expiryLabel(date),
            }))}
            placeholder="Waiting for contracts"
          />
        </div>
      </header>
      <nav className="options-nav" aria-label="Options sections">
        {[
          ["positioning", "Price levels"],
          ["chain", "Calls & puts"],
          ["learn", "Guide"],
          ["simulation", "Practice"],
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
        <label className="options-advanced-picker"><span>Advanced</span><select aria-label="Advanced options tools" value={['vanna','flow','leaps','strategy'].includes(view)?view:''} onChange={e=>navigate(e.target.value)}><option value="" disabled>Choose a tool</option><option value="vanna">Vanna exposure</option><option value="flow">Trade tape</option><option value="leaps">Long-term contracts</option><option value="strategy">Strategy payoff</option></select></label>
      </nav>
      {error && (
        <p role="alert" className="options-notice">
          {error} Previously loaded observations remain dated as shown.{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => setRequestVersion((v) => v + 1)}
          >
            Retry options
          </button>
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
          {["positioning", "chain", "leaps"].includes(view) && (
            <section className="options-hero">
              <div className="options-hero-intro">
                <span>
                  <Activity size={15} /> {research.company.symbol} ·{" "}
                  {expiryLabel(active)} · {days} days
                </span>
                <span className={deskStyles.rangeLabel}>
                  Option-priced range
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
                <span>Stock price</span>
                <strong>{spot > 0 ? amount(spot) : "Not priced"}</strong>
                <small>Options · {observed}</small>
                <small>
                  {chain?.frequency?.startsWith("Indicative")
                    ? "Indicative · modified quotes / delayed trades"
                    : "Snapshot pricing"}
                </small>
              </div>
            </section>
          )}
          {["positioning", "chain", "leaps"].includes(view) && (
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
          )}
          {view === "positioning" && (
            <>
              <OptionsSnapshot contracts={summary.rows} spot={spot} expiry={active} />
              <OptionsExpiryComparison contracts={contracts} active={active} onChoose={chooseExpiry}/>
              {!hasGamma && !hasOi && (
                <section className="options-empty options-empty-inline">
                  <Activity size={28} />
                  <div>
                    <h3>
                      Gamma inputs unavailable
                    </h3>
                    <p>
                      This expiration has no usable gamma or open-interest inputs. Call and put prices may still be available.
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
              )}
              <MarketWorkspace
                contracts={contracts}
                spot={spot}
                symbol={research.company.symbol}
                complete={!!chain?.complete}
                expiry={active}
                onContracts={() => setView("chain")}
              />
              <details className={deskStyles.analytics}>
                <summary>Volatility & model diagnostics</summary>
                {(hasGamma || hasOi) && (
                  <details>
                    <summary>
                      Concentrations & gamma
                    </summary>
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
                          {hasGamma
                            ? amount(summary.netGex, "USD", true)
                            : "Not measured"}
                        </strong>
                        <p>
                          {hasGamma
                            ? `${fmt(summary.gammaCoverage * 100, 0)}% input coverage · per 1% stock move`
                            : "Complete, same-observation gamma and open interest are required for an aggregate total."}
                        </p>
                      </article>
                    </div>
                  </details>
                )}
                <section className="options-card options-volatility">
                  <h3>
                    <Activity size={19} /> Volatility & movement
                  </h3>
                  <p>
                    Compare the option market’s implied volatility with recent
                    historical movement. These describe different periods and
                    are not directional signals.
                  </p>
                  <div className="options-insight-grid">
                    <article>
                      <span>20-session realized volatility</span>
                      <strong>
                        {volatility.realized === null
                          ? "History needed"
                          : `${(volatility.realized * 100).toFixed(1)}%`}
                      </strong>
                      <p>
                        Annualized with 252 sessions
                        {volatility.realizedThrough
                          ? ` · through ${dateLabel(volatility.realizedThrough)}`
                          : " · twenty returns required"}
                      </p>
                    </article>
                    <article>
                      <span>Near-the-money implied volatility</span>
                      <strong>
                        {volatility.term.find((x) => x.expiry === active)
                          ? `${(volatility.term.find((x) => x.expiry === active)!.iv * 100).toFixed(1)}%`
                          : "Not supplied"}
                      </strong>
                      <p>
                        Returned contracts nearest the underlying price ·
                        selected expiration
                      </p>
                    </article>
                  </div>
                  {volatility.term.length > 0 && (
                    <details>
                      <summary>
                        Term structure · {volatility.term.length} loaded
                        expirations
                      </summary>
                      <div className="options-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Expiration</th>
                              <th>Reference strike</th>
                              <th>Implied volatility</th>
                              <th>Observation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {volatility.term.map((x) => (
                              <tr key={x.expiry}>
                                <th>{dateLabel(x.expiry)}</th>
                                <td>{amount(x.strike)}</td>
                                <td>{(x.iv * 100).toFixed(1)}%</td>
                                <td>{dateLabel(x.observed)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                  <p>
                    Implied volatility describes option pricing, not the
                    direction of the next move.
                  </p>
                </section>
                {!!summary.profile.length && (
                  <section className="options-card">
                    <h3>Gamma sensitivity</h3>
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
                      European Black–Scholes approximation; fixed IV, 4%
                      interest, no dividends. Actual positions and American
                      exercise are not modeled.
                    </p>
                  </section>
                )}
                {summary.rows.filter((c) => c.type === "put" && c.iv !== null)
                  .length > 1 && (
                  <section className="options-card">
                    <h3>Volatility by strike</h3>
                    <Plot
                      points={summary.rows
                        .filter((c) => c.type === "put" && c.iv !== null)
                        .map((c) => ({ x: c.strike, y: c.iv! * 100 }))}
                      label="Put implied volatility (%) · strike price →"
                    />
                  </section>
                )}
              </details>
            </>
          )}
          {view === "vanna" && (
            <VannaMap
              contracts={contracts}
              spot={spot}
              asOf={summary.asOf || new Date().toISOString().slice(0, 10)}
            />
          )}
          {view === "flow" && (
            <OptionsTape
              symbol={research.company.symbol}
              expiry={active}
              disabled={preview}
            />
          )}
          {view === "simulation" && (
            <OptionsSimulation
              contracts={contracts}
              spot={spot}
              symbol={research.company.symbol}
              disabled={preview}
            />
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
                      : "Options contracts"}
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
              <div className={`options-toolbar ${deskStyles.contractFilters}`}>
                <label>
                  Find contract
                  <input
                    type="search"
                    value={contractSearch}
                    onChange={(e) => {
                      setContractSearch(e.target.value);
                      setVisibleCount(100);
                    }}
                    placeholder="Strike or contract symbol"
                  />
                </label>
                <label>
                  Rank by
                  <select
                    value={contractSort}
                    onChange={(e) => {
                      setContractSort(e.target.value);
                      setVisibleCount(100);
                    }}
                  >
                    <option value="strike">Strike</option>
                    <option value="volume">Reported volume</option>
                    <option value="oi">Open interest</option>
                    <option value="ratio">Volume / open interest</option>
                  </select>
                </label>
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
                  <div className={`options-scroll ${deskStyles.contractTable}`}>
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
              <h3>Compare strategy payoffs</h3>
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
          <h3>Options essentials</h3>
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
