"use client";
import DecisionAttention from "./DecisionAttention";
import { customerText } from "@/lib/customer-language";
import portfolioStyles from "./PortfolioWorkspace.module.css";
import { useHomeFeed } from "./useHomeFeed";
import { PaceBadge } from "./WorkspacePace";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import workspaceVisuals from "./WorkspaceVisuals.module.css";

import { researchLink } from "@/lib/approved-workspace";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { earningsEventState, marketDay } from "@/lib/home-feed";
import {
  ArrowUpRight,
  Bookmark,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import CompanySparkline from "./CompanySparkline";
import PaceHelp from "./PaceHelp";
import Search from "./Search";
import { useProduct, useResource, useWorkspaceFilter } from "./Session";
import { Empty, Notice, SecurityLogo } from "./Ui";

import { Heading, SectionHead, useWorkspaceData } from "./WorkspaceShared";
export function Watchlist() {
  const accountPrefs = useWorkspacePreferences();
  const { demo: watchDemo, cache: watchCache } = useProduct();
  const noteDates = useResource<{
    documents: {
      key: string;
      body: { reviewDate?: string; condition?: string; thesis?: string };
    }[];
  }>("documents?kind=note", watchDemo ? { documents: [] } : undefined);
  const reviewDates = new Map(
    noteDates.data?.documents.map((x) => [x.key, x.body.reviewDate ?? ""]) ??
      [],
  );
  const state = useWorkspaceData("watchlist"),
    { workspace, prefix, quotes, mutate, pace } = state;
  const [query, setQuery] = useWorkspaceFilter("watchlist"),
    [type, updateType] = useState(() =>
      String(watchCache?.get("view:watchlist:type")?.value ?? "All"),
    ),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState<string | null>(null),
    [removed, setRemoved] = useState<string | null>(null);
  const setType = (value: string) => {
    updateType(value);
    watchCache.set("view:watchlist:type", { at: Date.now(), value });
  };
  const dialog = useRef<HTMLDialogElement>(null),
    all = workspace?.watchlist.map((w) => w.symbol) ?? [];
  const calendar = useHomeFeed(all);
  const today = marketDay();
  const nextDates = new Map<string, string>();
  for (const event of calendar.data?.events ?? [])
    if (
      /earn/i.test(event.kind) &&
      event.date >= today &&
      earningsEventState(event, today).status !== "reported" &&
      (!nextDates.has(event.symbol) ||
        event.date < nextDates.get(event.symbol)!)
    )
      nextDates.set(event.symbol, event.date);
  const symbols = all
    .filter(
      (s) =>
        (type === "All" ||
          (type === "Crypto" ? s.includes("/") : !s.includes("/"))) &&
        `${s} ${quotes.data[s]?.company?.name || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      accountPrefs.preferences.watchSort === "change"
        ? (quotes.data[b]?.quote?.changePct ?? -Infinity) -
            (quotes.data[a]?.quote?.changePct ?? -Infinity) ||
          a.localeCompare(b)
        : accountPrefs.preferences.watchSort === "event"
          ? (nextDates.get(a) || "9999").localeCompare(
              nextDates.get(b) || "9999",
            ) || a.localeCompare(b)
          : accountPrefs.preferences.watchSort === "review"
            ? (reviewDates.get(a) || "9999").localeCompare(
                reviewDates.get(b) || "9999",
              ) || a.localeCompare(b)
            : a.localeCompare(b),
    );
  async function remove(symbol: string) {
    setRemoving(symbol);
    setError("");
    try {
      await mutate({ op: "unwatch", symbol });
      setRemoved(symbol);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update watchlist.");
    } finally {
      setRemoving(null);
    }
  }
  return (
    <section
      className={`approved-workspace approved-watchlist ${workspaceVisuals.workspaceVisuals}`}
    >
      <Heading
        title="Ideas worth following."
        subtitle="Your saved companies, prices and upcoming events."
        actions={
          <button
            className="btn primary"
            onClick={() => dialog.current?.showModal()}
          >
            <Plus size={16} />
            Add a company
          </button>
        }
      />
      {(state.workspaceError || error) && (
        <Notice error>{state.workspaceError || error}</Notice>
      )}
      {removed && (
        <div className="notice" role="status">
          {removed} removed from your watchlist.
          <button
            type="button"
            className="text-link"
            disabled={!!removing}
            onClick={async () => {
              const symbol = removed;
              setRemoving(symbol);
              try {
                await mutate({ op: "watch", symbol });
                setRemoved(null);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Unable to restore company.",
                );
              } finally {
                setRemoving(null);
              }
            }}
          >
            Undo removal
          </button>
        </div>
      )}
      <div className="watch-summary">
        <div>
          <span className="eyebrow">FOLLOWING</span>
          <strong>{all.length}</strong>
          <span className="watch-count-label">followed</span>
          <p>Companies in your watchlist</p>
        </div>
        <Link className="btn" href={`${prefix}/alerts`}>
          Create a price alert <ArrowUpRight size={16} />
        </Link>
      </div>
      <DecisionAttention
        symbols={symbols}
        held={(workspace?.positions ?? [])
          .filter((p) => p.assetType !== "cash" && p.quantity > 0)
          .map((p) => p.symbol)}
        rows={state.paceScan.rows}
        allocations={state.model.allocations}
        concentrationLimit={accountPrefs.preferences.concentrationLimit}
        prefix={prefix}
        loading={state.paceScan.loading}
      />
      <section className="card">
        <SectionHead
          title="Your watchlist"
          subtitle="Prices and confirmed accumulation readings."
          action={
            <button
              className="icon-button"
              disabled={quotes.loading}
              onClick={quotes.refresh}
              aria-label="Refresh watchlist prices"
            >
              <RefreshCw size={17} />
            </button>
          }
        />
        {all.length > 0 && (
          <div className="approved-table-toolbar">
            <div className="segment" aria-label="Watchlist asset type">
              {["All", "Stocks", "Crypto"].map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label>
              <SearchIcon size={16} />
              <input
                aria-label="Filter watchlist"
                placeholder="Find a company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        )}
        {quotes.error && (
          <p className="approved-data-note" role="status">
            {quotes.error} Available observations remain visible.
          </p>
        )}
        {symbols.length ? (
          <div className={`table-scroll ${portfolioStyles.watchLedger}`}>
            <table className="holdings-table approved-watch-table">
              <caption className="sr-only">
                Saved companies, observed prices, loaded price history and
                confirmed monthly Pace.
              </caption>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Price</th>
                  <th>Trend</th>
                  <th>
                    AURYN Pace <PaceHelp />
                  </th>
                  <th>
                    <span className="sr-only">Remove company</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((symbol) => {
                  const row = quotes.data[symbol],
                    signal = pace(symbol);
                  return (
                    <tr key={symbol}>
                      <td>
                        <Link
                          className="company-row"
                          href={researchLink(symbol, prefix)}
                        >
                          <SecurityLogo symbol={symbol} />
                          <span>
                            <b>{symbol}</b>
                            <small>
                              {row?.company?.name || "Open research"}
                            </small>
                          </span>
                        </Link>
                        <small>
                          {nextDates.has(symbol)
                            ? `Earnings · ${dateLabel(nextDates.get(symbol))}`
                            : calendar.loading
                              ? "Checking earnings…"
                              : calendar.error
                                ? "Earnings unavailable"
                                : "Next earnings unconfirmed"}
                        </small>
                        {noteDates.data?.documents.find((n) => n.key === symbol)
                          ?.body.condition && (
                          <small className="watch-checkpoint">
                            {
                              noteDates.data.documents.find(
                                (n) => n.key === symbol,
                              )?.body.condition
                            }
                          </small>
                        )}
                      </td>
                      <td>
                        <strong>
                          {amount(row?.quote?.price, row?.quote?.currency)}
                        </strong>
                        <small
                          className={
                            row?.quote?.changePct == null
                              ? "muted"
                              : row.quote.changePct < 0
                                ? "negative"
                                : "green"
                          }
                        >
                          {percent(row?.quote?.changePct, true)}
                        </small>
                        <small title={customerText(row?.quote?.source)}>
                          {row?.quote?.asOf
                            ? `${row.quote.stale ? "Older · " : ""}${quoteTime(row.quote.asOf, true)}`
                            : quotes.loading
                              ? "Checking price…"
                              : "Price unavailable"}
                        </small>
                      </td>
                      <td>
                        <CompanySparkline symbol={symbol} />
                      </td>
                      <td>
                        <Link
                          className={portfolioStyles.paceStatus}
                          href={researchLink(symbol, prefix)}
                          title={signal?.reason}
                        >
                          <PaceBadge signal={signal} />
                        </Link>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          disabled={!!removing}
                          aria-label={`Remove ${symbol} from watchlist`}
                          onClick={() => remove(symbol)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              all.length
                ? "No companies match your filter"
                : "Your next idea starts here"
            }
            icon={Bookmark}
            action={
              <button
                className="btn"
                onClick={() => {
                  if (all.length) {
                    setQuery("");
                    setType("All");
                  } else dialog.current?.showModal();
                }}
              >
                {all.length ? "Clear filters" : "Find a company"}
              </button>
            }
          >
            {all.length
              ? "Try another name or asset type."
              : "Find a company, open its research and save it to keep your next decision close."}
          </Empty>
        )}
      </section>
      <SearchDialog dialog={dialog} />
    </section>
  );
}
function SearchDialog({
  dialog,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
}) {
  return (
    <dialog
      className="search-dialog approved-workspace-dialog"
      ref={dialog}
      aria-labelledby="approved-search-title"
    >
      <div className="dialog-head">
        <h2 id="approved-search-title">Find a company to follow</h2>
        <button
          className="icon-button"
          aria-label="Close search"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
      </div>
      <p>Open its research, then choose Save to watchlist.</p>
      <Search autoFocus onNavigate={() => dialog.current?.close()} />
    </dialog>
  );
}
