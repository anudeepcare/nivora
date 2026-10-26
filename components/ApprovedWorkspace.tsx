"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { Position, Research } from "@/lib/types";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import type { AccountBalances as Balances } from "@/lib/account-balances";
import type { HomeFeed } from "@/lib/home-feed";
import { relevantHoldingHeadlines } from "@/lib/home-feed";
import { homeBrief } from "@/lib/home-brief";
import { researchAccumulation } from "@/lib/accumulation-policy-v5";
import { amount, percent, quoteTime, dateLabel } from "@/lib/format";
import { ledgerRows } from "@/lib/portfolio-ledger";
import { researchLink, workspaceOverview } from "@/lib/approved-workspace";
import { useProduct, useResource, useWorkspaceFilter } from "./Session";
import { useWorkspaceQuotes } from "./Workspace";
import { FeatureGate } from "./Access";
import { Empty, Notice, SecurityLogo } from "./Ui";
import Search from "./Search";
import CompanySparkline from "./CompanySparkline";
import AccountBalances from "./AccountBalances";
import HoldingsImport from "./HoldingsImport";
import PortfolioLedger from "./PortfolioLedger";
import PortfolioCharts from "./PortfolioCharts";
import PortfolioExposure from "./PortfolioExposure";
import PortfolioRiskSummary, {
  usePortfolioCalendar,
} from "./PortfolioRiskSummary";
import SectorBenchmarks from "./SectorBenchmarks";
import ApprovedPortfolioChart from "./ApprovedPortfolioChart";
import { PositionEditor, WatchlistNote } from "./ApprovedWorkspaceForms";

const colors = [
  "#315ff4",
  "#7792eb",
  "#329b8e",
  "#a18bd1",
  "#c69a42",
  "#78939e",
];
const previewBalances = { balances: null };
const emptyFeed: HomeFeed = {
  events: [],
  news: [],
  issues: [],
  retrievedAt: "",
  followed: 0,
  newsFollowed: 0,
};

function Heading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  tone = "",
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
  tone?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function useWorkspaceData(scope: "all" | "portfolio" | "watchlist" = "all") {
  const product = useProduct(),
    quotes = useWorkspaceQuotes(scope);
  const balances = useResource<{ balances: Balances | null }>(
    scope === "watchlist" ? null : "account-balances",
    product.demo ? previewBalances : undefined,
  );
  const prefix =
    product.demo && product.demo.routePrefix !== "" ? "/preview" : "";
  const research = (symbol: string) =>
    product.demo?.research[symbol] ??
    (product.cache.get(
      `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
    )?.value as Research | undefined) ??
    (product.cache.get(`research:${symbol}`)?.value as Research | undefined);
  const sectors: Record<string, string> = {};
  for (const p of product.workspace?.positions ?? []) {
    const r = research(p.symbol),
      sector = r?.evidence?.profile?.sector || r?.company.sector;
    if (sector) sectors[p.symbol] = sector;
  }
  const model = workspaceOverview(
    product.workspace?.positions ?? [],
    quotes.data,
    balances.data?.balances,
    sectors,
  );
  const q = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(quotes.data).flatMap(([symbol, row]) =>
          row.quote ? [[symbol, row.quote]] : [],
        ),
      ),
    [quotes.data],
  );
  const pace = (symbol: string) => {
    const r = research(symbol);
    if (!r) return null;
    return researchAccumulation(
      r.history,
      product.demo ? r.retrievedAt : new Date().toISOString(),
      r.company.assetType === "crypto" ? "crypto" : "us-equity",
    ).confirmed;
  };
  return { ...product, quotes, balances, prefix, model, q, pace };
}
function WealthStrip({
  state,
  portfolio = false,
}: {
  state: ReturnType<typeof useWorkspaceData>;
  portfolio?: boolean;
}) {
  const { model, balances, workspace, quotes, prefix } = state;
  const ready = !!workspace && quotes.ready;
  const partial = model.unpriced.length > 0;
  const exactBalance = !!balances.data?.balances;
  return (
    <>
      <section
        className={`wealth-strip${portfolio ? " four" : ""}`}
        aria-label="Portfolio summary"
      >
        <Metric
          label={
            exactBalance
              ? partial || balances.data?.balances?.managed_value == null
                ? "Known net portfolio value"
                : "Net portfolio value"
              : "Priced assets & cash"
          }
          value={ready ? amount(model.net) : "—"}
          note={
            partial
              ? `${model.unpriced.length} unpriced instruments excluded`
              : exactBalance
                ? balances.data?.balances?.managed_value == null
                  ? "Managed balance not entered"
                  : "Investments + cash + managed − margin"
                : "Recorded USD holdings and cash"
          }
        />
        <Metric
          label="Unrealized return"
          value={ready ? amount(model.pnl) : "—"}
          tone={
            model.pnl == null ? "muted" : model.pnl < 0 ? "negative" : "green"
          }
          note={
            model.returnPct != null
              ? `${percent(model.returnPct, true)} · ${model.returnCovered}/${model.investmentCount} cost-covered holdings`
              : "Needs available price and recorded USD cost"
          }
        />
        {portfolio ? (
          <>
            <Metric
              label="Cash & managed"
              value={ready ? amount(model.cashAndManaged) : "—"}
              note={
                balances.data?.balances?.managed_value == null
                  ? "Recorded cash · managed not entered"
                  : "Recorded balances"
              }
            />
            <Metric
              label="Margin used"
              value={amount(model.margin)}
              note={
                exactBalance
                  ? "Subtracted from net value"
                  : "Balance not entered"
              }
            />
          </>
        ) : (
          <>
            <Metric
              label="Companies you follow"
              value={workspace?.watchlist.length ?? "—"}
              note="Ideas in your watchlist"
            />
            <Link href={`${prefix}/portfolio`} className="text-link">
              View portfolio <ArrowUpRight size={17} />
            </Link>
          </>
        )}
      </section>
      {balances.error && (
        <p className="approved-data-note" role="status">
          Account balances could not be checked. The total includes available
          listed assets and cash only.
        </p>
      )}
    </>
  );
}
function Coverage({ state }: { state: ReturnType<typeof useWorkspaceData> }) {
  const { model, quotes } = state;
  if (!model.unpriced.length && !model.older && !quotes.error) return null;
  return (
    <p className="approved-data-note" role="status">
      {model.unpriced.length
        ? `Not included in USD totals: ${model.unpriced.join(", ")}. `
        : ""}
      {model.older
        ? `${model.older} older usable quote${model.older === 1 ? " remains" : "s remain"} included. `
        : ""}
      {quotes.error || "Observation dates appear with each holding."}{" "}
      <button
        className="text-link"
        onClick={quotes.refresh}
        disabled={quotes.loading}
      >
        Retry prices
      </button>
    </p>
  );
}

export function Overview() {
  return (
    <FeatureGate
      feature="home"
      fallback={
        <section className="approved-workspace">
          <Heading
            title="A clear place to begin."
            subtitle="Search a company, save your favorites and review your holdings."
          />
          <div className="inline-actions">
            <Link className="btn primary" href="/research">
              Find a company
            </Link>
            <Link className="btn" href="/portfolio">
              View holdings
            </Link>
          </div>
        </section>
      }
    >
      <HomeOverview />
    </FeatureGate>
  );
}
function HomeOverview() {
  const state = useWorkspaceData(),
    { workspace, quotes, model, prefix, demo, displayName, pace } = state;
  const today = new Date(
    demo
      ? Object.values(demo.research)[0]?.retrievedAt || Date.now()
      : Date.now(),
  );
  const day = today.toISOString().slice(0, 10);
  const symbols = [
    ...new Set([
      ...model.allocations.map((a) => a.symbol),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) ?? []),
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
    ]),
  ];
  const feedSymbols = symbols.filter((s) => !s.includes("/")).slice(0, 10),
    key = feedSymbols.join(",");
  const feed = useResource<HomeFeed>(
    key ? `home-feed?symbols=${encodeURIComponent(key)}` : null,
    demo ? emptyFeed : undefined,
    3600000,
  );
  const exposure = new Map(model.allocations.map((a) => [a.symbol, a.value]));
  const names = Object.fromEntries(
    Object.entries(quotes.data).flatMap(([s, r]) =>
      r.company?.name ? [[s, r.company.name]] : [],
    ),
  );
  const headlines = relevantHoldingHeadlines(
    feed.data?.news ?? [],
    names,
    exposure,
  ).filter(
    (n) =>
      /^https?:\/\//.test(n.url) &&
      Date.parse(n.date) <= today.getTime() + 60000 &&
      Date.parse(n.date) >= today.getTime() - 7 * 86400000,
  );
  const brief = homeBrief({
    today: day,
    symbols,
    names,
    events: feed.data?.events ?? [],
    headlines,
    exposure,
    eventsReady: !!feed.data && !feed.error && !feed.data.issues.length,
    newsReady: !!feed.data && !feed.error && !feed.data.issues.length,
  });
  const largest = model.allocations[0];
  const signals = symbols
    .map((symbol) => ({ symbol, signal: pace(symbol) }))
    .filter((x) => x.signal != null)
    .sort((a, b) => b.signal!.multiplier - a.signal!.multiplier);
  const best = signals[0],
    checkpoint = brief.checkpoints[0];
  const hour = today.getHours(),
    greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  const briefHref =
    brief.kind === "review"
      ? `${prefix}/${workspace?.positions.length ? "portfolio" : "watchlist"}`
      : brief.symbol
        ? researchLink(brief.symbol, prefix)
        : `${prefix}/research`;
  return (
    <section className="approved-workspace approved-home">
      <Heading
        title={`${greeting}${displayName ? `, ${displayName}` : ""}.`}
        subtitle="A little perspective on what matters to your money today."
        actions={
          <span className="date-chip">
            {today.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            <small>
              {demo ? "Illustrative workspace" : "Your account perspective"}
            </small>
          </span>
        }
      />
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <WealthStrip state={state} />
      <Coverage state={state} />
      <section className="home-brief">
        <div className="brief-symbol" aria-hidden="true">
          A<span>✦</span>
        </div>
        <div>
          <span className="eyebrow">{brief.kicker}</span>
          <h2>{brief.title}</h2>
          <p>{brief.detail}</p>
          <small>
            {!symbols.length
              ? "Built around the companies and holdings you save."
              : feed.loading
                ? "Checking dated company evidence…"
                : `${brief.status}${feed.data?.retrievedAt ? ` Checked ${quoteTime(feed.data.retrievedAt)}.` : ""}`}
          </small>
        </div>
        <Link className="btn" href={briefHref}>
          {brief.action} <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="three-grid">
        <Link
          className="card insight"
          href={
            largest
              ? researchLink(largest.symbol, prefix)
              : `${prefix}/portfolio`
          }
        >
          <span className="eyebrow">
            {largest
              ? "REVISIT YOUR LARGEST POSITION"
              : "BRING YOUR HOLDINGS INTO FOCUS"}
          </span>
          <div className="insight-number">
            {largest ? largest.weight.toFixed(1) : "—"}
            <small>{largest ? "%" : ""}</small>
          </div>
          <h3>
            {largest
              ? `${largest.symbol} shapes your exposure.`
              : "Know what you own."}
          </h3>
          <p>
            {largest
              ? `${names[largest.symbol] || largest.symbol} accounts for ${percent(largest.weight)} of priced invested value. Review the business beside its share of your portfolio.`
              : "Record shares and average costs to see where your money sits."}
          </p>
          <span className="text-link">
            {largest ? "Understand the exposure" : "Open your portfolio"} ↗
          </span>
        </Link>
        <Link
          className="card insight mint"
          href={best ? researchLink(best.symbol, prefix) : `${prefix}/research`}
        >
          <span className="eyebrow">ACCUMULATION, MADE CLEAR</span>
          {best ? (
            <div className="insight-number">
              {best.signal!.multiplier}
              <small>×</small>
            </div>
          ) : (
            <div className="insight-icon">
              <Bookmark size={42} />
            </div>
          )}
          <h3>
            {best
              ? `${best.symbol} · a confirmed Pace reading.`
              : "Connect the price with the business."}
          </h3>
          <p>
            {best
              ? `${best.signal!.month} · ${best.signal!.multiplier}× the usual scheduled contribution under the price policy. Review business and funding risks alongside the signal.`
              : "Open a company’s research for its evidence, valuation and available monthly Pace. A price signal needs enough settled history."}
          </p>
          <span className="text-link">
            {best ? "Read the full case" : "Build your perspective"} ↗
          </span>
        </Link>
        <Link
          className="card insight lavender"
          href={
            checkpoint
              ? researchLink(checkpoint.symbol, prefix)
              : `${prefix}/alerts`
          }
        >
          <span className="eyebrow">THE NEXT CHECKPOINT</span>
          <div className="insight-icon">
            <CalendarDays size={42} />
          </div>
          <h3>
            {checkpoint
              ? `${checkpoint.symbol}: ${checkpoint.kind}.`
              : "Decide what would change your mind."}
          </h3>
          <p>
            {checkpoint
              ? `${dateLabel(checkpoint.date)} · ${checkpoint.detail || "Review growth, margins and cash together before the next reported update."}`
              : "Set a price checkpoint or write down the business evidence you want to see next."}
          </p>
          <span className="text-link">
            {checkpoint ? "Prepare your research" : "Set your checkpoint"} ↗
          </span>
        </Link>
      </div>
      <div className="two-grid home-bottom">
        <section className="card">
          <SectionHead
            title="Your companies"
            subtitle="Keep the next decision close."
            action={
              <Link className="text-link" href={`${prefix}/watchlist`}>
                View all ↗
              </Link>
            }
          />
          {symbols.length ? (
            symbols
              .slice(0, 5)
              .map((symbol) => (
                <HomeCompany
                  key={symbol}
                  symbol={symbol}
                  row={quotes.data[symbol]}
                  prefix={prefix}
                />
              ))
          ) : (
            <Empty
              title="Your first company is a search away"
              action={
                <Link className="btn" href={`${prefix}/research`}>
                  Find a company
                </Link>
              }
            >
              Save a company to keep it here.
            </Empty>
          )}
        </section>
        <section className="card">
          <SectionHead
            title="What changed"
            subtitle="Dated company updates, ready to put in context."
          />
          <div className="story-list approved-story-list">
            {headlines.slice(0, 3).map((news, i) => (
              <article key={`${news.symbol}:${news.url}`}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <a href={news.url} target="_blank" rel="noopener noreferrer">
                    <strong>{news.title}</strong>
                  </a>
                  <p>
                    {news.symbol} · {dateLabel(news.date)} · Source article
                  </p>
                  <Link
                    className="text-link"
                    href={researchLink(news.symbol, prefix)}
                  >
                    Open investment case ↗
                  </Link>
                </div>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read source: ${news.title}`}
                >
                  <ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
          {!headlines.length && (
            <div className="approved-editorial-empty">
              <FileText size={27} />
              <h3>
                {feed.loading
                  ? "Checking your company updates…"
                  : feed.error
                    ? "Company updates are temporarily unavailable."
                    : "Your next update belongs here."}
              </h3>
              <p>
                {symbols.length
                  ? "No recent, matched headline is available for the companies checked. Your research and holdings remain available."
                  : "Follow a company to see dated headlines alongside its investment case."}
              </p>
              <Link className="text-link" href={`${prefix}/research`}>
                Explore your research ↗
              </Link>
            </div>
          )}
          {symbols.length > feedSymbols.length && (
            <p className="chart-note">
              News checks up to 10 selected stocks. Open company research for
              each company’s full feed.
            </p>
          )}
          {feed.error && (
            <button className="text-link" onClick={feed.refresh}>
              Retry updates
            </button>
          )}
        </section>
      </div>
    </section>
  );
}
function HomeCompany({
  symbol,
  row,
  prefix,
}: {
  symbol: string;
  row?: QuoteRows[string];
  prefix: string;
}) {
  return (
    <Link className="home-company" href={researchLink(symbol, prefix)}>
      <SecurityLogo symbol={symbol} />
      <span>
        <strong>{row?.company?.name || symbol}</strong>
        <small>{symbol}</small>
      </span>
      <CompanySparkline symbol={symbol} />
      <span className="row-quote">
        <strong>{amount(row?.quote?.price, row?.quote?.currency)}</strong>
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
      </span>
    </Link>
  );
}

export function Portfolio() {
  const state = useWorkspaceData("portfolio"),
    { workspace, quotes, model, q, prefix } = state;
  const positions = workspace?.positions ?? [];
  const [query, setQuery] = useWorkspaceFilter("portfolio"),
    [editing, setEditing] = useState<Position | "new" | null>(null),
    [cashDefault, setCashDefault] = useState(false),
    [depthOpen, setDepthOpen] = useState(false),
    [currencySaving, setCurrencySaving] = useState(false),
    [currencyError, setCurrencyError] = useState("");
  const balances = useRef<HTMLDialogElement>(null),
    depth = useRef<HTMLDialogElement>(null);
  const calendar = usePortfolioCalendar(positions);
  const today = new Date().toISOString().slice(0, 10);
  const earnings = new Set(
    (calendar.data?.events ?? [])
      .filter(
        (e) =>
          /earnings/i.test(e.kind) &&
          e.date >= today &&
          Date.parse(e.date) <= Date.parse(today) + 7 * 86400000,
      )
      .map((e) => e.symbol),
  );
  const visible = positions.filter((p) =>
    `${p.symbol} ${quotes.data[p.symbol]?.company?.name || ""} ${p.assetType === "cash" ? "cash" : ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const companies = Object.fromEntries(
    Object.entries(quotes.data).map(([symbol, row]) => [symbol, row.company]),
  );
  const unlabeledCosts = positions.filter(
    (p) => p.assetType !== "cash" && !p.currency,
  );
  async function confirmUsdCosts() {
    setCurrencySaving(true);
    setCurrencyError("");
    try {
      await state.mutate({
        op: "confirm-cost-currency",
        currency: "USD",
        ids: unlabeledCosts.map((p) => p.id),
      });
    } catch (e) {
      setCurrencyError(
        e instanceof Error ? e.message : "Could not save cost labels.",
      );
    } finally {
      setCurrencySaving(false);
    }
  }
  return (
    <section className="approved-workspace approved-portfolio">
      <Heading
        title="Your portfolio."
        subtitle="Know what you own—and where the risk sits."
        actions={
          <>
            <button
              className="btn"
              onClick={() => balances.current?.showModal()}
            >
              Cash & balances
            </button>
            <button
              className="btn primary"
              onClick={() => {
                setCashDefault(false);
                setEditing("new");
              }}
            >
              <Plus size={16} />
              Add position
            </button>
          </>
        }
      />
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <WealthStrip state={state} portfolio />
      <Coverage state={state} />
      <div className="portfolio-grid">
        <div>
          <section className="card">
            <SectionHead
              title="Value over time"
              subtitle="Current holdings at historical prices · up to 60 shared sessions"
            />
            <ApprovedPortfolioChart
              positions={positions}
              quotes={quotes.data}
            />
          </section>
          <section className="card">
            <SectionHead
              title="Your investments"
              subtitle="All holdings, with the context that matters."
              action={
                <button
                  className="icon-button"
                  disabled={quotes.loading}
                  onClick={quotes.refresh}
                  aria-label="Refresh portfolio prices"
                >
                  <RefreshCw size={17} />
                </button>
              }
            />
            {positions.length > 0 && (
              <div className="approved-table-toolbar">
                <label>
                  <SearchIcon size={16} />
                  <input
                    aria-label="Filter holdings"
                    placeholder="Find a holding"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  Refresh
                  <select
                    aria-label="Portfolio price refresh"
                    value={quotes.mode}
                    onChange={(e) =>
                      quotes.changeMode(e.target.value as typeof quotes.mode)
                    }
                  >
                    <option value="balanced">Every 5 min</option>
                    <option value="live">Every 2 min</option>
                    <option value="hourly">Hourly</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
              </div>
            )}
            {visible.length ? (
              <HoldingsTable
                positions={visible}
                allPositions={positions}
                state={state}
                earnings={earnings}
                onEdit={setEditing}
              />
            ) : (
              <Empty
                title={
                  positions.length
                    ? "No holdings match your filter"
                    : "Bring your holdings into focus"
                }
                icon={Wallet}
                action={
                  <button
                    className="btn"
                    onClick={() =>
                      positions.length ? setQuery("") : setEditing("new")
                    }
                  >
                    {positions.length
                      ? "Clear filter"
                      : "Add your first position"}
                  </button>
                }
              >
                {positions.length
                  ? "Try another company name or ticker."
                  : "Record shares and average costs. Adding a position does not place a trade."}
              </Empty>
            )}
            <div className="approved-holding-tools">
              <HoldingsImport />
              {positions.length > 0 && (
                <button
                  className="text-link"
                  onClick={() => {
                    setDepthOpen(true);
                    depth.current?.showModal();
                  }}
                >
                  Full ledger & analysis <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          </section>
        </div>
        <div>
          <section className="card">
            <SectionHead
              title="Where your money sits"
              subtitle="Share of priced invested value"
            />
            {model.allocations.length ? (
              <>
                <div
                  className="allocation-track"
                  role="img"
                  aria-label={model.allocations
                    .map((a) => `${a.symbol} ${percent(a.weight)}`)
                    .join("; ")}
                >
                  {model.allocations.map((a, i) => (
                    <i
                      key={a.symbol}
                      style={{
                        width: `${a.weight}%`,
                        background: colors[i % colors.length],
                      }}
                    />
                  ))}
                </div>
                {model.allocations.map((a, i) => (
                  <Link
                    key={a.symbol}
                    href={researchLink(a.symbol, prefix)}
                    className="allocation-row"
                  >
                    <span>
                      <i
                        className="dot"
                        style={{ background: colors[i % colors.length] }}
                      />
                      {a.symbol}
                    </span>
                    <strong>{percent(a.weight)}</strong>
                  </Link>
                ))}
                <p className="chart-note">
                  Cash and managed balances excluded. Duplicate ticker positions
                  combined.
                  {model.unpriced.length
                    ? " Unpriced instruments are excluded."
                    : ""}
                </p>
              </>
            ) : (
              <Empty title="See how your holdings fit together">
                Available USD prices will reveal your allocation.
              </Empty>
            )}
          </section>
          <section className="card">
            <SectionHead
              title="Where risks overlap"
              subtitle="Different companies can depend on the same thing."
            />
            {model.groups.length ? (
              <>
                <div
                  className="approved-risk-bubbles"
                  aria-label="Sector and crypto exposure groups"
                >
                  {model.groups.slice(0, 5).map((group, i) => (
                    <div
                      className="approved-risk-bubble"
                      key={group.name}
                      style={{
                        color: colors[i],
                        borderColor: colors[i],
                        width: `${80 + Math.sqrt(group.weight) * 4}px`,
                        height: `${80 + Math.sqrt(group.weight) * 4}px`,
                      }}
                    >
                      <strong>{group.name}</strong>
                      <span>{percent(group.weight)}</span>
                      <small>
                        {group.symbols.length}{" "}
                        {group.symbols.length === 1 ? "company" : "companies"}
                      </small>
                    </div>
                  ))}
                </div>
                <p className="chart-note">
                  Supplied sector labels, not measured correlations.
                  Unclassified holdings remain visible. Weights use priced
                  invested value.
                </p>
                <details className="approved-risk-details">
                  <summary>See companies in each group</summary>
                  {model.groups.map((g) => (
                    <p key={g.name}>
                      <strong>
                        {g.name} · {percent(g.weight)}
                      </strong>
                      <br />
                      {g.symbols.join(", ")}
                    </p>
                  ))}
                </details>
              </>
            ) : (
              <Empty title="Understand shared exposure">
                Sector groups appear when your holdings have usable prices and
                company evidence.
              </Empty>
            )}
          </section>
          <section className="card compact-card lavender">
            <SectionHead
              title="One change. The whole picture."
              subtitle="Explore the business and your exposure before changing a holding."
            />
            <Link
              className="text-link"
              href={
                model.allocations[0]
                  ? researchLink(model.allocations[0].symbol, prefix)
                  : `${prefix}/research`
              }
            >
              Explore a position ↗
            </Link>
          </section>
        </div>
      </div>
      <p className="chart-note">
        Unrealized returns exclude realized trades, dividends, fees and taxes.
        Non-USD prices and costs are not converted.{" "}
        {quotes.checkedAt
          ? `Prices checked ${quoteTime(quotes.checkedAt)}.`
          : ""}
      </p>
      {editing && (
        <PositionEditor
          key={editing === "new" ? "new" : editing.id}
          position={editing === "new" ? null : editing}
          cashDefault={cashDefault}
          onClose={() => setEditing(null)}
        />
      )}
      <dialog
        ref={balances}
        className="dialog approved-workspace-dialog approved-balances-dialog"
        aria-labelledby="approved-balances-title"
        onClose={() => state.balances.refresh()}
      >
        <div className="dialog-head">
          <h2 id="approved-balances-title">Cash & balances</h2>
          <button
            className="icon-button"
            onClick={() => balances.current?.close()}
            aria-label="Close balances"
          >
            <X size={20} />
          </button>
        </div>
        <AccountBalances
          assets={model.assets}
          ready={!!workspace && quotes.ready}
          missing={model.unpriced.length}
        />
        <button
          className="btn"
          onClick={() => {
            balances.current?.close();
            setCashDefault(true);
            setEditing(
              positions.find(
                (p) => p.assetType === "cash" && p.symbol === "USD",
              ) || "new",
            );
          }}
        >
          Record or edit cash
        </button>
      </dialog>
      <dialog
        ref={depth}
        className="detail-drawer approved-depth-dialog"
        aria-labelledby="approved-depth-title"
        onClose={() => setDepthOpen(false)}
      >
        <header>
          <div>
            <span className="eyebrow">YOUR PORTFOLIO</span>
            <h2 id="approved-depth-title">The full picture</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => depth.current?.close()}
            aria-label="Close portfolio analysis"
          >
            <X size={22} />
          </button>
        </header>
        <div className="detail-content">
          {depthOpen && (
            <>
              {unlabeledCosts.length > 0 && (
                <section className="card">
                  <SectionHead
                    title="Confirm your recorded cost currency"
                    subtitle={`${unlabeledCosts.length} older holdings have saved costs without a currency label. Their value remains visible; their return needs that label.`}
                  />
                  <p className="chart-note">
                    {unlabeledCosts.map((p) => p.symbol).join(", ")}. Confirm
                    only if all these average costs are in USD. Otherwise edit
                    each holding below.
                  </p>
                  <button
                    className="btn"
                    disabled={currencySaving}
                    onClick={confirmUsdCosts}
                  >
                    {currencySaving ? "Saving…" : "Confirm these costs are USD"}
                  </button>
                  {currencyError && <Notice error>{currencyError}</Notice>}
                </section>
              )}
              <PortfolioLedger
                positions={positions}
                allPositions={positions}
                quotes={q}
                companies={companies}
                total={model.assets}
                earnings={earnings}
                prefix={prefix}
                onEdit={(p) => {
                  depth.current?.close();
                  setEditing(p);
                }}
              />
              <FeatureGate feature="portfolio">
                <PortfolioCharts positions={positions} quotes={q} />
                <PortfolioRiskSummary
                  positions={positions}
                  quotes={q}
                  calendar={calendar}
                />
                <PortfolioExposure positions={positions} quotes={quotes.data} />
                <SectorBenchmarks />
              </FeatureGate>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
function HoldingsTable({
  positions,
  allPositions,
  state,
  earnings,
  onEdit,
}: {
  positions: Position[];
  allPositions: Position[];
  state: ReturnType<typeof useWorkspaceData>;
  earnings: Set<string>;
  onEdit: (p: Position) => void;
}) {
  const { model, q, quotes, prefix } = state;
  const selected = new Set(positions.map((p) => p.id));
  const rows = ledgerRows(allPositions, q, model.invested, earnings)
    .filter((r) => selected.has(r.position.id))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return (
    <div className="table-scroll">
      <table className="holdings-table approved-holdings-table">
        <caption className="sr-only">
          Your recorded investments. Weights use priced invested value; cash is
          excluded from weight. Returns require a USD cost basis.
        </caption>
        <thead>
          <tr>
            <th>Company</th>
            <th>Weight</th>
            <th>Price</th>
            <th>Value / return</th>
            <th>
              <span className="sr-only">Edit holding</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = row.position,
              cash = p.assetType === "cash",
              quote = quotes.data[p.symbol]?.quote;
            return (
              <tr key={p.id}>
                <td>
                  {cash ? (
                    <div className="company-row">
                      <span className="approved-cash-mark">
                        <Wallet size={23} />
                      </span>
                      <span>
                        <b>{p.symbol} cash</b>
                        <small>Recorded balance</small>
                      </span>
                    </div>
                  ) : (
                    <Link
                      className="company-row"
                      href={researchLink(p.symbol, prefix)}
                    >
                      <SecurityLogo symbol={p.symbol} />
                      <span>
                        <b>{p.symbol}</b>
                        <small>
                          {quotes.data[p.symbol]?.company?.name ||
                            "Open research"}
                          <br />
                          {p.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}{" "}
                          {p.assetType === "crypto" ? "units" : "shares"} ·{" "}
                          {p.currency
                            ? amount(p.cost, p.currency)
                            : "Unknown currency"}{" "}
                          cost
                        </small>
                      </span>
                    </Link>
                  )}
                </td>
                <td>{cash ? "—" : percent(row.weight)}</td>
                <td>
                  <strong>
                    {cash ? "—" : amount(quote?.price, quote?.currency)}
                  </strong>
                  {!cash && (
                    <small
                      title={
                        quote
                          ? `${quote.source} · ${quoteTime(quote.asOf)}`
                          : undefined
                      }
                    >
                      {quote?.asOf
                        ? `${quote.stale ? "Older · " : ""}${quoteTime(quote.asOf, true)}`
                        : "Price unavailable"}
                    </small>
                  )}
                </td>
                <td>
                  <strong>{amount(row.value)}</strong>
                  <small
                    className={
                      row.pnl == null
                        ? "muted"
                        : row.pnl < 0
                          ? "negative"
                          : "green"
                    }
                  >
                    {row.returnPct != null
                      ? percent(row.returnPct, true)
                      : !cash
                        ? "Return unavailable"
                        : "Cash balance"}
                  </small>
                  {row.note && (
                    <small className="approved-holding-note">{row.note}</small>
                  )}
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${p.symbol}`}
                    onClick={() => onEdit(p)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Watchlist() {
  const state = useWorkspaceData("watchlist"),
    { workspace, prefix, quotes, mutate, pace } = state;
  const [query, setQuery] = useWorkspaceFilter("watchlist"),
    [type, setType] = useState("All"),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    all = workspace?.watchlist.map((w) => w.symbol) ?? [];
  const symbols = all.filter(
    (s) =>
      (type === "All" ||
        (type === "Crypto" ? s.includes("/") : !s.includes("/"))) &&
      `${s} ${quotes.data[s]?.company?.name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function remove(symbol: string) {
    setRemoving(symbol);
    setError("");
    try {
      await mutate({ op: "unwatch", symbol });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update watchlist.");
    } finally {
      setRemoving(null);
    }
  }
  const signal = all
    .map((symbol) => ({ symbol, pace: pace(symbol) }))
    .filter((r) => r.pace != null)
    .sort((a, b) => b.pace!.multiplier - a.pace!.multiplier)[0];
  return (
    <section className="approved-workspace approved-watchlist">
      <Heading
        title="Ideas worth following."
        subtitle="A watchlist that remembers why you were interested."
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
      <div className="watch-summary">
        <div>
          <span className="eyebrow">FOLLOWING</span>
          <strong>{all.length}</strong>
          <p>Companies in your watchlist</p>
        </div>
        <div>
          <span className="eyebrow">YOUR NEXT QUESTION</span>
          <h2>
            What would make this
            <br />a better decision?
          </h2>
          <p>Connect the price with the business, then set your checkpoint.</p>
        </div>
        <Link className="btn" href={`${prefix}/alerts`}>
          Create a price alert <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="card">
        <SectionHead
          title="Your watchlist"
          subtitle="Available prices and confirmed Pace from loaded research."
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
          <div className="table-scroll">
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
                  <th>Pace</th>
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
                        <small title={row?.quote?.source}>
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
                          href={researchLink(symbol, prefix)}
                          className={
                            signal
                              ? `pace-badge${signal.multiplier === 4 ? " approved-pace-four" : ""}`
                              : "text-link"
                          }
                          title={
                            signal
                              ? `${signal.month}: ${signal.reason}`
                              : "Open research to load and check the monthly policy"
                          }
                        >
                          {signal ? `${signal.multiplier}×` : "Open case"}
                        </Link>
                        {signal && <small>{signal.month} · confirmed</small>}
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
      <div className="two-grid">
        <article className="card compact-card">
          <SectionHead
            title="Price is one part of the story."
            subtitle={
              signal
                ? `${signal.symbol} has a confirmed ${signal.pace!.multiplier}× monthly reading. Open the explanation alongside business and funding risks.`
                : "A strong Pace reading deserves a clear explanation, alongside business and funding risks."
            }
          />
          <Link
            className="text-link"
            href={
              signal
                ? researchLink(signal.symbol, prefix)
                : `${prefix}/research`
            }
          >
            {signal
              ? `Explore ${signal.symbol}’s ${signal.pace!.multiplier}× reading`
              : "Explore a company’s full case"}{" "}
            ↗
          </Link>
          <p className="chart-note">
            Pace scales a scheduled contribution; it is not leverage or a return
            forecast.
          </p>
        </article>
        <article className="card compact-card">
          <SectionHead
            title="Keep your reason close."
            subtitle="Write what you want to see before adding a company."
          />
          <WatchlistNote symbols={all} />
        </article>
      </div>
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

export function ResearchHome() {
  const { workspace, workspaceError, demo } = useProduct(),
    quotes = useWorkspaceQuotes();
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const symbols = [
    ...new Set([
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) ?? []),
    ]),
  ];
  return (
    <section className="approved-workspace approved-research-home">
      <Heading
        title="Your next decision, in focus."
        subtitle="Explore the business, understand the price and build your perspective."
      />
      <section className="card approved-research-search">
        <span className="eyebrow">START WITH A COMPANY</span>
        <h2>What would you like to understand?</h2>
        <Search large />
        <p>Search a company name, ticker or supported crypto pair.</p>
      </section>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <p className="approved-data-note">{quotes.error}</p>}
      <SectionHead
        title="Your research universe"
        subtitle={`${symbols.length} saved companies · every case, connected`}
      />
      {symbols.length ? (
        <div className="approved-research-grid">
          {symbols.map((symbol) => {
            const row = quotes.data[symbol];
            return (
              <Link
                className="card approved-research-tile"
                href={researchLink(symbol, prefix)}
                key={symbol}
              >
                <div>
                  <SecurityLogo symbol={symbol} />
                  <ArrowUpRight size={18} />
                </div>
                <h3>{row?.company?.name || symbol}</h3>
                <p>
                  {symbol}
                  {row?.company?.exchange ? ` · ${row.company.exchange}` : ""}
                </p>
                <footer>
                  <strong>
                    {amount(row?.quote?.price, row?.quote?.currency)}
                  </strong>
                  <span
                    className={
                      row?.quote?.changePct == null
                        ? "muted"
                        : row.quote.changePct < 0
                          ? "negative"
                          : "green"
                    }
                  >
                    {percent(row?.quote?.changePct, true)}
                  </span>
                </footer>
                <small>
                  {row?.quote?.asOf
                    ? `${row.quote.stale ? "Older quote · " : ""}${quoteTime(row.quote.asOf)}`
                    : quotes.loading
                      ? "Checking the latest price…"
                      : "Research available · price pending"}
                </small>
              </Link>
            );
          })}
        </div>
      ) : (
        <section className="card">
          <Empty title="Start with a company you care about">
            Search above. Save a company to keep its business, price and
            evidence within reach.
          </Empty>
        </section>
      )}
    </section>
  );
}
