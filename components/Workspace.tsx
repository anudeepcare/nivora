"use client";

import SessionBrief from "./SessionBrief";

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
  MoreHorizontal,
  PieChart,
} from "lucide-react";
import type { Company, Position, Quote } from "@/lib/types";
import { portfolioTotals } from "@/lib/engine";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { useProduct, useResource, useWorkspaceFilter } from "./Session";
import {
  Empty,
  PageHeading,
  SecurityLogo,
  Notice,
  Help,
  DataStamp,
} from "./Ui";
import Search from "./Search";
import HomeUpdates from "./HomeUpdates";
import { api } from "@/lib/client";
import { workspaceSymbolBatches } from "@/lib/workspace";

type Quotes = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export function useWorkspaceQuotes(
  scope: "all" | "watchlist" | "portfolio" = "all",
) {
  const { workspace, demo, cache, marketProvider } = useProduct(),
    groups = workspaceSymbolBatches(
      scope === "watchlist" ? [] : (workspace?.positions ?? []),
      scope === "portfolio" ? [] : (workspace?.watchlist ?? []),
      10,
    ),
    key = JSON.stringify(groups),
    [revision, setRevision] = useState(0),
    [data, setData] = useState<Quotes>(() =>
      Object.fromEntries(
        groups.flat().flatMap((s) => {
          const row = cache.get("quote:" + s);
          return row ? [[s, row.value as Quotes[string]]] : [];
        }),
      ),
    ),
    [loading, setLoading] = useState(!demo && groups.length > 0),
    [ready, setReady] = useState(
      !!demo || cache.has("workspace-quotes:" + key) || !groups.length,
    ),
    [error, setError] = useState("");
  const refresh = useCallback(() => setRevision((x) => x + 1), []);
  // Discovering a hybrid/Twelve connection must not abort and restart a quote
  // batch that already began while provider metadata was loading.
  const rateLimited = marketProvider !== "eodhd";
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
      setReady(true);
      setLoading(false);
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
    setReady(cache.has("workspace-quotes:" + key) || !selected.length);
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
      const next: Quotes = { ...cached };
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
        if (rateLimited && requested + weight > 40) {
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
          for (const [symbol, row] of Object.entries(result))
            next[symbol] = row.quote
              ? row
              : {
                  ...next[symbol],
                  ...row,
                  ...(next[symbol]?.quote
                    ? { quote: { ...next[symbol].quote!, stale: true } }
                    : {}),
                };
          requested += weight;
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : "Quotes unavailable");
            for (const symbol of missing) {
              if (next[symbol]?.quote) {
                next[symbol] = {
                  ...next[symbol],
                  quote: { ...next[symbol].quote!, stale: true },
                };
                cache.set("quote:" + symbol, { at: 0, value: next[symbol] });
              }
            }
          }
          requested += weight;
        }
      }
      if (active) {
        setData(next);
        cache.set("workspace-quotes:" + key, { at: Date.now(), value: true });
        setReady(true);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, demo, cache, revision, rateLimited]);
  return { data, loading, ready, error, refresh };
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
                    ? dateLabel(q.quote.asOf)
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
  const { workspace, demo, workspaceError } = useProduct();
  const quotes = useWorkspaceQuotes();
  const prefix = demo ? "/preview" : "";
  const q = Object.fromEntries(
    Object.entries(quotes.data || {})
      .filter(([, v]) => v.quote)
      .map(([k, v]) => [k, v.quote!]),
  );
  const totals = portfolioTotals(workspace?.positions || [], q);
  const holdings = (workspace?.positions || []).filter(
    (p) => p.assetType !== "cash",
  );
  const priced = holdings.filter(
    (p) =>
      p.currency === "USD" &&
      q[p.symbol]?.currency === "USD" &&
      !q[p.symbol]?.stale &&
      q[p.symbol]?.price != null,
  );
  const largest = [...priced].sort(
    (a, b) => b.quantity * q[b.symbol].price! - a.quantity * q[a.symbol].price!,
  )[0];
  const worst = [...priced]
    .filter((p) => p.cost > 0)
    .sort(
      (a, b) => q[a.symbol].price! / a.cost - q[b.symbol].price! / b.cost,
    )[0];
  const focus = [
    ...(largest && totals.knownValue > 0
      ? [
          {
            symbol: largest.symbol,
            title: `${largest.symbol} is ${(((largest.quantity * q[largest.symbol].price!) / totals.knownValue) * 100).toFixed(1)}% of priced value`,
            detail: "Review concentration alongside your business conviction.",
          },
        ]
      : []),
    ...(worst
      ? [
          {
            symbol: worst.symbol,
            title: `${worst.symbol} has the largest percentage drawdown`,
            detail: `${percent((q[worst.symbol].price! / worst.cost - 1) * 100, true)} versus recorded cost. A loss alone is not a buy signal.`,
          },
        ]
      : []),
  ];
  return (
    <section className="home-workspace">
      <PageHeading
        title="Your investing day."
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "America/Chicago",
        })}
        action={
          <Link className="button primary" href={`${prefix}/research`}>
            <SearchIcon size={18} />
            Find a company
          </Link>
        }
      />
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <Notice error>{quotes.error}</Notice>}
      <SessionBrief />
      <HomeUpdates />
      <div className="grid2 home-details">
        <section>
          <header className="section-head">
            <div>
              <h2>Worth a closer look</h2>
              <p>Based on your positions, not a forecast.</p>
            </div>
          </header>
          {focus.length ? (
            focus.map((f) => (
              <Link
                className="focus-row"
                href={`${prefix}/research/${encodeURIComponent(f.symbol.replace("/", "-"))}`}
                key={f.symbol + f.title}
              >
                <SecurityLogo symbol={f.symbol} />
                <div className="focus-text">
                  <strong>{f.title}</strong>
                  <p>{f.detail}</p>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            ))
          ) : (
            <Empty title="Start with your holdings">
              Add positions to see concentration and cost context here.
            </Empty>
          )}
        </section>
        <section>
          <header className="section-head">
            <div>
              <h2>
                {workspace?.watchlist.length
                  ? "On your radar"
                  : "Your holdings"}
              </h2>
              <p>
                {workspace?.watchlist.length
                  ? "Your saved instruments."
                  : "Continue researching companies you own."}
              </p>
            </div>
            <Link className="text-button small" href={`${prefix}/watchlist`}>
              View all →
            </Link>
          </header>
          <InvestmentRows
            symbols={
              workspace?.watchlist.length
                ? workspace.watchlist.slice(0, 4).map((w) => w.symbol)
                : [
                    ...new Set(
                      workspace?.positions
                        .filter((p) => p.assetType !== "cash")
                        .map((p) => p.symbol) ?? [],
                    ),
                  ].slice(0, 4)
            }
            quotes={quotes.data || {}}
          />
        </section>
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
              href={`${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`}
            >
              <SecurityLogo symbol={symbol} />
              <span>
                <b>{symbol}</b>
                <small className="investment-company" title={q?.company?.name}>
                  {q?.company?.name ||
                    (symbol.includes("/") ? "Crypto pair" : "Saved investment")}
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
              <span className="investment-asof">
                {q?.quote ? (
                  <DataStamp source={q.quote.source} asOf={q.quote.asOf} />
                ) : (
                  <small className="quote-stamp" title={q?.error}>
                    {q?.error ? "Quote unavailable" : "Checking quote"}
                  </small>
                )}
              </span>
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
                href={`${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`}
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
        subtitle="Keep your next decisions within reach."
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
    prefix = demo ? "/preview" : "",
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
    [removing, setRemoving] = useState<string | null>(null);
  const q = Object.fromEntries(
      Object.entries(quotes.data || {})
        .filter(([, v]) => v.quote)
        .map(([k, v]) => [k, v.quote!]),
    ),
    positions = workspace?.positions || [],
    totals = portfolioTotals(positions, q),
    visiblePositions = positions.filter((p) =>
      `${p.symbol} ${quotes.data?.[p.symbol]?.company?.name || ""} ${p.assetType === "cash" ? "cash" : ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
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
        subtitle="Your holdings, current prices and unrealized returns."
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
      <div className="quote-progress" role="status">
        <span>
          {quotes.loading
            ? "Updating prices…"
            : quotes.error
              ? "Prices delayed"
              : "Quote check complete"}{" "}
          ·{" "}
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
          {quotes.error && (
            <Help label="Portfolio price update">{quotes.error}</Help>
          )}
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
      {error && !modal.current?.open && <Notice error>{error}</Notice>}
      <div className="portfolio-top">
        <section className="panel portfolio-balance">
          <span className="eyebrow">Priced assets & cash · USD</span>
          <div className="balance">
            {workspace && quotes.ready ? amount(totals.knownValue) : "—"}
          </div>
          <div className="money-sub">
            <span
              className={totals.pnl != null && totals.pnl < 0 ? "red" : "green"}
            >
              {quotes.ready ? amount(totals.pnl) : "—"}{" "}
              {totals.pnl != null && totals.cost
                ? percent((totals.pnl / totals.cost) * 100, true)
                : ""}
            </span>
            <span className="muted"> unrealised</span>
          </div>
          {totals.missing.length > 0 && (
            <p className="balance-caption">
              {totals.missing.length} unpriced holdings excluded · return
              requires complete pricing
            </p>
          )}
        </section>
        <section className="panel portfolio-allocation">
          <Allocation positions={positions} quotes={q} />
        </section>
      </div>
      <section className="portfolio-review-strip" aria-label="Portfolio exposure review">
        <div><span>Pricing coverage</span><strong>{quotes.ready ? `${positions.length - positions.filter(p=>totals.missing.includes(p.symbol)).length} / ${positions.length}` : '—'}</strong><small>Recorded positions with usable prices</small></div>
        <div><span>Available cash</span><strong>{workspace ? amount(positions.filter(p=>p.assetType==='cash'&&p.symbol==='USD'&&p.currency==='USD'&&Number.isFinite(p.quantity)&&p.quantity>0&&Number.isFinite(p.cost)&&p.cost>=0).reduce((sum,p)=>sum+p.quantity,0)) : '—'}</strong><small>Recorded USD cash, not broker buying power</small></div>
        <div><span>Largest investment</span><strong>{quotes.ready ? (()=>{const values=new Map<string,number>();for(const p of positions){if(p.assetType==='cash'||totals.missing.includes(p.symbol))continue;values.set(p.symbol,(values.get(p.symbol)||0)+p.quantity*q[p.symbol].price!);}const largest=[...values].sort((a,b)=>b[1]-a[1])[0];return largest&&totals.knownValue>0?`${largest[0]} · ${percent(largest[1]/totals.knownValue*100)}`:'—';})() : '—'}</strong><small>Share of priced assets and cash</small></div>
      </section>
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
          <div className="table-scroll">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Quantity</th>
                  <th>Avg. cost</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Return</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visiblePositions.map((p) => {
                  const price =
                      p.assetType === "cash"
                        ? p.currency === "USD" && p.symbol === "USD"
                          ? 1
                          : null
                        : q[p.symbol]?.stale || q[p.symbol]?.currency !== "USD"
                          ? null
                          : q[p.symbol]?.price,
                    value = price != null ? p.quantity * price : null,
                    pnl =
                      value != null && p.currency === "USD"
                        ? value - p.quantity * p.cost
                        : null;
                  return (
                    <tr key={p.id}>
                      <td className="holding-identity-cell">
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
                            href={`${prefix}/research/${encodeURIComponent(p.symbol.replace("/", "-"))}`}
                          >
                            <SecurityLogo symbol={p.symbol} size={35} />
                            <span>
                              <b>{p.symbol}</b>
                              <small className="investment-company">
                                {quotes.data?.[p.symbol]?.company?.name ||
                                  "Open company research"}
                              </small>
                              <small className="holding-quantity">
                                {p.quantity.toLocaleString(undefined, {
                                  maximumFractionDigits: 6,
                                })}{" "}
                                {p.assetType === "crypto" ? "units" : "shares"}
                              </small>
                            </span>
                          </Link>
                        )}
                      </td>
                      <td className="holding-quantity-cell">
                        {p.quantity.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                      <td className="holding-cost-cell">
                        {p.currency ? amount(p.cost, p.currency) : "—"}
                      </td>
                      <td data-label="Price" className="holding-price-cell">
                        <span className="holding-metric">{amount(price)}</span>
                      </td>
                      <td data-label="Value" className="holding-value-cell">
                        <span className="holding-metric">
                          {amount(value)}
                          {value == null && (
                            <small className="quote-error">
                              {quotes.data?.[p.symbol]?.error ||
                                (quotes.loading
                                  ? "Loading price…"
                                  : "Price unavailable")}
                            </small>
                          )}
                        </span>
                      </td>
                      <td
                        data-label="Unrealized"
                        className={
                          "holding-pnl-cell " +
                          (pnl == null ? "muted" : pnl < 0 ? "red" : "green")
                        }
                      >
                        <span className="holding-metric">
                          <small>
                            {pnl != null && p.cost > 0
                              ? percent(
                                  (pnl / (p.quantity * p.cost)) * 100,
                                  true,
                                )
                              : ""}
                          </small>
                        </span>
                      </td>
                      <td className="holding-actions-cell">
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={`Edit ${p.symbol}`}
                            onClick={() => edit(p)}
                          >
                            <MoreHorizontal size={19} />
                          </button>
                        </div>
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
        ref={modal}
        className="dialog position-dialog"
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
        <h2 id="position-dialog-title">
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
