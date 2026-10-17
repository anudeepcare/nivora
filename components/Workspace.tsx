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
import { amount, dateLabel, percent } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { Empty, PageHeading, SecurityLogo, Notice, Help } from "./Ui";
import Search from "./Search";
import { api } from "@/lib/client";
import { workspaceSymbolBatches } from "@/lib/workspace";
import PortfolioTools from "./PortfolioTools";
type Quotes = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export function useWorkspaceQuotes() {
  const { workspace, demo, cache } = useProduct(),
    groups = workspaceSymbolBatches(
      workspace?.positions ?? [],
      workspace?.watchlist ?? [],
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
    const pause = () =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 31000);
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
      let sent = 0;
      for (const group of selected) {
        if (!active) break;
        const missing = group.filter(
          (s) =>
            revision > 0 ||
            !cache.get("quote:" + s) ||
            Date.now() - cache.get("quote:" + s)!.at > 60000,
        );
        if (!missing.length) continue;
        if (sent) await pause();
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
          setData((old) => ({ ...old, ...result }));
          sent++;
        } catch (e) {
          if (active)
            setError(e instanceof Error ? e.message : "Quotes unavailable");
          sent++;
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
                    className={(q?.quote?.changePct ?? 0) < 0 ? "red" : "green"}
                  >
                    {percent(q?.quote?.changePct, true)}
                  </span>
                </footer>
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
      <div className="overview-stats">
        <div>
          <span>Known portfolio value</span>
          <strong>{workspace ? amount(totals.knownValue) : "—"}</strong>
          <small>
            {totals.missing.length
              ? `${totals.missing.length} unpriced holdings excluded`
              : `${holdings.length} investment positions`}
          </small>
        </div>
        <div>
          <span>Unrealized return</span>
          <strong
            className={totals.pnl != null && totals.pnl < 0 ? "red" : "green"}
          >
            {amount(totals.pnl)}
          </strong>
          <small>Requires a verified USD cost basis</small>
        </div>
        <div>
          <span>Following</span>
          <strong>
            {workspace?.watchlist.length ?? "—"}
            <small>companies</small>
          </strong>
          <Link href={`${prefix}/watchlist`}>Open watchlist →</Link>
        </div>
      </div>
      <div className="overview-columns">
        <section>
          <header className="section-heading">
            <h2>On your radar</h2>
            <Link className="text-button" href={`${prefix}/watchlist`}>
              View all <ArrowUpRight size={15} />
            </Link>
          </header>
          <InvestmentRows
            symbols={
              workspace?.watchlist.slice(0, 6).map((w) => w.symbol) || []
            }
            quotes={quotes.data || {}}
          />
        </section>
        <section className="panel overview-focus">
          <span className="eyebrow">RESEARCH THAT COMPOUNDS</span>
          <h2>Follow the business behind the price.</h2>
          <p>
            Review reported financial trends, valuation assumptions and monthly
            accumulation in one company workspace.
          </p>
          <Search />
          <div className="focus-links">
            <Link href={`${prefix}/compare`}>
              Compare companies <ArrowUpRight size={15} />
            </Link>
            <Link href={`${prefix}/portfolio`}>
              Review your allocation <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </div>
      <header className="section-heading support">
        <h2>Portfolio concentration</h2>
        <Link className="text-button" href={`${prefix}/portfolio`}>
          Review holdings <ArrowUpRight size={15} />
        </Link>
      </header>
      <Allocation positions={workspace?.positions || []} quotes={q} />
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
                className={(q?.quote?.changePct ?? 0) < 0 ? "red" : "green"}
              >
                {q?.quote?.stale
                  ? "Older quote"
                  : percent(q?.quote?.changePct, true)}
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
    quotes = useWorkspaceQuotes(),
    [query, setQuery] = useState(""),
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
        title="Keep good ideas close."
        subtitle="Your watchlist, connected to company research."
        action={
          <button
            className="button"
            onClick={quotes.refresh}
            disabled={quotes.loading}
          >
            <RefreshCw size={16} />
            {quotes.loading ? "Refreshing…" : "Refresh prices"}
          </button>
        }
      />
      {(workspaceError || error) && (
        <Notice error>{workspaceError || error}</Notice>
      )}
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
      </div>
      <InvestmentRows
        symbols={symbols}
        quotes={quotes.data || {}}
        remove={remove}
      />
      <div className="support">
        <h3>Find another company</h3>
        <div className="research-search">
          <Search />
        </div>
      </div>
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
  const value = positions
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
    total = value.reduce((s, p) => s + p.value, 0),
    colors = ["#5c85ff", "#8c72e5", "#25b391", "#edb15c", "#db7ca8", "#61b3ce"];
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
      {value.length < positions.length && (
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
    quotes = useWorkspaceQuotes(),
    prefix = demo ? "/preview" : "",
    modal = useRef<HTMLDialogElement>(null),
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
    totals = portfolioTotals(positions, q);
  function edit(p: Position | null) {
    setEditing(p);
    setSymbol(p?.symbol || "");
    setQuantity(p ? String(p.quantity) : "");
    setCost(p ? String(p.cost) : "");
    setCash(p?.assetType === "cash");
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
        title="Your portfolio, in perspective."
        subtitle="Holdings, recorded cost and concentration in one place."
        action={
          <button className="button primary" onClick={() => edit(null)}>
            <Plus size={17} />
            Add position
          </button>
        }
      />
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {error && !modal.current?.open && <Notice error>{error}</Notice>}
      <div className="overview-stats">
        <div>
          <span>
            Known market value{" "}
            <Help label="Market value">
              Quantity multiplied by available price, plus recorded cash.
              Unpriced, stale or non-USD holdings are excluded from known value.
              This is not a performance calculation.
            </Help>
          </span>
          <strong>{workspace ? amount(totals.knownValue) : "—"}</strong>
          <small>
            {totals.missing.length
              ? `${totals.missing.join(", ")} excluded`
              : "Across priced positions and cash"}
          </small>
        </div>
        <div>
          <span>Recorded cost</span>
          <strong>{workspace ? amount(totals.cost) : "—"}</strong>
          <small>Quantity × your average cost</small>
        </div>
        <div>
          <span>Unrealized profit / loss</span>
          <strong
            className={totals.pnl != null && totals.pnl < 0 ? "red" : "green"}
          >
            {amount(totals.pnl)}
          </strong>
          <small>
            {totals.pnl != null && totals.cost
              ? percent((totals.pnl / totals.cost) * 100, true)
              : "Complete pricing required"}
          </small>
        </div>
      </div>
      <section className="portfolio-holdings">
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
                  <th>Quantity</th>
                  <th>Avg. cost</th>
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
                                <small>
                                  {quotes.data?.[p.symbol]?.company?.name ||
                                    "Open company research"}
                                </small>
                              </span>
                            </Link>
                          )}
                        </td>
                        <td>
                          {p.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}
                        </td>
                        <td>{amount(p.cost, p.currency ?? "")}</td>
                        <td>{amount(value)}</td>
                        <td
                          className={pnl != null && pnl < 0 ? "red" : "green"}
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
      <header className="section-heading support">
        <h2>Allocation</h2>
      </header>
      <Allocation positions={positions} quotes={q} />
      <PortfolioTools quotes={q} />
      <p className="footnote">
        Unrealized returns exclude realized trades, dividends, fees and taxes.
        Total-return charts require a transaction ledger; deposits are not
        presented as investment gains.
      </p>
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
                Average cost · USD
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
          {error && <Notice error>{error}</Notice>}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save position"}
          </button>
        </form>
      </dialog>
    </section>
  );
}
