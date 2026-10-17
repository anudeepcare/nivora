"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  Plus,
  Bookmark,
  Trash2,
  Wallet,
  PenLine,
  X,
  RefreshCw,
  Search as SearchIcon,
  PieChart,
} from "lucide-react";
import type { Company, Position, Quote } from "@/lib/types";
import { portfolioTotals } from "@/lib/engine";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { Empty, PageHeading, SecurityLogo, Notice, Help } from "./Ui";
import Search from "./Search";
import { api } from "@/lib/client";
import { workspaceSymbolBatches } from "@/lib/workspace";

type Quotes = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export function useWorkspaceQuotes(
  scope: "all" | "watchlist" | "portfolio" = "all",
) {
  const { workspace, demo, cache } = useProduct(),
    groups = workspaceSymbolBatches(
      scope === "watchlist" ? [] : (workspace?.positions ?? []),
      scope === "portfolio" ? [] : (workspace?.watchlist ?? []),
      10,
    ),
    key = JSON.stringify(groups),
    [revision, setRevision] = useState(0),
    [data, setData] = useState<Quotes>({}),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(() => setRevision((x) => x + 1), []);
  useEffect(() => {
    if (demo) {
      setData(
        Object.fromEntries(
          Object.entries(demo.research).map(([s, r]) => [
            s,
            { company: r.company, quote: r.quote },
          ]),
        ),
      );
      return;
    }
    const abort = new AbortController();
    let active = true;
    const selected = JSON.parse(key) as string[][],
      cached: Quotes = {};
    for (const symbol of selected.flat()) {
      const row = cache.get("quote:" + symbol);
      if (row) cached[symbol] = row.value as Quotes[string];
    }
    setData(cached);
    setLoading(selected.length > 0);
    setError("");
    let windowStarted = Date.now();
    const pause = () =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(
          resolve,
          Math.max(0, 61000 - (Date.now() - windowStarted)),
        );
        abort.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
    (async () => {
      let requested = 0;
      for (const group of selected) {
        if (!active) break;
        const missing = group.filter(
          (s) =>
            revision > 0 ||
            !cache.get("quote:" + s) ||
            Date.now() - cache.get("quote:" + s)!.at > 60000,
        );
        if (!missing.length) continue;
        const weight = missing.reduce(
          (n, s) => n + (s.includes("/") ? 2 : 1),
          0,
        );
        if (requested + weight > 40) {
          await pause();
          requested = 0;
          windowStarted = Date.now();
        }
        if (!active) break;
        try {
          const result = await api<Quotes>(
            "quotes?symbols=" + encodeURIComponent(missing.join(",")),
            undefined,
            abort.signal,
          );
          if (!active) break;
          for (const [s, r] of Object.entries(result))
            if (r.quote) cache.set("quote:" + s, { at: Date.now(), value: r });
          setData((old) => {
            const next = { ...old };
            for (const [symbol, row] of Object.entries(result))
              next[symbol] = row.quote
                ? row
                : {
                    ...old[symbol],
                    ...row,
                    ...(old[symbol]?.quote
                      ? { quote: { ...old[symbol].quote!, stale: true } }
                      : {}),
                  };
            return next;
          });
          requested += weight;
        } catch (e) {
          if (active)
            setError(e instanceof Error ? e.message : "Quotes unavailable");
          requested += weight;
        }
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, demo, cache, revision]);
  return { data, loading, error, refresh };
}
export function ResearchHome() {
  const { workspace, demo, workspaceError } = useProduct(),
    quotes = useWorkspaceQuotes(),
    prefix = demo ? "/preview" : "";
  const symbols = [
    ...new Set([
      ...(workspace?.watchlist.map((w) => w.symbol) || []),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) || []),
    ]),
  ];
  return (
    <section>
      <PageHeading
        title="Your next decision, in focus."
        subtitle="Explore the business, understand the price and build your perspective."
      />
      <div className="research-search">
        <Search large />
      </div>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <Notice error>{quotes.error}</Notice>}
      <header className="section-heading">
        <h2>Your research universe</h2>
        <span className="muted small">{symbols.length} saved companies</span>
      </header>
      {symbols.length ? (
        <div className="company-grid">
          {symbols.map((symbol) => {
            const q = quotes.data?.[symbol];
            return (
              <Link
                className="company-card"
                key={symbol}
                href={`${prefix}/research/${encodeURIComponent(symbol)}`}
              >
                <div>
                  <SecurityLogo symbol={symbol} />
                  <ArrowUpRight size={17} />
                </div>
                <h3>{q?.company?.name || symbol}</h3>
                <span className="muted small">
                  {symbol} · {q?.company?.exchange || "Your research"}
                </span>
                <footer>
                  <strong>{amount(q?.quote?.price, q?.quote?.currency)}</strong>
                  <span
                    className={
                      q?.quote?.changePct == null
                        ? "muted"
                        : q.quote.changePct < 0
                          ? "red"
                          : "green"
                    }
                  >
                    {percent(q?.quote?.changePct, true)}
                  </span>
                </footer>
                <small className="quote-stamp">
                  {q?.quote
                    ? quoteTime(q.quote.asOf)
                    : q?.error || "Loading price…"}
                </small>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title="Start with a company you care about">
          Search above. Save a company to keep it within reach here.
        </Empty>
      )}
    </section>
  );
}
export function Overview() {
  const { workspace, demo, workspaceError } = useProduct(),
    quotes = useWorkspaceQuotes(),
    prefix = demo ? "/preview" : "";
  const q = Object.fromEntries(
      Object.entries(quotes.data || {})
        .filter(([, v]) => v.quote)
        .map(([k, v]) => [k, v.quote!]),
    ),
    totals = portfolioTotals(workspace?.positions || [], q);
  const holdings =
    workspace?.positions.filter((p) => p.assetType !== "cash") || [];
  return (
    <section>
      <PageHeading
        title="Your investing perspective."
        subtitle="The companies you follow. The portfolio you’re building."
        action={
          <Link className="button" href={`${prefix}/research`}>
            Research a company <ArrowUpRight size={16} />
          </Link>
        }
      />
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <Notice error>{quotes.error}</Notice>}
      <section className="panel overview-hero">
        <div>
          <span className="eyebrow">YOUR PORTFOLIO · USD</span>
          <div className="balance">
            {workspace ? amount(totals.knownValue) : "—"}
          </div>
          <p className="balance-caption">
            {quotes.loading
              ? "Updating prices…"
              : totals.missing.length
                ? `${totals.missing.length} unpriced holdings excluded`
                : "Priced investments and recorded cash"}
          </p>
          <div className="mini-stats">
            <div>
              <span>Unrealized return</span>
              <strong
                className={
                  totals.pnl != null && totals.pnl < 0 ? "red" : "green"
                }
              >
                {amount(totals.pnl)}
              </strong>
            </div>
            <div>
              <span>Investments</span>
              <strong>{holdings.length}</strong>
            </div>
            <div>
              <span>Following</span>
              <strong>{workspace?.watchlist.length ?? "—"}</strong>
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading">
            <h2>Your allocation</h2>
            <Link className="text-button" href={`${prefix}/portfolio`}>
              View portfolio <ArrowUpRight size={16} />
            </Link>
          </div>
          <Allocation positions={workspace?.positions || []} quotes={q} />
        </div>
      </section>
      <section className="panel support">
        <header className="section-heading">
          <h2>On your radar</h2>
          <Link className="text-button" href={`${prefix}/watchlist`}>
            View all <ArrowUpRight size={16} />
          </Link>
        </header>
        <InvestmentRows
          symbols={workspace?.watchlist.slice(0, 6).map((w) => w.symbol) || []}
          quotes={quotes.data || {}}
        />
      </section>
      <div className="research-entry support">
        <div>
          <h2>Find your next idea</h2>
          <p className="muted">
            Financials, valuation and price structure in one place.
          </p>
        </div>
        <Search />
      </div>
    </section>
  );
}
function InvestmentRows({
  symbols,
  quotes,
  remove,
}: {
  symbols: string[];
  quotes: Quotes;
  remove?: (symbol: string) => void;
}) {
  const { demo } = useProduct(),
    prefix = demo ? "/preview" : "";
  return symbols.length ? (
    <div className="investment-list">
      {symbols.map((symbol) => {
        const q = quotes[symbol];
        return (
          <div className="investment-row" key={symbol}>
            <Link
              className="investment-identity"
              href={`${prefix}/research/${encodeURIComponent(symbol)}`}
            >
              <SecurityLogo symbol={symbol} />
              <span>
                <b>{q?.company?.name || symbol}</b>
                <small>
                  {symbol} · {q?.company?.exchange || "Saved company"}
                </small>
              </span>
            </Link>
            <div className="investment-price">
              <strong>{amount(q?.quote?.price, q?.quote?.currency)}</strong>
              <small
                className={
                  q?.quote?.changePct == null
                    ? "muted"
                    : q.quote.changePct < 0
                      ? "red"
                      : "green"
                }
              >
                {!q?.quote
                  ? q?.error
                    ? "Unavailable"
                    : "Loading…"
                  : q.quote.stale
                    ? "Older quote"
                    : percent(q.quote.changePct, true)}
              </small>
              <small className="quote-stamp" title={q?.error}>
                {q?.quote
                  ? quoteTime(q.quote.asOf)
                  : q?.error || "Requesting latest quote"}
              </small>
            </div>
            {remove ? (
              <button
                className="icon-button"
                aria-label={`Remove ${symbol} from watchlist`}
                onClick={() => remove(symbol)}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <Link
                className="icon-button"
                aria-label={`Research ${symbol}`}
                href={`${prefix}/research/${encodeURIComponent(symbol)}`}
              >
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <Empty title="Your next idea starts here" icon={Bookmark}>
      Search and save companies to follow their research.
    </Empty>
  );
}
export function Watchlist() {
  const { workspace, demo, workspaceError, mutate } = useProduct(),
    quotes = useWorkspaceQuotes("watchlist"),
    [query, setQuery] = useState(""),
    addDialog = useRef<HTMLDialogElement>(null),
    [error, setError] = useState("");
  const symbols = (workspace?.watchlist || [])
    .map((w) => w.symbol)
    .filter((s) =>
      (s + " " + (quotes.data?.[s]?.company?.name || ""))
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  async function remove(symbol: string) {
    try {
      await mutate({ op: "unwatch", symbol });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update watchlist");
    }
  }
  return (
    <section>
      <PageHeading
        title="Watchlist"
        subtitle="Latest prices and a direct route to your research."
        action={
          <button
            className="button primary"
            onClick={() => addDialog.current?.showModal()}
          >
            <Plus size={18} />
            Add company
          </button>
        }
      />
      {(workspaceError || error) && (
        <Notice error>{workspaceError || error}</Notice>
      )}
      {quotes.error && <Notice error>{quotes.error}</Notice>}
      <div className="watchlist-toolbar">
        <label>
          <SearchIcon size={17} />
          <input
            aria-label="Filter watchlist"
            placeholder="Filter your watchlist"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span>{symbols.length} companies</span>
        <button
          className="icon-button"
          aria-label="Refresh watchlist prices"
          disabled={quotes.loading}
          onClick={quotes.refresh}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <InvestmentRows
        symbols={symbols}
        quotes={quotes.data || {}}
        remove={remove}
      />
      <dialog
        className="search-dialog"
        ref={addDialog}
        aria-label="Add a company"
      >
        <div className="dialog-head">
          <h2>Find a company to follow</h2>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => addDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <Search autoFocus onNavigate={() => addDialog.current?.close()} />
      </dialog>
    </section>
  );
}
function Allocation({
  positions,
  quotes,
}: {
  positions: Position[];
  quotes: Record<string, Quote>;
}) {
  const priced = positions
      .map((p) => ({
        symbol: p.symbol,
        value:
          p.assetType === "cash"
            ? p.currency === "USD" && p.symbol === "USD"
              ? p.quantity
              : null
            : quotes[p.symbol]?.price &&
                !quotes[p.symbol].stale &&
                quotes[p.symbol].currency === "USD"
              ? p.quantity * quotes[p.symbol].price!
              : null,
      }))
      .filter((p): p is { symbol: string; value: number } => p.value != null),
    total = priced.reduce((s, p) => s + p.value, 0),
    colors = ["#5c85ff", "#8c72e5", "#25b391", "#edb15c", "#db7ca8", "#61b3ce"];
  const grouped = Object.entries(
    priced.reduce<Record<string, number>>((acc, p) => {
      acc[p.symbol] = (acc[p.symbol] || 0) + p.value;
      return acc;
    }, {}),
  )
    .map(([symbol, value]) => ({ symbol, value }))
    .sort((a, b) => b.value - a.value);
  const value =
    grouped.length > 6
      ? [
          ...grouped.slice(0, 6),
          {
            symbol: "Other",
            value: grouped.slice(6).reduce((n, p) => n + p.value, 0),
          },
        ]
      : grouped;
  return total > 0 ? (
    <div className="allocation">
      <div
        className="allocation-bar"
        role="img"
        aria-label="Allocation across priced positions"
      >
        {value.map((p, i) => (
          <span
            key={`${p.symbol}:${i}`}
            style={{
              width: `${(p.value / total) * 100}%`,
              background: colors[i % colors.length],
            }}
            title={`${p.symbol}: ${percent((p.value / total) * 100)}`}
          />
        ))}
      </div>
      <div className="allocation-labels">
        {value.map((p, i) => (
          <span key={`${p.symbol}:${i}`}>
            <i style={{ background: colors[i % colors.length] }} />
            {p.symbol}
            <b>{percent((p.value / total) * 100)}</b>
          </span>
        ))}
      </div>
      {priced.length < positions.length && (
        <p className="footnote">Allocation covers priced positions only.</p>
      )}
    </div>
  ) : (
    <Empty title="See how your holdings fit together" icon={PieChart}>
      Add your positions to view allocation and concentration.
    </Empty>
  );
}
export function Portfolio() {
  const { workspace, demo, workspaceError, mutate } = useProduct(),
    quotes = useWorkspaceQuotes("portfolio"),
    prefix = demo ? "/preview" : "",
    modal = useRef<HTMLDialogElement>(null),
    currencyModal = useRef<HTMLDialogElement>(null),
    [confirmedUsd, setConfirmedUsd] = useState(false),
    [currency, setCurrency] = useState("USD"),
    [editing, setEditing] = useState<Position | null>(null),
    [symbol, setSymbol] = useState(""),
    [quantity, setQuantity] = useState(""),
    [cost, setCost] = useState(""),
    [cash, setCash] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [removing, setRemoving] = useState<string | null>(null);
  const q = Object.fromEntries(
      Object.entries(quotes.data || {})
        .filter(([, v]) => v.quote)
        .map(([k, v]) => [k, v.quote!]),
    ),
    positions = workspace?.positions || [],
    totals = portfolioTotals(positions, q),
    missingCurrency = positions.filter(
      (p) => !p.currency && p.assetType !== "cash",
    );
  function edit(p: Position | null) {
    setEditing(p);
    setSymbol(p?.symbol || "");
    setQuantity(p ? String(p.quantity) : "");
    setCost(p ? String(p.cost) : "");
    setCash(p?.assetType === "cash");
    setCurrency(p ? p.currency || "" : "USD");
    setError("");
    modal.current?.showModal();
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate({
        op: "position",
        id: editing?.id,
        symbol: cash ? "USD" : symbol,
        quantity: Number(quantity),
        cost: cash ? 1 : Number(cost),
        assetType: cash ? "cash" : "stock",
        currency: cash ? "USD" : currency,
      });
      modal.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Position could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      await mutate({ op: "remove-position", id });
      setRemoving(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Position could not be removed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <PageHeading
        title="Portfolio"
        subtitle="Your holdings, current prices and unrealized returns."
        action={
          <button className="button primary" onClick={() => edit(null)}>
            <Plus size={17} />
            Add position
          </button>
        }
      />
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <Notice error>{quotes.error}</Notice>}
      {missingCurrency.length > 0 && (
        <div className="portfolio-review">
          <div>
            <strong>
              {missingCurrency.length} cost currencies need confirmation
            </strong>
            <p>
              Your recorded average costs are present. Confirm their currency to
              calculate unrealized returns.
            </p>
          </div>
          <button
            className="button"
            onClick={() => {
              setConfirmedUsd(false);
              currencyModal.current?.showModal();
            }}
          >
            Review currencies
          </button>
        </div>
      )}
      <div className="quote-progress" role="status">
        <span>
          {quotes.loading ? "Updating prices…" : "Quote check complete"} ·{" "}
          {
            positions.filter(
              (p) =>
                p.assetType !== "cash" &&
                q[p.symbol]?.price != null &&
                !q[p.symbol].stale,
            ).length
          }
          /{positions.filter((p) => p.assetType !== "cash").length} investments
          priced
        </span>
        <button
          className="text-button"
          disabled={quotes.loading}
          onClick={quotes.refresh}
        >
          <RefreshCw size={14} />
          Refresh prices
        </button>
      </div>
      {error && !modal.current?.open && !currencyModal.current?.open && (
        <Notice error>{error}</Notice>
      )}
      <div className="portfolio-top">
        <section className="panel portfolio-balance">
          <span className="eyebrow">KNOWN MARKET VALUE · USD</span>
          <div className="balance">
            {workspace ? amount(totals.knownValue) : "—"}
          </div>
          <p className="balance-caption">
            {totals.missing.length
              ? `${totals.missing.length} unpriced holdings excluded`
              : "Across priced investments and cash"}
            <Help label="Market value">
              Quantity multiplied by available USD prices, plus recorded USD
              cash. Stale, unpriced and non-USD positions are excluded. This is
              not a performance calculation.
            </Help>
          </p>
          <div className="mini-stats">
            <div>
              <span>Recorded cost</span>
              <strong>{workspace ? amount(totals.cost) : "—"}</strong>
            </div>
            <div>
              <span>Unrealized profit / loss</span>
              <strong
                className={
                  totals.pnl != null && totals.pnl < 0 ? "red" : "green"
                }
              >
                {amount(totals.pnl)}
              </strong>
              <small>
                {totals.pnl != null && totals.cost
                  ? percent((totals.pnl / totals.cost) * 100, true)
                  : "Complete USD pricing and costs required"}
              </small>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Allocation</h2>
          <Allocation positions={positions} quotes={q} />
        </section>
      </div>
      <section className="panel portfolio-holdings support">
        <header className="section-heading">
          <h2>
            Holdings <span className="count">{positions.length}</span>
          </h2>
          <input
            className="filter-input"
            aria-label="Filter holdings"
            placeholder="Filter holdings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </header>
        {positions.length ? (
          <div className="table-scroll">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Investment</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Unrealized</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {positions
                  .filter((p) =>
                    p.symbol.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((p) => {
                    const price =
                        p.assetType === "cash"
                          ? p.currency === "USD" && p.symbol === "USD"
                            ? 1
                            : null
                          : q[p.symbol]?.stale ||
                              q[p.symbol]?.currency !== "USD"
                            ? null
                            : q[p.symbol]?.price,
                      value = price != null ? p.quantity * price : null,
                      pnl =
                        value != null && p.currency === "USD"
                          ? value - p.quantity * p.cost
                          : null;
                    return (
                      <tr key={p.id}>
                        <td>
                          {p.assetType === "cash" ? (
                            <span className="investment-identity">
                              <span className="security-logo">
                                <Wallet size={20} />
                              </span>
                              <b>{p.currency || "Unknown currency"} cash</b>
                            </span>
                          ) : (
                            <Link
                              className="investment-identity"
                              href={`${prefix}/research/${encodeURIComponent(p.symbol)}`}
                            >
                              <SecurityLogo symbol={p.symbol} size={35} />
                              <span>
                                <b>{p.symbol}</b>
                                <small className="holding-quantity">
                                  {p.quantity.toLocaleString(undefined, {
                                    maximumFractionDigits: 6,
                                  })}{" "}
                                  units · Cost{" "}
                                  {p.currency
                                    ? amount(p.cost, p.currency)
                                    : "currency needed"}
                                </small>
                                <small>
                                  {quotes.data?.[p.symbol]?.company?.name ||
                                    "Open company research"}
                                </small>
                              </span>
                            </Link>
                          )}
                        </td>
                        <td data-label="Price">
                          {amount(price)}
                          <small className="muted">
                            {p.assetType === "cash"
                              ? "Cash"
                              : q[p.symbol]
                                ? quoteTime(q[p.symbol].asOf)
                                : quotes.loading
                                  ? "Loading…"
                                  : "Unavailable"}
                          </small>
                        </td>
                        <td data-label="Value">
                          {amount(value)}
                          {value == null && (
                            <small className="quote-error">
                              {quotes.data?.[p.symbol]?.error ||
                                (quotes.loading
                                  ? "Loading price…"
                                  : "Price unavailable")}
                            </small>
                          )}
                        </td>
                        <td
                          data-label="Unrealized"
                          className={
                            pnl == null ? "muted" : pnl < 0 ? "red" : "green"
                          }
                        >
                          {amount(pnl)}
                          <small>
                            {pnl != null && p.cost > 0
                              ? percent(
                                  (pnl / (p.quantity * p.cost)) * 100,
                                  true,
                                )
                              : ""}
                          </small>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={`Edit ${p.symbol}`}
                              onClick={() => edit(p)}
                            >
                              <PenLine size={15} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Remove ${p.symbol}`}
                              onClick={() => setRemoving(p.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          {removing === p.id && (
                            <div className="remove-confirm">
                              <span>Remove this record?</span>
                              <button
                                disabled={busy}
                                onClick={() => remove(p.id)}
                              >
                                Remove
                              </button>
                              <button onClick={() => setRemoving(null)}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Bring your holdings into focus"
            icon={Wallet}
            action={
              <button className="button" onClick={() => edit(null)}>
                Add your first position
              </button>
            }
          >
            Record shares and average costs. AURYN does not place a trade when
            you add a position.
          </Empty>
        )}
      </section>
      <p className="footnote">
        Unrealized returns exclude realized trades, dividends, fees and taxes.
        Total-return charts require a transaction ledger; deposits are not
        presented as investment gains.
      </p>
      <dialog
        ref={currencyModal}
        className="dialog position-dialog"
        aria-labelledby="currency-review-title"
      >
        <button
          className="icon-button close"
          aria-label="Close currency review"
          onClick={() => currencyModal.current?.close()}
        >
          <X size={20} />
        </button>
        <h2 id="currency-review-title">Confirm recorded cost currency</h2>
        <p>
          This sets USD for the {missingCurrency.length} listed records with no
          currency. It does not convert or change your quantities or average
          costs.
        </p>
        <p className="currency-symbols">
          {missingCurrency.map((p) => p.symbol).join(", ")}
        </p>
        <label className="check">
          <input
            type="checkbox"
            checked={confirmedUsd}
            onChange={(e) => setConfirmedUsd(e.target.checked)}
          />
          All these recorded average costs are in USD.
        </label>
        <button
          className="button primary"
          disabled={!confirmedUsd || busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await mutate({
                op: "confirm-cost-currency",
                currency: "USD",
                ids: missingCurrency.map((p) => p.id),
              });
              currencyModal.current?.close();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not save currency.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Confirm USD costs"}
        </button>
        <p className="footnote">
          If any cost is in another currency, close this dialog and edit that
          position individually.
        </p>
        {error && <Notice error>{error}</Notice>}
      </dialog>
      <dialog
        ref={modal}
        className="dialog position-dialog"
        onCancel={() => setError("")}
      >
        <button
          className="icon-button close"
          aria-label="Close position editor"
          onClick={() => modal.current?.close()}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">YOUR HOLDINGS</span>
        <h2>{editing ? "Edit position" : "Add a position"}</h2>
        <p>Update your records. No trade will be placed.</p>
        <form onSubmit={submit}>
          <label className="check">
            <input
              type="checkbox"
              checked={cash}
              onChange={(e) => setCash(e.target.checked)}
            />
            Record USD cash
          </label>
          {!cash && (
            <label>
              Ticker or crypto pair
              <input
                required
                value={symbol}
                placeholder="MSFT or BTC/USD"
                maxLength={20}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </label>
          )}
          <div className="two-col">
            <label>
              {cash ? "Cash balance" : "Shares / units"}
              <input
                required
                type="number"
                min="0.00000001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            {!cash && (
              <label>
                Average cost
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </label>
            )}
          </div>
          {!cash && (
            <label>
              Cost currency
              <select
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="" disabled>
                  Choose currency
                </option>
                {[
                  ...new Set([
                    "USD",
                    "EUR",
                    "CAD",
                    "GBP",
                    ...(/^[A-Z]{3}$/.test(currency) ? [currency] : []),
                  ]),
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          {error && <Notice error>{error}</Notice>}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save position"}
          </button>
        </form>
      </dialog>
    </section>
  );
}
