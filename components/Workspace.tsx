"use client";

import PortfolioExposure from "./PortfolioExposure";
import {
  pricedInvestmentReturns,
} from "@/lib/product-attention";
import PortfolioRiskSummary, {
  usePortfolioCalendar,
} from "./PortfolioRiskSummary";
import PortfolioLedger from "./PortfolioLedger";
import PortfolioCharts from "./PortfolioCharts";
import SectorBenchmarks from "./SectorBenchmarks";
import AccountBalances from "./AccountBalances";
import useLivePrices from "./useLivePrices";
import { quoteHealth } from "@/lib/quote-health";
import { mergePriceTick } from "@/lib/live-price";

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
import HomeBriefing from "./HomeBriefing";
import { api } from "@/lib/client";
import { workspaceSymbolBatches } from "@/lib/workspace";
import {
  mergePortfolioQuotes,
  quoteCoverage,
  refreshIntervals,
  usablePortfolioQuote,
  type RefreshMode,
} from "@/lib/portfolio-quotes";

type Quotes = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export function useWorkspaceQuotes(
  scope: "all" | "watchlist" | "portfolio" = "all",
) {
  const { workspace, demo, cache, marketProvider, owner } = useProduct(),
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
  const liveFresh = useRef(new Set<string>());
  const [dataOwner, setDataOwner] = useState(owner);
  const latestData = useRef(data);
  latestData.current = dataOwner === owner ? data : {};
  const [mode, setMode] = useState<RefreshMode>("balanced");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  useEffect(() => {
    if (scope !== "portfolio" || demo || !owner) return;
    try {
      const saved = localStorage.getItem("auryn-refresh-v1:" + owner);
      if (saved && saved in refreshIntervals) setMode(saved as RefreshMode);
    } catch {}
  }, [owner, scope, demo]);
  const changeMode = (value: RefreshMode) => {
    setMode(value);
    try {
      if (owner) localStorage.setItem("auryn-refresh-v1:" + owner, value);
    } catch {}
  };
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
    let persisted: Quotes = {};
    if (owner && !demo) {
      try {
        const saved = JSON.parse(
          localStorage.getItem("auryn-portfolio-quotes-v1:" + owner) || "null",
        );
        if (
          saved?.version === 1 &&
          saved.rows &&
          typeof saved.rows === "object"
        ) {
          persisted = saved.rows;
          setCheckedAt(
            typeof saved.checkedAt === "string" ? saved.checkedAt : null,
          );
        }
      } catch {}
    }
    const baseline = mergePortfolioQuotes(
      mergePortfolioQuotes(persisted, cached, selected.flat()),
      latestData.current,
      selected.flat(),
    );
    setDataOwner(owner);
    setData(baseline);
    setReady(
      Object.values(baseline).some((r) => r.quote?.price != null) ||
        !selected.length,
    );
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
      let next: Quotes = { ...baseline };
      let requested = 0;
      for (const group of selected) {
        if (!active) break;
        const missing = group.filter(
          (s) =>
            !liveFresh.current.has(s) &&
            (!cache.get("quote:" + s) ||
              Date.now() - cache.get("quote:" + s)!.at > 60000),
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
          next = mergePortfolioQuotes(next, result, selected.flat());
          for (const [symbol, row] of Object.entries(result)) {
            if (usablePortfolioQuote(row.quote))
              cache.set("quote:" + symbol, {
                at: Date.now(),
                value: next[symbol],
              });
            if (row.error)
              setError(
                "Some prices could not be updated. Available older prices remain included.",
              );
          }
          requested += weight;
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : "Quotes unavailable");
          }
          requested += weight;
        }
      }
      if (active) {
        next = mergePortfolioQuotes(next, latestData.current, selected.flat());
        setData(next);
        const checked = new Date().toISOString();
        setCheckedAt(checked);
        if (owner && !demo) {
          try {
            const storageKey = "auryn-portfolio-quotes-v1:" + owner;
            const stored = JSON.parse(
              localStorage.getItem(storageKey) || "null",
            );
            const rows = mergePortfolioQuotes(
              stored?.version === 1 ? (stored.rows ?? {}) : {},
              next,
              [
                ...new Set([
                  ...Object.keys(
                    stored?.version === 1 ? (stored.rows ?? {}) : {},
                  ),
                  ...Object.keys(next),
                ]),
              ],
            );
            localStorage.setItem(
              storageKey,
              JSON.stringify({ version: 1, checkedAt: checked, rows }),
            );
          } catch {}
        }
        cache.set("workspace-quotes:" + key, { at: Date.now(), value: true });
        setReady(true);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, demo, cache, revision, rateLimited, scope, owner]);
  useEffect(() => {
    if (demo) return;
    const tick = () => {
      if (document.visibilityState === "visible" && !loading) refresh();
    };
    const interval = scope === "portfolio" ? refreshIntervals[mode] : 120000;
    if (!interval) return;
    let last = Date.now();
    const due = () => {
      if (
        Date.now() - last >= interval &&
        document.visibilityState === "visible" &&
        !loading
      ) {
        last = Date.now();
        tick();
      }
    };
    const timer = setInterval(due, Math.min(interval, 60000));
    document.addEventListener("visibilitychange", due);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", due);
    };
  }, [demo, loading, refresh, scope, mode]);
  const live = useLivePrices(
    groups.flat(),
    !!demo || (scope === "portfolio" && mode !== "live"),
  );
  liveFresh.current = new Set(
    live.connected
      ? Object.values(live.ticks)
          .filter((t) => Date.now() - Date.parse(t.asOf) < 30000)
          .map((t) => t.symbol)
      : [],
  );
  const pricedData = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(dataOwner === owner ? data : {}).map(([symbol, row]) => [
          symbol,
          {
            ...row,
            quote: quoteHealth(
              live.ticks[symbol]
                ? mergePriceTick(row.quote, {
                    ...live.ticks[symbol],
                    session: live.connected
                      ? live.ticks[symbol].session
                      : "Last streamed trade · reconnecting",
                  })
                : !live.connected && /^Live/.test(row.quote?.session || "")
                  ? {
                      ...row.quote!,
                      session: "Last streamed trade · reconnecting",
                    }
                  : row.quote,
            ),
          },
        ]),
      ),
    [data, live, dataOwner, owner],
  );
  useEffect(() => {
    let advanced = false;
    for (const [symbol, row] of Object.entries(pricedData)) {
      if (
        usablePortfolioQuote(row.quote) &&
        (!usablePortfolioQuote(data[symbol]?.quote) ||
          Date.parse(row.quote!.asOf || "") >
            Date.parse(data[symbol]?.quote?.asOf || ""))
      )
        advanced = true;
      if (!row.quote || row.quote.stale) continue;
      const old = cache.get("quote:" + symbol)?.value as
        | Quotes[string]
        | undefined;
      if (
        !old?.quote ||
        Date.parse(row.quote.asOf || "") > Date.parse(old.quote.asOf || "")
      )
        cache.set("quote:" + symbol, { at: Date.now(), value: row });
    }
    // Commit streamed observations too: expiry/reconnect must not restore an older REST snapshot.
    if (advanced && dataOwner === owner)
      setData((prior) =>
        mergePortfolioQuotes(prior, pricedData, Object.keys(pricedData)),
      );
  }, [pricedData, cache, data, dataOwner, owner]);
  return {
    data: pricedData,
    loading,
    ready,
    error,
    refresh,
    mode,
    changeMode,
    checkedAt,
  };
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
  return <HomeBriefing quotes={quotes.data || {}} error={quotes.error}/>;
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
    positions = workspace?.positions || [],
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
        <PortfolioCharts positions={positions} quotes={q} />
      </div>
      <PortfolioRiskSummary
        positions={positions}
        quotes={q}
        calendar={calendar}
      />
      <SectorBenchmarks />
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
      <details className="portfolio-extra">
        <summary>Sector exposure & stress check</summary>
        <PortfolioExposure positions={positions} quotes={quotes.data || {}} />
      </details>
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
