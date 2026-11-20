"use client";
import { useState } from "react";
import todayStyles from "./TodaySequence.module.css";
import TodaySequence from "./TodaySequence";
import ContributionCompare from "./ContributionCompare";
import HomeQuarterHighlights from "./HomeQuarterHighlights";
import HomeMarketCards from "./HomeMarketCards";
import HomeRadar from "./HomeRadar";
import ResearchInbox from "./ResearchInbox";
import { useHomeFeed } from "./useHomeFeed";
import { PaceBoard } from "./WorkspacePace";

import { researchLink } from "@/lib/approved-workspace";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { homeBrief } from "@/lib/home-brief";
import type { MarketEvent } from "@/lib/home-feed";
import {
  earningsEventState,
  groupMarketEvents,
  homeFeedReadiness,
  marketDay,
  relevantHoldingHeadlines,
} from "@/lib/home-feed";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import { ArrowUpRight, CalendarDays, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FeatureGate } from "./Access";
import CompanySparkline from "./CompanySparkline";
import homeStyles from "./HomeWorkspace.module.css";
import PortfolioDay from "./PortfolioDay";
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
  const [radarOpen, setRadarOpen] = useState(true);
  const state = useWorkspaceData(),
    { workspace, quotes, model, prefix, demo, pace } = state;
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
    <article key={`${news.symbol}:${news.url}`}>
      <div className="home-news-meta">
        <SecurityLogo symbol={news.symbol} />
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
        <ArrowUpRight size={17} />
      </a>
    </article>
  );
  return (
    <section
      className={`approved-workspace approved-home home-decision-view ${homeStyles.home}`}
    >
      <div className={todayStyles.hero}>
        <Heading
          title="Today"
          subtitle="Research priorities, upcoming events and what changed."
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
            <TodaySequence
              prefix={prefix}
              decision={
                best?.signal
                  ? {
                      symbol: best.symbol,
                      action: best.signal.view.actionLabel.replace(
                        / · P[0-4]$/,
                        "",
                      ),
                      code: best.signal.view.code,
                    }
                  : null
              }
              headline={null}
              concentration={null}
            />
          </div>
        </div>
        {symbols.length > 0 && (
          <div
            className="home-evidence-layout"
            data-calendar-empty={!eventGroups.length && !brief.reported.length}
          >
            <section
              className="home-evidence-panel home-events-panel"
              id="home-earnings"
              aria-label="Company earnings and events"
            >
              <SectionHead
                title="Earnings & events"
                subtitle="Recent results and the next 7 days. Held companies first within each date."
                action={
                  <button
                    className="icon-btn"
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
                                {heldSymbols.has(event.symbol) ? " · Held" : ""}
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
              {(feed.loading || feed.error) && (
                <p className="home-source-note" role="status">
                  {feed.loading
                    ? "Checking events…"
                    : "Some events could not be checked."}
                </p>
              )}
              {!feed.loading && !readiness.eventsReady && (
                <button className="text-link" onClick={feed.refresh}>
                  Retry calendar <RefreshCw size={14} />
                </button>
              )}
            </section>
          </div>
        )}
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
                  {headlines.slice(0, 6).map(renderHeadline)}
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
              {headlines.length > 6 && (
                <details className="home-more-updates">
                  <summary>Show {headlines.length - 6} more updates</summary>
                  <div className="home-news-list">
                    {headlines.slice(6).map(renderHeadline)}
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
          <PaceBoard {...state.paceScan} prefix={prefix} />
        </>
      )}
      {symbols.length > 0 && (
        <div className={homeStyles.quoteStatus}>
          <Coverage state={state} />
        </div>
      )}
      <HomeMarketCards
        symbols={symbols}
        quotes={quotes.data}
        research={loadedResearch}
        prefix={prefix}
      />
      <HomeQuarterHighlights
        research={loadedResearch}
        asOf={today.toISOString()}
        prefix={prefix}
      />
      {!!workspace?.positions.length && (
        <PortfolioDay
          compact
          positions={workspace.positions}
          quotes={quotes.data}
          prefix={prefix}
          now={today.getTime()}
        />
      )}
      <div className={homeStyles.planRow}>
        <div>
          <h2>Your next contribution</h2>
          <p>Review the evidence and position limits before adding.</p>
        </div>
        <Link className="btn" href={`${prefix}/monthly-plan`}>
          Build this month’s research plan →
        </Link>
      </div>
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
                {symbols.length} held or watched companies · daily price history
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
