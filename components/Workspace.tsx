"use client";

import { pricedInvestmentReturns } from "@/lib/product-attention";
import { FeatureGate } from "./Access";
import AccountBalances from "./AccountBalances";
import PortfolioCharts from "./PortfolioCharts";
import PortfolioExposure from "./PortfolioExposure";
import PortfolioLedger from "./PortfolioLedger";
import PortfolioRiskSummary, {
  usePortfolioCalendar,
} from "./PortfolioRiskSummary";
import SectorBenchmarks from "./SectorBenchmarks";

import { portfolioTotals } from "@/lib/engine";
import { amount, percent, quoteTime } from "@/lib/format";
import { quoteCoverage, type RefreshMode } from "@/lib/portfolio-quotes";
import type { Position, Quote } from "@/lib/types";
import {
  ArrowUpRight,
  Bookmark,
  PieChart,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import HomeBriefing from "./HomeBriefing";
import Search from "./Search";
import { useProduct, useWorkspaceFilter } from "./Session";
import { Empty, Help, Notice, PageHeading, SecurityLogo } from "./Ui";

import { useWorkspaceQuotes, type Quotes } from "./useWorkspaceQuotes";
export { useWorkspaceQuotes } from "./useWorkspaceQuotes";
export function ResearchHome() {
  const { workspace, demo, workspaceError } = useProduct(),
    quotes = useWorkspaceQuotes(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
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
                href={`${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`}
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
                    ? `${q.quote.stale ? "Older quote · " : ""}${quoteTime(q.quote.asOf)}`
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
  const quotes = useWorkspaceQuotes();
  return (
    <FeatureGate
      feature="home"
      fallback={
        <section className="membership-panel">
          <span className="eyebrow">Your AURYN</span>
          <h1>A clear place to begin.</h1>
          <p>Search a company, save your favorites and review your holdings.</p>
          <Link className="button primary" href="/research">
            Find a company
          </Link>
          <Link className="button" href="/portfolio">
            View holdings
          </Link>
        </section>
      }
    >
      <HomeBriefing quotes={quotes.data || {}} error={quotes.error} />
    </FeatureGate>
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
  const { demo } = useProduct();
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return symbols.length ? (
    <div className="watchlist-table-wrap investment-list">
      <table className="watchlist-table">
        <caption className="sr-only">
          Your followed companies, latest available prices and observation
          times.
        </caption>
        <thead>
          <tr>
            <th>Company</th>
            <th>Price</th>
            <th>Today</th>
            <th>Price observed</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((symbol) => {
            const row = quotes[symbol],
              quote = row?.quote;
            const href = `${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`;
            return (
              <tr key={symbol}>
                <td className="watch-company">
                  <Link className="investment-identity" href={href}>
                    <SecurityLogo symbol={symbol} />
                    <span>
                      <b>{symbol}</b>
                      <small className="investment-company">
                        {row?.company?.name ||
                          (symbol.includes("/")
                            ? "Crypto pair"
                            : "Saved company")}
                      </small>
                    </span>
                  </Link>
                </td>
                <td className="watch-price">
                  <strong>{amount(quote?.price, quote?.currency)}</strong>
                  <small>{quote?.currency || ""}</small>
                </td>
                <td
                  className={`watch-change ${quote?.changePct == null ? "muted" : quote.changePct < 0 ? "negative" : "positive"}`}
                >
                  {percent(quote?.changePct, true)}
                </td>
                <td className="watch-date">
                  {quote ? (
                    <>
                      <time dateTime={quote.asOf ?? undefined}>
                        {quoteTime(quote.asOf, true)}
                      </time>
                      <small>
                        {quote.stale
                          ? "Older usable observation"
                          : quote.session || "Latest available observation"}
                      </small>
                    </>
                  ) : (
                    <small>
                      {row?.error
                        ? "Price update needs another check"
                        : "Checking the latest observation"}
                    </small>
                  )}
                </td>
                <td className="watch-actions">
                  <Link
                    className="icon-button"
                    aria-label={`Research ${symbol}`}
                    href={href}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                  {remove && (
                    <button
                      className="icon-button watch-remove"
                      aria-label={`Remove ${symbol} from watchlist`}
                      onClick={() => remove(symbol)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
    [query, setQuery] = useWorkspaceFilter("watchlist"),
    [watchType, setWatchType] = useState<"All" | "Stocks" | "Crypto">("All"),
    addDialog = useRef<HTMLDialogElement>(null),
    [error, setError] = useState("");
  const symbols = (workspace?.watchlist || [])
    .map((w) => w.symbol)
    .filter(
      (s) =>
        watchType === "All" ||
        (watchType === "Crypto" ? s.includes("/") : !s.includes("/")),
    )
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
    <section className="watchlist-page">
      <PageHeading
        title="Watchlist"
        subtitle="Follow the companies you want to understand. Open any name for the full picture."
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
      <div className="watchlist-intro-strip">
        <div>
          <Bookmark size={18} />
          <span>
            <strong>{workspace?.watchlist.length ?? 0} followed</strong>
            <small>Your personal research universe</small>
          </span>
        </div>
        <p>
          Price is one part of the case. Open research to review business
          strength, valuation and AURYN Pace together.
        </p>
      </div>
      <div className="watchlist-toolbar">
        <div className="segments" aria-label="Watchlist asset type">
          {(["All", "Stocks", "Crypto"] as const).map((t) => (
            <button
              key={t}
              aria-pressed={watchType === t}
              className={watchType === t ? "active" : ""}
              onClick={() => setWatchType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label>
          <SearchIcon size={17} />
          <input
            aria-label="Filter watchlist"
            placeholder="Filter your watchlist"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="watchlist-status" role="status">
          {symbols.length} investments ·{" "}
          {quotes.loading
            ? "Updating"
            : quotes.error
              ? "Prices delayed"
              : "Checked"}
          {quotes.error && (
            <Help label="Watchlist price update">{quotes.error}</Help>
          )}
        </span>
        <button
          className="icon-button"
          aria-label="Refresh watchlist prices"
          disabled={quotes.loading}
          onClick={quotes.refresh}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {query.trim() && !symbols.length ? (
        <Empty
          title="No companies match your filter"
          action={
            <button className="button" onClick={() => setQuery("")}>
              Clear filter
            </button>
          }
        >
          Try another company name or ticker.
        </Empty>
      ) : (
        <InvestmentRows
          symbols={symbols}
          quotes={quotes.data || {}}
          remove={remove}
        />
      )}
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
        <p className="search-guidance">
          Open its research, then choose Save to watchlist.
        </p>
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
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "",
    modal = useRef<HTMLDialogElement>(null),
    [currency, setCurrency] = useState("USD"),
    [editing, setEditing] = useState<Position | null>(null),
    [symbol, setSymbol] = useState(""),
    [quantity, setQuantity] = useState(""),
    [cost, setCost] = useState(""),
    [cash, setCash] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useWorkspaceFilter("portfolio"),
    [removing, setRemoving] = useState<string | null>(null),
    [portfolioTab, setPortfolioTab] = useState<
      "holdings" | "allocation" | "risk"
    >("holdings");
  const calendar = usePortfolioCalendar(workspace?.positions ?? []);
  const portfolioDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const reportsSoon = useMemo(
    () =>
      new Set(
        (calendar.data?.events ?? [])
          .filter(
            (e) =>
              /earnings/i.test(e.kind) &&
              e.date >= portfolioDay &&
              Date.parse(e.date) <= Date.parse(portfolioDay) + 7 * 86400000,
          )
          .map((e) => e.symbol),
      ),
    [calendar.data, portfolioDay],
  );
  const q = useMemo(
      () =>
        Object.fromEntries(
          Object.entries(quotes.data || {})
            .filter(([, v]) => v.quote)
            .map(([k, v]) => [k, v.quote!]),
        ),
      [quotes.data],
    ),
    positions = useMemo(
      () => workspace?.positions || [],
      [workspace?.positions],
    ),
    totals = useMemo(() => portfolioTotals(positions, q), [positions, q]),
    returns = useMemo(
      () => pricedInvestmentReturns(positions, q),
      [positions, q],
    ),
    visiblePositions = useMemo(
      () =>
        positions.filter((p) =>
          `${p.symbol} ${quotes.data?.[p.symbol]?.company?.name || ""} ${p.assetType === "cash" ? "cash" : ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        ),
      [positions, query, quotes.data],
    ),
    missingCurrency = positions.filter(
      (p) => !p.currency && p.assetType !== "cash",
    );
  function edit(p: Position | null) {
    setRemoving(null);
    setEditing(p);
    setSymbol(p?.symbol || "");
    setQuantity(p ? String(p.quantity) : "");
    setCost(p ? String(p.cost) : "");
    setCash(p?.assetType === "cash");
    setCurrency(p ? p.currency || "" : "USD");
    setError("");
    modal.current?.showModal();
    modal.current
      ?.querySelector<HTMLHeadingElement>("h2")
      ?.focus({ preventScroll: true });
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
      modal.current?.close();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Position could not be removed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="portfolio-page">
      <PageHeading
        title="Portfolio"
        subtitle="See what you own, where you are exposed and what deserves a closer look."
        action={
          <button className="button primary" onClick={() => edit(null)}>
            <Plus size={17} />
            Add position
          </button>
        }
      />

      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {missingCurrency.length > 0 && (
        <div className="portfolio-review">
          <div>
            <strong>
              {missingCurrency.length} older positions are missing a
              cost-currency label
            </strong>
            <p>
              Your costs are saved. Mark them as USD to include their unrealized
              returns.
            </p>
          </div>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await mutate({
                  op: "confirm-cost-currency",
                  currency: "USD",
                  ids: missingCurrency.map((p) => p.id),
                });
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Could not save USD cost labels.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Set costs to USD"}
          </button>
        </div>
      )}
      <div className="quote-progress portfolio-refresh">
        <span role="status">
          {quotes.loading
            ? "Updating quietly…"
            : quotes.error
              ? "Some updates unavailable"
              : "Valuation ready"}{" "}
          ·{" "}
          {
            quoteCoverage(
              positions
                .filter((p) => p.assetType !== "cash")
                .map((p) => p.symbol),
              quotes.data || {},
            ).current
          }{" "}
          current ·{" "}
          {
            quoteCoverage(
              positions
                .filter((p) => p.assetType !== "cash")
                .map((p) => p.symbol),
              quotes.data || {},
            ).older
          }{" "}
          older ·{" "}
          {
            quoteCoverage(
              positions
                .filter((p) => p.assetType !== "cash")
                .map((p) => p.symbol),
              quotes.data || {},
            ).unpriced
          }{" "}
          unpriced
          {quotes.checkedAt && (
            <small>Last check {quoteTime(quotes.checkedAt, true)}</small>
          )}
        </span>
        <div className="portfolio-refresh-controls">
          <label>
            Updates
            <select
              aria-label="Portfolio price updates"
              value={quotes.mode}
              onChange={(e) => quotes.changeMode(e.target.value as RefreshMode)}
            >
              <option value="balanced">Every 5 minutes</option>
              <option value="live">Live</option>
              <option value="hourly">Hourly</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <button
            className="text-button"
            disabled={quotes.loading}
            onClick={quotes.refresh}
          >
            <RefreshCw size={14} />
            {quotes.loading ? "Updating" : "Refresh"}
          </button>
        </div>
      </div>
      {error && !modal.current?.open && <Notice error>{error}</Notice>}
      <div className="portfolio-summary-layout">
        <section className="panel portfolio-balance">
          <AccountBalances
            assets={totals.knownValue}
            ready={!!workspace && quotes.ready}
            missing={totals.missing.length}
          />
          <div className="money-sub">
            <span
              className={
                returns.pnl != null && returns.pnl < 0 ? "red" : "green"
              }
            >
              {quotes.ready ? amount(returns.pnl) : "—"}{" "}
              {returns.returnPct != null
                ? percent(returns.returnPct, true)
                : ""}
            </span>
            <span className="muted">
              {" "}
              unrealized · {returns.covered}/{returns.total} investments with
              price & USD cost
            </span>
          </div>
          {totals.missing.length > 0 && (
            <p className="balance-caption">
              {totals.missing.length} unpriced holdings excluded · displayed
              return covers only the priced subset
            </p>
          )}
        </section>
      </div>
      <nav className="portfolio-view-tabs" aria-label="Portfolio views">
        {(
          [
            ["holdings", "Holdings"],
            ["allocation", "Allocation"],
            ["risk", "Risk & events"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={portfolioTab === id}
            aria-controls={`portfolio-${id}-view`}
            onClick={() => setPortfolioTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div id="portfolio-holdings-view" hidden={portfolioTab !== "holdings"}>
        <section className="panel portfolio-holdings support">
          <header className="section-heading">
            <h2>
              Holdings <span className="count">{positions.length}</span>
            </h2>
            <input
              className="filter-input"
              aria-label="Filter holdings"
              placeholder="Find a holding"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </header>
          {positions.length && !visiblePositions.length ? (
            <Empty
              title="No holdings match your filter"
              action={
                <button className="button" onClick={() => setQuery("")}>
                  Clear filter
                </button>
              }
            >
              Try another company name or ticker.
            </Empty>
          ) : positions.length ? (
            <PortfolioLedger
              positions={visiblePositions}
              allPositions={positions}
              quotes={q}
              companies={Object.fromEntries(
                Object.entries(quotes.data || {}).map(([symbol, row]) => [
                  symbol,
                  row.company,
                ]),
              )}
              total={totals.knownValue}
              earnings={reportsSoon}
              prefix={prefix}
              onEdit={edit}
            />
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
      </div>
      <section
        id="portfolio-allocation-view"
        hidden={portfolioTab !== "allocation"}
        aria-label="Allocation and contributions"
      >
        {portfolioTab === "allocation" && (
          <FeatureGate feature="portfolio" fallback={null}>
            <PortfolioCharts positions={positions} quotes={q} />
            <SectorBenchmarks />
          </FeatureGate>
        )}
      </section>
      <section
        id="portfolio-risk-view"
        hidden={portfolioTab !== "risk"}
        aria-label="Risk and upcoming events"
      >
        {portfolioTab === "risk" && (
          <FeatureGate feature="portfolio" fallback={null}>
            <PortfolioRiskSummary
              positions={positions}
              quotes={q}
              calendar={calendar}
            />
            <PortfolioExposure
              positions={positions}
              quotes={quotes.data || {}}
            />
          </FeatureGate>
        )}
      </section>
      <p className="footnote">
        Unrealized returns exclude realized trades, dividends, fees and taxes.
        Total-return charts require a transaction ledger; deposits are not
        presented as investment gains.
      </p>
      <dialog
        ref={modal}
        className="dialog portfolio-editor"
        aria-labelledby="position-dialog-title"
        onClose={() => setError("")}
      >
        <button
          className="icon-button close"
          aria-label="Close position editor"
          onClick={() => modal.current?.close()}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">YOUR HOLDINGS</span>
        <h2 id="position-dialog-title" tabIndex={-1}>
          {editing ? "Edit position" : "Add a position"}
        </h2>
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
          <div className="editor-numbers">
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
        {editing &&
          (removing === editing.id ? (
            <div className="remove-confirm">
              <span>Remove this holding?</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(editing.id)}
              >
                Remove holding
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="text-button negative"
              type="button"
              disabled={busy}
              onClick={() => setRemoving(editing.id)}
            >
              Remove holding
            </button>
          ))}
      </dialog>
    </section>
  );
}
