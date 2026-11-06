"use client";
import SectionIcon from "./SectionIcon";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import OpportunityMap from "./OpportunityMap";
import { MarketRadar } from "./MarketRadar";
import ResearchInbox from "./ResearchInbox";
import ContributionCompare from "./ContributionCompare";
import HomeMarketCards from "./HomeMarketCards";
import portfolioStyles from "./PortfolioWorkspace.module.css";
import workspaceVisuals from "./WorkspaceVisuals.module.css";
import { companyAccent } from "@/lib/visual-signals";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { customerText } from "@/lib/customer-language";

import Link from "next/link";
import visual from "./WorkspacePrimitives.module.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
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
import homeStyles from "./HomeWorkspace.module.css";
import type { HomeFeed, MarketEvent } from "@/lib/home-feed";
import {
  groupMarketEvents,
  marketDay,
  earningsEventState,
  homeFeedReadiness,
  loadHomeFeed,
  relevantHoldingHeadlines,
} from "@/lib/home-feed";
import { api } from "@/lib/client";
import { readResource, resourceSnapshot } from "@/lib/resource-cache";
import { homeBrief } from "@/lib/home-brief";
import PaceHelp from "./PaceHelp";
import PaceInstrument from "./PaceInstrument";
import PaceGuidance from "./PaceGuidance";
import { workspaceGuidance } from "@/lib/edge-research";
import { amount, percent, quoteTime, dateLabel } from "@/lib/format";
import { ledgerRows } from "@/lib/portfolio-ledger";
import { researchLink, workspaceOverview } from "@/lib/approved-workspace";
import { useProduct, useResource, useWorkspaceFilter } from "./Session";
import { useWorkspaceQuotes } from "./Workspace";
import { FeatureGate } from "./Access";
import { Empty, Notice, SecurityLogo, Help } from "./Ui";
import Search from "./Search";
import CompanySparkline from "./CompanySparkline";
import AccountBalances from "./AccountBalances";
import PortfolioLedger from "./PortfolioLedger";
import PortfolioCharts from "./PortfolioCharts";
import PortfolioExposure from "./PortfolioExposure";
import PortfolioRiskSummary, {
  usePortfolioCalendar,
} from "./PortfolioRiskSummary";
import SectorBenchmarks from "./SectorBenchmarks";
import ApprovedPortfolioChart from "./ApprovedPortfolioChart";
import { PositionEditor } from "./ApprovedWorkspaceForms";

const colors = [
  "#76b6aa",
  "#b6ce58",
  "#68ae94",
  "#638a99",
  "#d28b78",
  "#7b8a85",
];
const previewBalances = { balances: null };
const emptyFeed: HomeFeed = {
  events: [],
  news: [],
  issues: [],
  retrievedAt: "",
  followed: 0,
  newsFollowed: 0,
  eventsReady: true,
  newsReady: true,
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
    <div className={visual.heading}>
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
    <div className={visual.sectionHead}>
      <div>
        <h2>
          <SectionIcon name={title} />
          {title}
        </h2>
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
  const kind = /return|gain|performance/i.test(label)
    ? "return"
    : /watch|idea/i.test(label)
      ? "ideas"
      : "value";
  const Icon =
    kind === "return" ? Activity : kind === "ideas" ? Bookmark : Wallet;
  return (
    <div
      className={visual.metric}
      data-kind={kind}
      data-tone={tone || undefined}
    >
      <span>
        <Icon aria-hidden="true" />
        <Help label={label} trigger={label}>
          <p>{note}</p>
          <p>
            {kind === "return"
              ? "Unrealized change compares available position prices with recorded cost. It excludes realized trades, dividends, fees and taxes."
              : kind === "ideas"
                ? "Companies saved to your watchlist for further research. Saving a company does not create a holding."
                : label === "Margin used"
                  ? "Recorded borrowing is subtracted from portfolio net value. This is not available buying power."
                  : label === "Cash & managed"
                    ? "Recorded cash and separately managed balances. These are entered balances, not live bank balances."
                    : "Available investment values plus recorded cash and managed balances, less recorded margin. Missing prices and currency mismatches can make this total incomplete."}
          </p>
        </Help>
      </span>
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
    return workspaceGuidance(
      r,
      !!product.workspace?.positions.some(
        (p) => sameProviderSymbol(p.symbol, r.company.symbol) && p.quantity > 0,
      ),
      product.demo ? Date.parse(r.retrievedAt) : Date.now(),
    );
  };
  return { ...product, quotes, balances, prefix, model, q, pace, research };
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
                  : "After cash and borrowing"
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
              ? `${percent(model.returnPct, true)} · ${model.returnCovered}/${model.investmentCount} holdings with cost`
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
              label="Watchlist ideas"
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
        ? `${model.older} older quote${model.older === 1 ? "" : "s"} included. `
        : ""}
      {quotes.error || ""}{" "}
      <button
        className="text-link"
        onClick={quotes.refresh}
        disabled={quotes.loading}
      >
        Refresh prices
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
function useHomeFeed(symbols: string[]) {
  const { cache, demo } = useProduct();
  const key = `home-feed:all:${[...new Set(symbols)].sort().join(",")}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: HomeFeed | null;
    loading: boolean;
    error: string;
  }>(() => ({
    key,
    data: resourceSnapshot<HomeFeed>(cache, key),
    loading: !!symbols.length && !demo,
    error: "",
  }));
  useEffect(() => {
    if (demo) return;
    let active = true;
    const old = resourceSnapshot<HomeFeed>(cache, key);
    setState({ key, data: old, loading: true, error: "" });
    readResource(cache, key, old?.issues.length ? 30000 : 300000, () =>
      loadHomeFeed(
        key.slice("home-feed:all:".length).split(",").filter(Boolean),
        (batch) =>
          api<HomeFeed>(
            `home-feed?symbols=${encodeURIComponent(batch.join(","))}`,
          ),
      ),
    )
      .then((data) => {
        if (active) setState({ key, data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            data: old,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Updates could not be checked.",
          });
      });
    return () => {
      active = false;
    };
  }, [cache, demo, key, revision]);
  useEffect(() => {
    if (demo || !symbols.length) return;
    let lastCheck = Date.now();
    const check = () => {
      if (
        document.visibilityState === "hidden" ||
        Date.now() - lastCheck < 300000
      )
        return;
      lastCheck = Date.now();
      setRevision((value) => value + 1);
    };
    const timer = window.setInterval(check, 300000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [demo, key, symbols.length]);
  const refresh = () => {
    cache.delete(key);
    setRevision((value) => value + 1);
  };
  if (demo) return { data: emptyFeed, loading: false, error: "", refresh };
  return {
    ...(state.key === key
      ? state
      : {
          data: resourceSnapshot<HomeFeed>(cache, key),
          loading: !!symbols.length,
          error: "",
        }),
    refresh,
  };
}

function EarningsNumbers({
  event,
  today,
}: {
  event: MarketEvent;
  today: string;
}) {
  const actual =
    event.date <= today &&
    typeof event.actual === "number" &&
    Number.isFinite(event.actual)
      ? event.actual
      : null;
  const estimate =
    typeof event.estimate === "number" && Number.isFinite(event.estimate)
      ? event.estimate
      : null;
  return (
    <small className={homeStyles.earningsNumbers}>
      <span>
        EPS reported{" "}
        <strong>{actual === null ? "Pending" : actual.toFixed(2)}</strong>
      </span>
      <span>
        Estimate{" "}
        <strong>
          {estimate === null ? "Not supplied" : estimate.toFixed(2)}
        </strong>
      </span>
    </small>
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
  const day = marketDay(today);
  const symbols = [
    ...new Set([
      ...model.allocations.map((a) => a.symbol),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) ?? []),
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
    ]),
  ];
  const feedSymbols = symbols.filter((symbol) =>
    /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol),
  );
  const feed = useHomeFeed(feedSymbols);
  const readiness = feed.data
    ? homeFeedReadiness(feed.data)
    : { eventsReady: false, newsReady: false };
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
    eventsReady: readiness.eventsReady && !feed.error,
    newsReady: readiness.newsReady && !feed.error,
    hasHoldings: !!workspace?.positions.length,
  });
  const largest = model.allocations[0];
  const signals = symbols
    .map((symbol) => ({ symbol, signal: pace(symbol) }))
    .filter(
      (x) =>
        x.signal?.view.permitted &&
        x.signal.view.rawLevel != null &&
        x.signal.view.rawLevel >= 2,
    )
    .sort(
      (a, b) => (b.signal!.multiplier ?? -1) - (a.signal!.multiplier ?? -1),
    );
  const best = signals[0];

  const pastPending = (feed.data?.events ?? []).filter(
    (event) =>
      symbols.includes(event.symbol) &&
      /earnings/i.test(event.kind) &&
      event.date < day &&
      Date.parse(event.date) >= Date.parse(day) - 3 * 86400000 &&
      earningsEventState(event, day).status !== "reported" &&
      !brief.reported.some(
        (reported) =>
          reported.symbol === event.symbol && reported.date === event.date,
      ),
  );
  const calendarEvents = [
    ...new Map(
      [...pastPending, ...brief.checkpoints].map((event) => [
        `${event.symbol}:${event.date}:${event.kind}`,
        event,
      ]),
    ).values(),
  ];
  const eventGroups = groupMarketEvents(calendarEvents);
  const loadedResearch = symbols.flatMap((symbol) => {
    const research = state.research(symbol);
    return research ? [research] : [];
  });
  const hour = today.getHours(),
    greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  return (
    <section
      className={`approved-workspace approved-home home-decision-view ${homeStyles.home}`}
    >
      <div className={homeStyles.greeting}>
        <Heading
          title={`${greeting}${displayName ? `, ${displayName}` : ""}.`}
          subtitle="Your companies, upcoming events and research."
          actions={
            <span className="date-chip">
              {today.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              <small>
                {demo
                  ? "Illustrative workspace"
                  : `${symbols.length} companies followed`}
              </small>
            </span>
          }
        />
      </div>
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <div className={homeStyles.quickLinks}>
        <Link href={`${prefix}/discover`}>
          Discover ideas <ArrowUpRight size={16} />
        </Link>
        <Link href={`${prefix}/watchlist`}>
          Your watchlist <Bookmark size={16} />
        </Link>
        <Link href={`${prefix}/research`}>
          Research a company <SearchIcon size={16} />
        </Link>
      </div>
      <ContributionCompare symbols={symbols} prefix={prefix} />
      <HomeMarketCards
        symbols={symbols}
        quotes={quotes.data}
        research={loadedResearch}
        prefix={prefix}
      />
      <ResearchInbox today={day} />
      {loadedResearch.length > 0 && (
        <details className={homeStyles.marketRadar}>
          <summary>
            Market radar{" "}
            <span>
              {loadedResearch.length} loaded companies · historical breadth &
              rotation
            </span>
          </summary>
          <OpportunityMap
            research={loadedResearch}
            requested={symbols}
            prefix={prefix}
            demo={!!demo}
          />
          <MarketRadar research={loadedResearch} asOf={day} />
        </details>
      )}
      {symbols.length > 0 && (
        <>
          <Coverage state={state} />
          <div className="home-evidence-layout">
            <section className="home-evidence-panel">
              <SectionHead
                title="Your companies"
                subtitle="Keep your next decision close."
                action={
                  <Link className="text-link" href={`${prefix}/watchlist`}>
                    View all <ArrowUpRight size={16} />
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
                  title="Begin with one company"
                  action={
                    <Link className="btn" href={`${prefix}/research`}>
                      Find a company
                    </Link>
                  }
                >
                  Save an idea or record a holding to make this space yours.
                </Empty>
              )}
            </section>
            <section
              className="home-evidence-panel home-events-panel"
              id="home-earnings"
              aria-label="Company earnings and events"
            >
              <SectionHead
                title="Earnings & events"
                subtitle="Recent results and the next 7 days."
                action={
                  <button
                    className="icon-btn"
                    onClick={feed.refresh}
                    disabled={feed.loading}
                    aria-label="Refresh company events"
                  >
                    <RefreshCw size={18} />
                  </button>
                }
              />
              {eventGroups.length ? (
                <div className="home-event-groups">
                  {eventGroups.map((group) => (
                    <div className="home-event-day" key={group.date}>
                      <time dateTime={group.date}>
                        {new Intl.DateTimeFormat("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }).format(Date.parse(group.date))}
                      </time>
                      <div>
                        {group.events.map((event) => (
                          <Link
                            className="home-event-row"
                            key={`${event.symbol}:${event.kind}`}
                            href={researchLink(event.symbol, prefix)}
                          >
                            <span>
                              <strong>{event.symbol}</strong>
                              <span>{event.kind}</span>
                              {/earnings/i.test(event.kind) && (
                                <b
                                  className={`earnings-status earnings-${earningsEventState(event, day).status}`}
                                >
                                  {earningsEventState(event, day).label}
                                </b>
                              )}
                              <small>
                                {event.detail || "Time not confirmed"}
                              </small>
                              {/earnings/i.test(event.kind) && (
                                <EarningsNumbers event={event} today={day} />
                              )}
                            </span>
                            <ArrowUpRight size={16} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="home-quiet-state">
                  <CalendarDays size={24} />
                  <h3>
                    {feed.loading
                      ? "Checking the calendar…"
                      : !symbols.length
                        ? "Your next checkpoint."
                        : !readiness.eventsReady
                          ? "Calendar coverage is incomplete."
                          : "No dated events returned."}
                  </h3>
                  <p>
                    {!symbols.length
                      ? "Follow a company to see upcoming earnings and other dated events."
                      : feed.loading
                        ? "Looking up dated company events for the week ahead."
                        : !readiness.eventsReady
                          ? "Some scheduled events could not be checked. Missing coverage does not mean no events."
                          : "No scheduled company event was returned for the next 7 days."}
                  </p>
                </div>
              )}
              {brief.reported.length > 0 && (
                <div
                  className="home-reported-results"
                  aria-label="Recently reported earnings"
                >
                  <h3>
                    Recently reported <span>{brief.reported.length}</span>
                  </h3>
                  {brief.reported.map((event) => (
                    <Link
                      className="home-event-row"
                      key={`${event.symbol}:${event.date}`}
                      href={researchLink(event.symbol, prefix)}
                    >
                      <span>
                        <strong>{event.symbol}</strong>
                        <b className="earnings-status earnings-reported">
                          Results reported
                        </b>
                        <small>{dateLabel(event.date)}</small>
                        <EarningsNumbers event={event} today={day} />
                      </span>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                </div>
              )}
              {!feed.loading &&
                eventGroups.length > 0 &&
                !readiness.eventsReady && (
                  <p className="home-source-note">
                    These dates are available. Some company events could not be
                    checked.
                  </p>
                )}
              <p className="home-source-note" role="status">
                {demo
                  ? "Illustrative workspace"
                  : feed.loading
                    ? "Checking company events…"
                    : feed.error
                      ? "Some company events could not be checked."
                      : feed.data?.retrievedAt
                        ? `Checked ${quoteTime(feed.data.retrievedAt)}.`
                        : "Available calendar observations"}
              </p>
              {!feed.loading && !readiness.eventsReady && (
                <button className="text-link" onClick={feed.refresh}>
                  Retry calendar <RefreshCw size={14} />
                </button>
              )}
            </section>
          </div>
          <div className="home-evidence-layout home-secondary-layout">
            <section
              className="home-evidence-panel home-news-panel"
              aria-label="What changed"
            >
              <SectionHead
                title="What changed"
                subtitle="Recent company updates, with the source attached."
                action={
                  <span className="home-section-count">
                    {headlines.length
                      ? `${headlines.length} updates`
                      : "This week"}
                  </span>
                }
              />
              {headlines.length ? (
                <div className="home-news-list">
                  {headlines.slice(0, 5).map((news) => (
                    <article key={`${news.symbol}:${news.url}`}>
                      <div className="home-news-meta">
                        <SecurityLogo symbol={news.symbol} />
                        <Link href={researchLink(news.symbol, prefix)}>
                          {news.symbol}
                        </Link>
                        <time dateTime={news.date}>{dateLabel(news.date)}</time>
                      </div>
                      <a
                        className="home-news-title"
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {news.title}
                        <ArrowUpRight size={17} />
                      </a>
                      <Link
                        className="text-link"
                        href={researchLink(news.symbol, prefix)}
                      >
                        Review the company <ArrowUpRight size={15} />
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="home-quiet-state">
                  <FileText size={24} />
                  <h3>
                    {feed.loading
                      ? "Checking your companies…"
                      : feed.error || !readiness.newsReady
                        ? "News could not be fully checked."
                        : "No recent matched headlines."}
                  </h3>
                  <p>
                    {!symbols.length
                      ? "Save a company to bring its updates here."
                      : feed.loading
                        ? "Looking for recent updates across your followed companies."
                        : feed.error || !readiness.newsReady
                          ? "Available research is still ready to read. Retry to check the missing sources."
                          : "No recent company-matched story was returned by the news source."}
                  </p>
                  <Link className="text-link" href={`${prefix}/research`}>
                    Open research <ArrowUpRight size={15} />
                  </Link>
                </div>
              )}
              {headlines.length > 5 && (
                <details className="home-more-updates">
                  <summary>Show {headlines.length - 5} more updates</summary>
                  {headlines.slice(5).map((news) => (
                    <article key={news.url}>
                      <span>
                        {news.symbol} · {dateLabel(news.date)}
                      </span>
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {news.title}
                        <ArrowUpRight size={15} />
                      </a>
                    </article>
                  ))}
                </details>
              )}
              {!feed.loading && symbols.length > 0 && (
                <p className="home-source-note">
                  {demo
                    ? "News is not simulated in this preview."
                    : `${feed.data?.newsFollowed ?? 0} of ${feedSymbols.length} followed stocks checked.${readiness.newsReady ? "" : " Some news coverage is unavailable."}`}
                  {symbols.length > feedSymbols.length
                    ? " Crypto news is available in individual research."
                    : ""}
                </p>
              )}
              {(feed.error || (!feed.loading && !readiness.newsReady)) && (
                <button className="text-link" onClick={feed.refresh}>
                  Retry updates <RefreshCw size={14} />
                </button>
              )}
            </section>
            <section className="home-evidence-panel home-review-panel">
              <SectionHead
                title="Research to revisit"
                subtitle="Price context with business checks attached."
              />
              <Link
                className="home-review-row"
                href={
                  best
                    ? researchLink(best.symbol, prefix)
                    : `${prefix}/research`
                }
              >
                <span className="home-review-mark">
                  {best ? (
                    best.signal!.view.rawLevel != null ? (
                      best.signal!.view.code
                    ) : (
                      <Activity size={20} />
                    )
                  ) : (
                    <Bookmark size={20} />
                  )}
                </span>
                <span>
                  <strong>
                    {best
                      ? `${best.symbol} · AURYN Pace`
                      : "Explore accumulation zones"}
                  </strong>
                  <small>
                    {best
                      ? `${best.signal!.view.actionLabel} · confirmed ${best.signal!.view.code}. From companies researched in this session; review the business and your position limit.`
                      : "Open a company to see whether its business qualifies and an accumulation zone is established."}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            </section>
          </div>
        </>
      )}
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
        {row?.quote?.asOf && (
          <time className="home-quote-asof" dateTime={row.quote.asOf}>
            {quoteTime(row.quote.asOf, true)}
          </time>
        )}
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
  const today = marketDay();
  const earnings = new Set(
    (calendar.data?.events ?? [])
      .filter(
        (e) =>
          /earnings/i.test(e.kind) &&
          earningsEventState(e, today).status !== "reported" &&
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
    <section
      className={`approved-workspace approved-portfolio ${portfolioStyles.portfolio} ${workspaceVisuals.workspaceVisuals}`}
    >
      <Heading
        title="Portfolio"
        subtitle="Holdings, performance and allocation."
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
              title="Portfolio trend"
              subtitle="Current holdings · historical prices"
            />
            <ApprovedPortfolioChart
              positions={positions}
              quotes={quotes.data}
            />
          </section>
          <section className="card">
            <SectionHead
              title="Holdings"
              subtitle=""
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
              title="Allocation"
              subtitle="Priced investments"
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
                  {model.allocations.map((a) => (
                    <i
                      key={a.symbol}
                      style={{
                        width: `${a.weight}%`,
                        background: companyAccent(a.symbol),
                      }}
                    />
                  ))}
                </div>
                {model.allocations.slice(0, 6).map((a) => (
                  <Link
                    key={a.symbol}
                    href={researchLink(a.symbol, prefix)}
                    className="allocation-row"
                  >
                    <span>
                      <i
                        className="dot"
                        style={{ background: companyAccent(a.symbol) }}
                      />
                      {a.symbol}
                    </span>
                    <strong>{percent(a.weight)}</strong>
                  </Link>
                ))}
                {model.allocations.length > 6 && <details className="allocation-more"><summary>All {model.allocations.length} holdings</summary>
                {model.allocations.slice(6).map((a) => (
                  <Link
                    key={a.symbol}
                    href={researchLink(a.symbol, prefix)}
                    className="allocation-row"
                  >
                    <span>
                      <i
                        className="dot"
                        style={{ background: companyAccent(a.symbol) }}
                      />
                      {a.symbol}
                    </span>
                    <strong>{percent(a.weight)}</strong>
                  </Link>
                ))}
                </details>}
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
              title="Exposure"
              subtitle="Shared sectors and themes"
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
    <div className={`table-scroll ${portfolioStyles.ledger}`}>
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
              quote = quotes.data[p.symbol]?.quote,
              decision = cash ? null : state.pace(p.symbol);
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
                        {decision && (
                          <small
                            className={
                              decision.view.status === "paused"
                                ? "red"
                                : "muted"
                            }
                          >
                            Your holding · {decision.view.actionLabel}
                            {decision.view.rawLevel != null
                              ? ` · Confirmed Pace ${decision.view.code}`
                              : ""}
                          </small>
                        )}
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
                          ? `Price as of ${quoteTime(quote.asOf)}`
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
                      ? `${amount(row.pnl)} · ${percent(row.returnPct, true)}`
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
  const accountPrefs = useWorkspacePreferences();
  const { demo: watchDemo } = useProduct();
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
    [type, setType] = useState("All"),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState<string | null>(null);
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
                          {signal ? signal.view.actionLabel.replace(/ · P[0-4]$/, "") : "Open case"}
                          {signal?.view.rawLevel != null && (
                            <span> · {signal.view.code}</span>
                          )}
                        </Link>
                        {signal && (
                          <small>
                            New: {signal.actions.entry} · Held:{" "}
                            {signal.actions.holding}
                          </small>
                        )}
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

export function ResearchHome() {
  const { workspace, workspaceError, demo } = useProduct(),
    quotes = useWorkspaceQuotes();
  const [page, setPage] = useState(0);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const symbols = [
    ...new Set([
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) ?? []),
    ]),
  ];
  const pageCount = Math.max(1, Math.ceil(symbols.length / 4));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleSymbols = symbols.slice(currentPage * 4, currentPage * 4 + 4);
  return (
    <section
      className={`approved-workspace approved-research-home ${homeStyles.research}`}
    >
      <Heading
        title="Research"
        subtitle="Explore companies. Compare the evidence."
      />
      <section className="card approved-research-search">
        <h2>Find a company</h2>
        <Search large />
        
      </section>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <p className="approved-data-note">{quotes.error}</p>}
      {symbols.length ? (
        <>
          <HomeMarketCards
            symbols={visibleSymbols}
            quotes={quotes.data}
            research={[]}
            prefix={prefix}
            context="research"
            total={symbols.length}
          />
          {pageCount > 1 && (
            <nav
              className={homeStyles.researchPaging}
              aria-label="Saved company pages"
            >
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span aria-live="polite">
                {currentPage * 4 + 1}–
                {Math.min((currentPage + 1) * 4, symbols.length)} of{" "}
                {symbols.length}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage + 1 >= pageCount}
              >
                Next
              </button>
            </nav>
          )}
        </>
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
