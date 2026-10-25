"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ArrowRight,
  PieChart,
  FileText,
  Clock3,
} from "lucide-react";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Notice } from "./Ui";
import { amount, percent, quoteTime, dateLabel } from "@/lib/format";
import { homeComposition } from "@/lib/home-presentation";
import { homeDay } from "@/lib/home-day";
import { homeBrief, dailyPerspective } from "@/lib/home-brief";
import { companyFeedPage, holdingAttention } from "@/lib/product-attention";
import { relevantHoldingHeadlines, type HomeFeed } from "@/lib/home-feed";
import type { Company, Quote } from "@/lib/types";
type Rows = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export default function HomeBriefing({
  quotes,
  error,
}: {
  quotes: Rows;
  error?: string;
}) {
  const { workspace, demo, workspaceError, displayName } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const [page, setPage] = useState(0),
    [expandedNews, setExpandedNews] = useState(false);
  const now = new Date(),
    asOf = now.toISOString();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const positions =
    workspace?.positions.filter((p) => p.assetType !== "cash") ?? [];
  const symbols = [
    ...new Set([
      ...positions.map((p) => p.symbol),
      ...(workspace?.watchlist.map((p) => p.symbol) ?? []),
    ]),
  ];
  const q = Object.fromEntries(
    Object.entries(quotes).flatMap(([s, r]) => (r.quote ? [[s, r.quote]] : [])),
  );
  const names = Object.fromEntries(
    Object.entries(quotes).flatMap(([s, r]) =>
      r.company?.name ? [[s, r.company.name]] : [],
    ),
  );
  const exposure = new Map<string, number>();
  for (const p of positions) {
    const quote = q[p.symbol],
      at = Date.parse(quote?.asOf ?? "");
    if (
      p.currency !== "USD" ||
      quote?.currency !== "USD" ||
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      quote.price == null ||
      !Number.isFinite(quote.price) ||
      quote.price <= 0 ||
      !Number.isFinite(at) ||
      at > now.getTime() + 60000 ||
      now.getTime() - at > 4 * 86400000
    )
      continue;
    exposure.set(
      p.symbol,
      (exposure.get(p.symbol) ?? 0) + p.quantity * quote.price,
    );
  }
  const ordered = [...symbols].sort(
    (a, b) =>
      (exposure.get(b) ?? 0) - (exposure.get(a) ?? 0) || a.localeCompare(b),
  );
  const feed = companyFeedPage(
      ordered.filter((s) => !s.includes("/")),
      page,
    ),
    key = [...feed.symbols].sort().join(",");
  const preview = useMemo(
    () =>
      demo
        ? ({
            events: [],
            news: [],
            issues: [],
            retrievedAt: "",
            followed: 0,
            newsFollowed: 0,
          } as HomeFeed)
        : undefined,
    [demo],
  );
  const events = useResource<HomeFeed>(
    key ? `home-feed?kind=events&symbols=${encodeURIComponent(key)}` : null,
    preview,
    21600000,
  );
  const news = useResource<HomeFeed>(
    key ? `home-feed?kind=news&symbols=${encodeURIComponent(key)}` : null,
    preview,
    3600000,
  );
  const allHeadlines = relevantHoldingHeadlines(
    news.data?.news ?? [],
    names,
    exposure,
  ).filter((n) => {
    const at = Date.parse(n.date);
    return (
      /^https?:\/\//.test(n.url) &&
      at <= now.getTime() + 60000 &&
      at >= now.getTime() - 7 * 86400000
    );
  });
  const brief = homeBrief({
    today,
    symbols: ordered,
    names,
    events: events.data?.events ?? [],
    headlines: allHeadlines,
    exposure,
    eventsReady: !!events.data && !events.error && !events.data.issues?.length,
    newsReady: !!news.data && !news.error && !news.data.issues?.length,
  });
  const day = homeDay(
    workspace?.positions ?? [],
    q,
    events.data?.events ?? [],
    asOf,
  );
  const calendar = holdingAttention(
    workspace?.positions ?? [],
    q,
    events.data?.events ?? [],
    today,
  ).sort((a, b) => a.date.localeCompare(b.date));
  const pricedTotal = [...exposure.values()].reduce((n, v) => n + v, 0),
    largest = [...exposure].sort((a, b) => b[1] - a[1])[0];
  const companyHref = (s: string) =>
    `${prefix}/research/${encodeURIComponent(s.replace("/", "-"))}`;
  const heroHref =
    brief.kind === "start"
      ? `${prefix}/research`
      : brief.kind === "review"
        ? positions.length
          ? `${prefix}/portfolio`
          : `${prefix}/watchlist`
        : brief.symbol
          ? companyHref(brief.symbol)
          : `${prefix}/research`;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Chicago",
    }).format(now),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const newsCompanies = new Set(allHeadlines.map((n) => n.symbol)).size;
  const headlines = expandedNews ? allHeadlines : allHeadlines.slice(0, 3);
  const newsTime = news.data?.retrievedAt;
  const earningsSymbols = new Set(
    brief.checkpoints
      .filter((e) => /earnings/i.test(e.kind))
      .map((e) => e.symbol),
  );
  const heldSymbols = new Set(positions.map((p) => p.symbol));
  const heldEarnings = [...earningsSymbols].filter((s) => heldSymbols.has(s));
  const readiness = events.loading || news.loading;
  const evidenceUnavailable = !!(
    events.error ||
    news.error ||
    events.data?.issues?.length ||
    news.data?.issues?.length
  );
  const composition = homeComposition(
    positions.length,
    workspace?.watchlist.length ?? 0,
  );
  const replySources = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Published update";
    }
  };
  if (composition === "first-use" && workspace)
    return (
      <section className="briefing-home briefing-first-use">
        <header className="briefing-greeting">
          <span className="briefing-kicker">YOUR DAILY PERSPECTIVE</span>
          <h1>
            {greeting}
            {displayName ? `, ${displayName}` : ""}.
          </h1>
          <p className="briefing-thought">
            Your next idea starts with understanding.
          </p>
        </header>
        <section className="briefing-welcome">
          <span className="briefing-kicker">WELCOME TO AURYN</span>
          <h2>Find a business. Understand the opportunity.</h2>
          <p>
            Start with a company you know. Explore its business, put the price
            in perspective and see what would change the view.
          </p>
          <Link href={`${prefix}/research`} className="button primary">
            Find your first company <ArrowRight size={17} />
          </Link>
          <small>
            No portfolio required. Your account starts with your own choices.
          </small>
        </section>
        <div className="briefing-start-paths">
          <section>
            <span>01 · AURYN VIEW</span>
            <h3>See the whole case.</h3>
            <p>
              Business evidence, price assumptions and the strongest
              counter-case together.
            </p>
            <Link href={`${prefix}/research`}>Explore company research →</Link>
          </section>
          <section>
            <span>02 · WATCHLIST</span>
            <h3>Keep your ideas close.</h3>
            <p>
              Save companies to follow their news, reports and price conditions.
            </p>
            <Link href={`${prefix}/watchlist`}>Open your watchlist →</Link>
          </section>
          <section>
            <span>03 · YOUR PORTFOLIO</span>
            <h3>Bring your own perspective.</h3>
            <p>
              Add holdings when you want to understand your exposure and event
              risk.
            </p>
            <Link href={`${prefix}/portfolio`}>Add holdings when ready →</Link>
          </section>
        </div>
        <p className="briefing-quiet-note">
          Research explains the evidence. You decide what fits your goals.
        </p>
      </section>
    );
  return (
    <section className="briefing-home">
      <header className="briefing-greeting">
        <span className="briefing-kicker">YOUR DAILY PERSPECTIVE</span>
        <h1>
          {greeting}
          {displayName ? `, ${displayName}` : ""}.
        </h1>
        <p className="briefing-thought">Your companies. What matters today.</p>
        <p className="briefing-date">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "America/Chicago",
          })}{" "}
          <span>· Your time: Central</span>
        </p>
      </header>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {error && <Notice error>{error}</Notice>}
      <section
        className="briefing-lead"
        aria-label="Your next research checkpoint"
      >
        <div>
          <span className="briefing-kicker">
            {brief.kind === "earnings"
              ? "YOUR EARNINGS CHECKPOINT"
              : "IN FOCUS TODAY"}
          </span>
          <h2>
            {composition === "watchlist" && brief.kind === "review"
              ? "Keep your next idea in focus."
              : brief.title}
          </h2>
          <p>
            {composition === "watchlist" && brief.kind === "review"
              ? "Review your followed companies, revisit the assumptions and watch for new evidence."
              : brief.detail}
          </p>
          <Link href={heroHref}>
            Open the evidence <ArrowRight size={16} />
          </Link>
        </div>
        <div className="briefing-lead-note">
          <span>AURYN CHECKPOINTS</span>
          <strong>What would change your view?</strong>
          <p>
            {composition === "watchlist"
              ? "Follow business progress, upcoming reports and the assumptions behind each idea."
              : "Review the events and company developments that matter to the money you have invested."}
          </p>
        </div>
      </section>
      <section
        className="home-evidence-pulse"
        aria-label="Your evidence pulse"
        aria-busy={readiness}
      >
        <a href="#home-company-headlines">
          <span>Company developments</span>
          <strong>
            {news.loading
              ? "Checking…"
              : !news.data || news.error
                ? "Not available"
                : `${allHeadlines.length} headlines`}
          </strong>
          <small>{feed.symbols.length} companies in this group</small>
        </a>
        <a href="#home-upcoming">
          <span>Turning points</span>
          <strong>
            {events.loading
              ? "Checking…"
              : !events.data || events.error
                ? "Not available"
                : `${brief.checkpoints.length} events`}
          </strong>
          <small>Next 7 days · current company group</small>
        </a>
        {composition === "holdings" ? (
          <Link href={`${prefix}/portfolio`}>
            <span>Your exposure</span>
            <strong>
              {largest && pricedTotal > 0
                ? `${percent((largest[1] / pricedTotal) * 100)} in ${largest[0]}`
                : "Add your holdings"}
            </strong>
            <small>Largest share of priced USD investments</small>
          </Link>
        ) : (
          <Link href={`${prefix}/watchlist`}>
            <span>Your research universe</span>
            <strong>{ordered.length} followed companies</strong>
            <small>News and events for your saved ideas</small>
          </Link>
        )}
      </section>
      <div className="briefing-main-grid">
        <section
          className="briefing-panel briefing-changes"
          aria-label="Company updates"
        >
          <header>
            <div>
              <span className="briefing-kicker">THE LATEST EVIDENCE</span>
              <h2>Latest company news</h2>
            </div>
            <span className="briefing-count">
              {allHeadlines.length} updates
            </span>
          </header>
          <p className="briefing-coverage">
            {allHeadlines.length} matching headlines · {newsCompanies} companies
            · {feed.symbols.length} companies requested in this group
            {newsTime ? ` · Checked ${quoteTime(newsTime)}` : ""}
          </p>
          {headlines.length ? (
            <div
              className="briefing-news-list"
              id="home-company-headlines"
              data-expanded={expandedNews}
            >
              {headlines.map((n, i) => (
                <article key={`${n.symbol}-${n.url}-${i}`}>
                  <Link
                    className="briefing-news-company"
                    href={companyHref(n.symbol)}
                  >
                    <SecurityLogo symbol={n.symbol} size={38} />
                    <span>
                      <strong>{n.symbol}</strong>
                      <small>{names[n.symbol] ?? n.symbol}</small>
                    </span>
                  </Link>
                  <div className="briefing-news-story">
                    <span className="briefing-tag">{replySources(n.url)}</span>
                    <a href={n.url} target="_blank" rel="noopener noreferrer">
                      {n.title}
                      <ArrowUpRight size={15} />
                    </a>
                    <time dateTime={n.date}>{dateLabel(n.date)}</time>
                    <small className="briefing-relevance">
                      {exposure.has(n.symbol)
                        ? "Relevant to a company you hold. Review the full report before changing your thesis."
                        : "From your followed companies. Check the details against your research."}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="briefing-empty">
              <FileText size={25} />
              <p>
                {news.loading
                  ? "Looking for company updates…"
                  : news.error
                    ? "Company news is temporarily unavailable."
                    : "No matching recent headlines returned for this company group."}
              </p>
              <Link
                href={
                  brief.symbol
                    ? companyHref(brief.symbol)
                    : `${prefix}/research`
                }
              >
                Continue your research <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {allHeadlines.length > 3 && (
            <button
              className="briefing-text-button"
              aria-expanded={expandedNews}
              aria-controls="home-company-headlines"
              onClick={() => setExpandedNews(!expandedNews)}
            >
              {expandedNews
                ? "Show highlights"
                : `View all ${allHeadlines.length} updates →`}
            </button>
          )}
          {!!news.data?.issues?.length && (
            <p className="briefing-coverage" role="status">
              Some company updates could not be checked.
            </p>
          )}
          {feed.pageCount > 1 && (
            <button
              className="briefing-text-button"
              onClick={() => setPage((page + 1) % feed.pageCount)}
            >
              Company group {feed.page + 1} of {feed.pageCount} · Next →
            </button>
          )}
        </section>
        <section className="briefing-panel briefing-attention">
          <header>
            <div>
              <span className="briefing-kicker">YOUR NEXT STEPS</span>
              <h2>Needs your attention</h2>
            </div>
          </header>
          <Link
            className="briefing-action-row"
            href={
              heldEarnings[0]
                ? companyHref(heldEarnings[0])
                : composition === 'holdings' ? `${prefix}/portfolio` : `${prefix}/watchlist`
            }
          >
            <span className="briefing-step">01</span>
            <div>
              <strong>
                {heldEarnings.length
                  ? "Prepare for earnings"
                  : composition === 'holdings' ? "Review concentration" : "Revisit your followed companies"}
              </strong>
              <p>
                {heldEarnings.length
                  ? `${heldEarnings.length} held ${heldEarnings.length === 1 ? "company reports" : "companies report"} in the next 7 days.`
                  : largest && pricedTotal > 0
                    ? `${largest[0]} is ${percent((largest[1] / pricedTotal) * 100)} of priced USD investments.`
                    : "Review the business evidence and the assumptions behind each saved idea."}
              </p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
          <Link
            className="briefing-action-row"
            href="#home-upcoming"
            data-accent="1"
          >
            <span className="briefing-step">02</span>
            <div>
              <strong>Check upcoming dates</strong>
              <p>
                {brief.checkpoints.length
                  ? `${brief.checkpoints.length} dated ${brief.checkpoints.length === 1 ? "event" : "events"} in the next 7 days.`
                  : readiness
                    ? "Checking available company events…"
                    : brief.status}
              </p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
          <Link
            className="briefing-action-row"
            href={
              brief.symbol ? companyHref(brief.symbol) : `${prefix}/research`
            }
            data-accent="2"
          >
            <span className="briefing-step">03</span>
            <div>
              <strong>Continue your research</strong>
              <p>
                {brief.symbol
                  ? `Open ${names[brief.symbol] ?? brief.symbol} and review the supporting evidence.`
                  : "Find your first company and make this view yours."}
              </p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
          <p className="briefing-coverage">
            Based on available holdings and evidence. Exposure excludes unpriced
            assets, cash, margin debt and managed balances.
          </p>
        </section>
      </div>
      {composition === "holdings" && (
        <section className="briefing-session" aria-label="Session coverage">
          <div>
            <span className="briefing-kicker">MARKET SNAPSHOT</span>
            <h2>
              {day.net == null
                ? "Waiting for comparable session data"
                : `${amount(day.net, "USD")} estimated ${day.covered < day.total ? "partial " : ""}session move`}
            </h2>
            <p>
              {day.covered} of {day.total} USD equity holdings with comparable
              changes{day.session ? ` · ${dateLabel(day.session)}` : ""}
            </p>
            <div
              className="briefing-progress"
              role="progressbar"
              aria-label="Comparable quote coverage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                day.total ? Math.round((day.covered / day.total) * 100) : 0
              }
            >
              <span
                style={{
                  width: `${day.total ? (day.covered / day.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="briefing-contributors">
            {day.moves.length ? (
              <>
                <span className="briefing-kicker">
                  LARGEST CONTRIBUTORS · CURRENT UNITS
                </span>
                {day.moves.slice(0, 3).map((m) => (
                  <Link
                    key={m.symbol}
                    href={companyHref(m.symbol)}
                    data-direction={
                      m.impact < 0 ? "down" : m.impact > 0 ? "up" : "neutral"
                    }
                  >
                    <b>{m.symbol}</b>
                    <i>
                      <span
                        style={{
                          width: `${(Math.abs(m.impact) / Math.max(1, ...day.moves.map((x) => Math.abs(x.impact)))) * 100}%`,
                        }}
                      />
                    </i>
                    <strong>{amount(m.impact, "USD")}</strong>
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Clock3 size={25} />
                <strong>Comparable changes are not available yet.</strong>
                <p>
                  Quotes may still appear in your portfolio. Missing changes are
                  not zero returns.
                </p>
              </>
            )}
          </div>
          <p className="briefing-session-note">
            Estimated price-reference change on current recorded units, not
            brokerage P&amp;L. Excludes trades, cash flows, fees and crypto.
            Different observation dates are not combined.
          </p>
        </section>
      )}
      <section className="briefing-panel briefing-calendar" id="home-upcoming">
        <header>
          <div>
            <span className="briefing-kicker">LOOK AHEAD</span>
            <h2>Next on your calendar</h2>
          </div>
          <span className="briefing-count">
            Next 30 days · current company group
          </span>
        </header>
        {calendar.length ? (
          <div className="briefing-calendar-grid">
            {calendar.slice(0, 6).map((e, i) => (
              <Link
                href={companyHref(e.symbol)}
                key={`${e.symbol}-${e.date}-${i}`}
              >
                <span className="briefing-calendar-date">
                  <CalendarDays size={19} />
                  <time dateTime={e.date}>{dateLabel(e.date)}</time>
                </span>
                <strong>{names[e.symbol] ?? e.symbol}</strong>
                <small>{e.kind}</small>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="briefing-empty">
            {events.loading
              ? "Checking company events…"
              : events.error || events.data?.issues?.length
                ? "Company events are temporarily unavailable."
                : "No upcoming dated events returned for this company group."}
          </p>
        )}
        {evidenceUnavailable && (
          <p className="briefing-coverage">
            Some evidence could not be checked. This does not mean nothing
            changed.
          </p>
        )}
      </section>
      <section className="briefing-panel briefing-companies">
        <header>
          <div>
            <span className="briefing-kicker">KEEP THE BUSINESS IN VIEW</span>
            <h2>Your companies</h2>
          </div>
          <Link href={composition === 'holdings' ? `${prefix}/portfolio` : `${prefix}/watchlist`}>
            {composition === 'holdings' ? 'View portfolio' : 'View watchlist'} <ArrowRight size={15} />
          </Link>
        </header>
        {ordered.length ? (
          <div className="briefing-company-grid">
            {ordered.slice(0, 8).map((s) => {
              const row = quotes[s],
                quote = row?.quote,
                valid =
                  quote?.price != null &&
                  Number.isFinite(quote.price) &&
                  quote.price > 0;
              return (
                <Link key={s} href={companyHref(s)}>
                  <SecurityLogo symbol={s} size={35} />
                  <span className="briefing-company-name">
                    <strong>{s}</strong>
                    <small>{names[s] ?? s}</small>
                  </span>
                  <span className="briefing-company-value">
                    <strong>
                      {valid
                        ? amount(quote!.price, quote!.currency)
                        : "Not priced"}
                    </strong>
                    <small
                      data-direction={
                        !Number.isFinite(quote?.changePct)
                          ? "neutral"
                          : quote!.changePct! < 0
                            ? "down"
                            : quote!.changePct! > 0
                              ? "up"
                              : "neutral"
                      }
                    >
                      {Number.isFinite(quote?.changePct)
                        ? percent(quote!.changePct, true)
                        : "Change unavailable"}
                    </small>
                    <small>
                      {quote
                        ? `${quote.stale ? "Last available · " : ""}${quoteTime(quote.asOf)}`
                        : "Waiting for quote"}
                    </small>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="briefing-empty">
            <p>Save a company or add a holding to begin.</p>
            <Link href={`${prefix}/research`}>
              Find your first company <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
