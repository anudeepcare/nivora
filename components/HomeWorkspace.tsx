"use client";
import { useEffect, useState } from "react";
import todayStyles from "./TodaySequence.module.css";
import { useResource } from "./Session";
import { quoteHealth } from "@/lib/quote-health";
import ContributionCompare from "./ContributionCompare";
import HomeQuarterHighlights from "./HomeQuarterHighlights";
import HomeMarketCards from "./HomeMarketCards";
import HomeRadar from "./HomeRadar";
import TodayMacroWatch from "./TodayMacroWatch";
import ResearchInbox from "./ResearchInbox";
import { useHomeFeed } from "./useHomeFeed";

import { researchLink } from "@/lib/approved-workspace";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { watchMarketDay } from "@/lib/today-market-clock";
import { todayNarrative } from "@/lib/today-narrative";
import type { EodNews } from "@/lib/eodhd";
import { dailyPerspective, homeBrief } from "@/lib/home-brief";
import type { MarketEvent } from "@/lib/home-feed";
import {
  earningsEventState,
  groupMarketEvents,
  homeFeedReadiness,
  marketDay,
  relevantHoldingHeadlines,
} from "@/lib/home-feed";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import { ArrowUpRight, Lightbulb, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FeatureGate, useAccess } from "./Access";
import CompanySparkline from "./CompanySparkline";
import homeStyles from "./HomeWorkspace.module.css";
import { Empty, Notice, SecurityLogo } from "./Ui";

import {
  Coverage,
  Heading,
  SectionHead,
  useWorkspaceData,
} from "./WorkspaceShared";
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
        {actual === null ? "" : "EPS "}
        <strong>{actual === null ? "" : actual.toFixed(2)}</strong>
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
  const [radarOpen, setRadarOpen] = useState(false);
  const [, setMarketDay] = useState("");
  const { access } = useAccess();
  const state = useWorkspaceData("all", { scanPace: false }),
    { workspace, quotes, model, prefix, demo } = state;
  const preview = !!demo;
  useEffect(
    () => (preview ? undefined : watchMarketDay(setMarketDay)),
    [preview],
  );
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
  const benchmarks = ["SPY", "QQQ"] as const;
  // Reuse workspace quotes for benchmarks already followed; at most one
  // separate request for the remaining fixed proxies, never private symbols.
  const missingBenchmarks = benchmarks.filter(
    (symbol) => !symbols.includes(symbol),
  );
  const marketQuotes = useResource<QuoteRows>(
    demo || !missingBenchmarks.length
      ? null
      : `quotes?symbols=${encodeURIComponent([...missingBenchmarks].sort().join(","))}`,
    undefined,
    120_000,
  );
  const feedSymbols = symbols.filter((symbol) =>
    /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol),
  );
  const feed = useHomeFeed(feedSymbols);
  const readiness = feed.data
    ? homeFeedReadiness(feed.data)
    : { eventsReady: false, newsReady: false };
  const calendarReady = readiness.eventsReady && !feed.error;
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
    eventsReady: calendarReady,
    newsReady: readiness.newsReady && !feed.error,
    hasHoldings: !!workspace?.positions.length,
  });
  const narrativeInput = {
    day,
    now: today.toISOString(),
    reports: brief.reported,
    headlines,
    checkpoints: brief.checkpoints,
  };
  const marketNewsKey =
    access.admitted && !access.sampleOnly && !!access.features.news && !demo
      ? "news?symbol=SPY"
      : null;
  const marketCoverage = useResource<EodNews>(
    marketNewsKey,
    undefined,
    3_600_000,
  );
  const story = todayNarrative({
    ...narrativeInput,
    marketHeadlines: marketNewsKey
      ? (marketCoverage.data?.items ?? []).map((item) => ({
          symbol: "SPY",
          date: item.date,
          title: item.title,
          url: item.url,
        }))
      : [],
  });
  const spotlight = story?.kind === "headline" ? story.headline.url : null;
  const secondaryHeadlines = spotlight
    ? headlines.filter((item) => item.url !== spotlight)
    : headlines;

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
  // Keep earnings represented by their detailed calendar row, not a duplicate priority card.
  const calendarKeys = new Set(
    [...calendarEvents, ...brief.reported].map(
      (event) => `${event.symbol}:${event.date}`,
    ),
  );
  const heldSymbols = new Set(
    (workspace?.positions ?? [])
      .filter(
        (position) =>
          position.assetType !== "cash" &&
          Number.isFinite(position.quantity) &&
          position.quantity !== 0,
      )
      .map((position) => position.symbol),
  );
  const eventGroups = groupMarketEvents(calendarEvents).map((group) => ({
    ...group,
    events: [...group.events].sort(
      (a, b) =>
        Number(heldSymbols.has(b.symbol)) - Number(heldSymbols.has(a.symbol)),
    ),
  }));
  const loadedResearch = symbols.flatMap((symbol) => {
    const research = state.research(symbol);
    return research ? [research] : [];
  });
  const renderHeadline = (news: (typeof headlines)[number]) => (
    <article
      className={homeStyles.headlineRow}
      key={`${news.symbol}:${news.url}`}
    >
      <SecurityLogo symbol={news.symbol} size={32} />
      <div className={homeStyles.headlineCopy}>
        <div className="home-news-meta">
          <Link href={researchLink(news.symbol, prefix)}>{news.symbol}</Link>
          <time dateTime={news.date}>{dateLabel(news.date)}</time>
        </div>
        <a
          className="home-news-title"
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {news.title}
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
  return (
    <section
      className={`approved-workspace approved-home home-decision-view ${homeStyles.home}`}
    >
      <header className={`${todayStyles.hero} ${homeStyles.todayHeading}`}>
        <h1>Today</h1>
        <span className="date-chip">
          <time dateTime={day}>
            {new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <small>
            {demo
              ? "Illustrative workspace"
              : `${symbols.length} ${symbols.length === 1 ? "symbol" : "symbols"} followed`}
          </small>
        </span>
      </header>
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <section
        className={homeStyles.narrative}
        data-story={story ? "evidence" : "empty"}
        aria-label="Today’s story"
      >
        <div className={homeStyles.narrativeMain}>
          <p className={homeStyles.storyLabel}>
            {story?.kind === "report" ? (
              <>
                Reported earnings ·{" "}
                <time dateTime={story.report.date}>
                  {dateLabel(story.report.date)}
                </time>
              </>
            ) : story?.kind === "headline" ? (
              <>
                {story.scope === "market"
                  ? "SPY market coverage · Source headline"
                  : `${story.headline.symbol} · Source headline`}{" "}
                · {story.source} ·{" "}
                <time dateTime={story.headline.date}>
                  {dateLabel(story.headline.date)}
                </time>
              </>
            ) : (
              "Daily briefing"
            )}
          </p>
          <h2>
            {story?.kind === "report"
              ? `${story.report.symbol} reported earnings`
              : story?.kind === "headline"
                ? story.headline.title
                : "Start with what you can verify."}
          </h2>
          {story?.kind === "report" && (
            <>
              <dl className={homeStyles.storyFacts}>
                <div>
                  <dt>Reported EPS</dt>
                  <dd>{story.report.actual?.toFixed(2)}</dd>
                </div>
                {typeof story.report.estimate === "number" &&
                  Number.isFinite(story.report.estimate) && (
                    <div>
                      <dt>Feed estimate</dt>
                      <dd>{story.report.estimate.toFixed(2)}</dd>
                    </div>
                  )}
              </dl>
              <p className={homeStyles.storyNote}>
                From the earnings feed. Currency and EPS basis not supplied;
                verify the filing before comparing.
              </p>
            </>
          )}
          {story ? (
            <p className={homeStyles.storyReason}>
              <strong>Why it matters</strong> {story.why}
            </p>
          ) : (
            <p className={homeStyles.storyReason}>
              {feed.loading || marketCoverage.loading
                ? "Checking for dated company and market coverage."
                : "No matching company report or market headline is available in this brief."}
            </p>
          )}
          {story?.kind === "headline" ? (
            <a
              className={homeStyles.storyAction}
              href={story.headline.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ) : (
            <Link
              className={homeStyles.storyAction}
              href={
                story?.kind === "report"
                  ? `${researchLink(story.report.symbol, prefix)}?tab=News`
                  : `${prefix}/research`
              }
            >
              {story?.kind === "report"
                ? "Open earnings evidence"
                : "Open company research"}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
        {story?.next && (
          <p className={homeStyles.storyCatalyst}>
            <strong>
              {story.next.date === day
                ? "Scheduled today"
                : "Next supplied event"}
            </strong>{" "}
            {story.next.kind} ·{" "}
            <time dateTime={story.next.date}>{dateLabel(story.next.date)}</time>
            {story.next.detail ? ` · ${story.next.detail}` : ""}
          </p>
        )}
      </section>
      <aside className={homeStyles.dailyThought} aria-label="Auryn thought">
        <Lightbulb size={18} aria-hidden="true" />
        <div>
          <span>
            <strong>Auryn thought</strong>{" "}
            <time dateTime={day}>{dateLabel(day)}</time>
          </span>
          <p>{dailyPerspective(day)}</p>
        </div>
      </aside>
      <div className={homeStyles.briefContainer}>
        <section
          className={homeStyles.dailyBrief}
          aria-label="Daily market briefing"
        >
          <section
            className={homeStyles.marketSnapshot}
            aria-labelledby="today-market-snapshot"
          >
            <div className={homeStyles.marketHead}>
              <h2 id="today-market-snapshot">Market snapshot</h2>
              <span>U.S. market ETF proxies</span>
            </div>
            <dl
              className={homeStyles.marketTape}
              aria-label="ETF market proxies"
            >
              {benchmarks.map((symbol) => {
                const quote = quoteHealth(
                  quotes.data[symbol]?.quote ??
                    marketQuotes.data?.[symbol]?.quote,
                  today.getTime(),
                );
                const timestamp = Date.parse(quote?.asOf ?? "");
                const price = quote?.price;
                const available =
                  quote?.currency === "USD" &&
                  typeof price === "number" &&
                  Number.isFinite(price) &&
                  price > 0 &&
                  Number.isFinite(timestamp) &&
                  timestamp <= today.getTime();
                const move =
                  available &&
                  typeof quote.changePct === "number" &&
                  Number.isFinite(quote.changePct)
                    ? quote.changePct
                    : null;
                return (
                  <div key={symbol}>
                    <dt>
                      <Link href={researchLink(symbol, prefix)}>{symbol}</Link>
                      <span>
                        {symbol === "SPY" ? "S&P 500 ETF" : "Nasdaq-100 ETF"}
                      </span>
                    </dt>
                    <dd>
                      {available ? (
                        <>
                          <strong
                            data-direction={
                              move == null || move === 0
                                ? "flat"
                                : move > 0
                                  ? "up"
                                  : "down"
                            }
                          >
                            {move === null
                              ? "Change unavailable"
                              : percent(move, true)}
                          </strong>
                          <span>{amount(price, quote.currency)}</span>
                          <small className={homeStyles.quoteMeta}>
                            {quote.stale && (
                              <span data-freshness="older">Older quote</span>
                            )}
                            {(!quote.stale ||
                              (quote.session &&
                                !/^last available quote$/i.test(
                                  quote.session,
                                ))) && (
                              <span>
                                {quote.session || "Session not supplied"}
                              </span>
                            )}
                            <time dateTime={quote.asOf ?? undefined}>
                              {/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(
                                quote.asOf ?? "",
                              )
                                ? dateLabel(quote.asOf)
                                : quoteTime(quote.asOf, !quote.stale, today)}
                            </time>
                          </small>
                        </>
                      ) : (
                        <span>
                          {demo
                            ? "Not in this preview"
                            : marketQuotes.loading ||
                                (symbols.includes(symbol) && quotes.loading)
                              ? "Checking quote…"
                              : "Quote unavailable"}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
          <TodayMacroWatch today={day} preview={!!demo} />
          {symbols.length > 0 && (
            <div
              className="home-evidence-layout"
              data-calendar-empty={
                !eventGroups.length && !brief.reported.length
              }
            >
              <section
                className="home-evidence-panel home-events-panel"
                id="home-earnings"
                aria-label="Company earnings and events"
              >
                <SectionHead
                  title="Earnings & events"
                  subtitle={
                    eventGroups.length
                      ? "Next 7 days · held companies first on each date"
                      : undefined
                  }
                  className={homeStyles.calendarHeader}
                  action={
                    <button
                      className={homeStyles.calendarRefresh}
                      onClick={feed.refresh}
                      disabled={feed.loading}
                      aria-label="Refresh company events"
                      title={
                        feed.data?.retrievedAt
                          ? `Updated ${quoteTime(feed.data.retrievedAt)}`
                          : "Refresh events"
                      }
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
                                <span>
                                  {event.kind}
                                  {heldSymbols.has(event.symbol)
                                    ? " · Held"
                                    : ""}
                                </span>
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
                  <p className={homeStyles.calendarState} role="status">
                    <span>
                      {feed.loading
                        ? "Checking dated events for the next 7 days…"
                        : !calendarReady
                          ? "Calendar coverage is incomplete. Missing coverage does not mean no events."
                          : "No upcoming events returned for the next 7 days."}
                    </span>
                  </p>
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
                      These dates are available. Some company events could not
                      be checked.
                    </p>
                  )}
                {eventGroups.length > 0 && (feed.loading || feed.error) && (
                  <p className="home-source-note" role="status">
                    {feed.loading
                      ? "Checking events…"
                      : "Some events could not be checked."}
                  </p>
                )}
                {!feed.loading && !calendarReady && (
                  <button className="text-link" onClick={feed.refresh}>
                    Retry calendar <RefreshCw size={14} />
                  </button>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
      <div className={homeStyles.leadGrid}>
        <div className={homeStyles.dayOverview}>
          <div className={homeStyles.attentionColumn}>
            <ResearchInbox
              today={day}
              events={(feed.data?.events ?? []).filter(
                (event) =>
                  event.date <= day &&
                  !calendarKeys.has(`${event.symbol}:${event.date}`),
              )}
            />
          </div>
        </div>
      </div>
      {symbols.length > 0 && (
        <>
          <div className={homeStyles.updateFeed}>
            <section
              className="home-evidence-panel home-news-panel"
              aria-label="What changed"
            >
              <SectionHead
                title="What changed"
                action={
                  <div className={homeStyles.updateAction}>
                    {headlines.length > 0 && (
                      <span className="home-section-count">
                        {headlines.length} updates
                      </span>
                    )}
                    <Link href={`${prefix}/research`}>
                      Open research{" "}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                }
              />
              {secondaryHeadlines.length ? (
                <div className="home-news-list">
                  {secondaryHeadlines.slice(0, 6).map(renderHeadline)}
                </div>
              ) : (
                <p className={homeStyles.feedState} role="status">
                  {feed.loading
                    ? "Checking followed companies for updates…"
                    : feed.error || !readiness.newsReady
                      ? "News coverage is incomplete. Retry to check missing sources."
                      : spotlight
                        ? "The selected update is in today’s story."
                        : "No recent company-matched headlines returned."}
                </p>
              )}
              {secondaryHeadlines.length > 6 && (
                <details className="home-more-updates">
                  <summary>
                    Show {secondaryHeadlines.length - 6} more updates
                  </summary>
                  <div className="home-news-list">
                    {secondaryHeadlines.slice(6).map(renderHeadline)}
                  </div>
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
          </div>
        </>
      )}
      <HomeMarketCards
        symbols={symbols}
        quotes={quotes.data}
        research={loadedResearch}
        prefix={prefix}
        quoteContext={symbols.length ? <Coverage state={state} /> : null}
      />
      <HomeQuarterHighlights
        research={loadedResearch}
        asOf={today.toISOString()}
        prefix={prefix}
      />
      <section className={homeStyles.researchTools} aria-label="Research tools">
        <nav
          className={homeStyles.workspaceShortcuts}
          aria-label="Workspace shortcuts"
        >
          <Link
            className={homeStyles.workspaceLink}
            href={`${prefix}/portfolio`}
          >
            Portfolio <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link
            className={homeStyles.workspaceLink}
            href={`${prefix}/monthly-plan`}
            aria-label="Build this month’s research plan"
          >
            Monthly plan <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
        <div className={homeStyles.actionGrid}>
          <ContributionCompare symbols={symbols} prefix={prefix} />
          {symbols.length > 0 && (
            <details
              className={homeStyles.marketRadar}
              open={radarOpen}
              onToggle={(event) => setRadarOpen(event.currentTarget.open)}
            >
              <summary>
                Market radar{" "}
                <span>
                  {symbols.length} held or watched · daily price history
                </span>
              </summary>
              {radarOpen && (
                <HomeRadar
                  research={loadedResearch}
                  requested={symbols}
                  prefix={prefix}
                  demo={!!demo}
                  asOf={day}
                />
              )}
            </details>
          )}
        </div>
      </section>
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
      <CompanySparkline symbol={symbol} withinLink />
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
