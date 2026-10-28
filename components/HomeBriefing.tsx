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
import CompanySparkline from "./CompanySparkline";
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
  const demoClock = demo
    ? Object.values(demo.research)[0]?.retrievedAt
    : undefined;
  const now =
      demoClock && Number.isFinite(Date.parse(demoClock))
        ? new Date(demoClock)
        : new Date(),
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
  const observed = Object.values(q)
    .map((v) => v.asOf)
    .filter((v): v is string => !!v)
    .sort()
    .at(-1);
  const focusSymbol = brief.symbol ?? ordered[0];
  const eventRows = [...(events.data?.events ?? [])]
    .filter(
      (e) =>
        symbols.includes(e.symbol) &&
        e.date >= today &&
        Date.parse(e.date) <= now.getTime() + 30 * 86400000,
    )
    .filter(
      (e, i, rows) =>
        rows.findIndex(
          (x) =>
            x.symbol === e.symbol && x.date === e.date && x.kind === e.kind,
        ) === i,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const maxImpact = Math.max(1, ...day.moves.map((m) => Math.abs(m.impact)));
  const attention = [...exposure].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <section className="briefing-home" data-composition={composition}>
      <header className="briefing-greeting experience-greeting">
        <div>
          <span className="briefing-kicker">YOUR INVESTMENT WORKSPACE</span>
          <h1>
            {greeting}
            {displayName ? `, ${displayName}` : ""}.
          </h1>
          <p>
            {composition === "holdings"
              ? "Your companies. Your exposure. What deserves a closer look."
              : composition === "watchlist"
                ? "Your ideas, with the evidence that matters."
                : "Your next idea starts with understanding."}
          </p>
        </div>
        <span className="briefing-date">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            timeZone: "America/Chicago",
          }).format(now)}
          <small>
            Central time{observed ? ` · Quotes ${quoteTime(observed)}` : ""}
          </small>
        </span>
      </header>
      <div className="briefing-system-strip" aria-label="AURYN decision system">
        <span className="briefing-system-label">AURYN DECISION SYSTEM</span>
        <span>Business</span>
        <b aria-hidden="true">→</b>
        <span>Value</span>
        <b aria-hidden="true">→</b>
        <span>Risk</span>
        <b aria-hidden="true">→</b>
        <span>Pace</span>
        <small>Then decide what deserves your attention.</small>
      </div>
      {composition === "first-use" && workspace ? (
        <>
          <section className="briefing-welcome">
            <div>
              <span className="briefing-kicker">MAKE THIS SPACE YOURS</span>
              <h2>
                Find great businesses.
                <br />
                <em>Build your perspective.</em>
              </h2>
              <p>
                Start with a company you know. See its business, price and
                timing together, then keep the ideas you want to follow.
              </p>
              <Link href={`${prefix}/research`} className="button primary">
                Find your first company <ArrowRight size={17} />
              </Link>
              <small>
                No portfolio required. Your account starts with your own
                choices.
              </small>
            </div>
            <div className="briefing-start-map">
              <span>YOUR RESEARCH PATH</span>
              <section>
                <b>01</b>
                <div>
                  <strong>Understand the business</strong>
                  <p>Growth, cash generation and the risks.</p>
                </div>
              </section>
              <section>
                <b>02</b>
                <div>
                  <strong>Put the price in perspective</strong>
                  <p>Scenarios and the assumptions behind them.</p>
                </div>
              </section>
              <section>
                <b>03</b>
                <div>
                  <strong>Know what to revisit</strong>
                  <p>Save ideas and watch the next checkpoint.</p>
                </div>
              </section>
            </div>
          </section>
          <div className="briefing-start-paths">
            <section>
              <h3>Keep your ideas close.</h3>
              <p>Follow companies without adding holdings.</p>
              <Link href={`${prefix}/watchlist`}>Build your watchlist →</Link>
            </section>
            <section>
              <h3>Connect the view to your money.</h3>
              <p>
                Add holdings when you're ready to see exposure and portfolio
                context.
              </p>
              <Link href={`${prefix}/portfolio`}>
                Add holdings · optional →
              </Link>
            </section>
          </div>
        </>
      ) : (
        <>
          <section className="home-wealth-strip" aria-label="Portfolio at a glance">
            <div className="home-wealth-main"><span>{composition === "holdings" ? "PRICED INVESTMENTS · USD" : "YOUR RESEARCH UNIVERSE"}</span>
              <strong>{composition === "holdings" ? (pricedTotal > 0 ? amount(pricedTotal) : "Awaiting prices") : ordered.length}</strong>
              <small>{composition === "holdings" ? "Excludes cash, margin and managed balances" : "Companies you follow"}</small>
            </div>
            {composition === "holdings" ? <div><span>{day.session ? `SESSION · ${dateLabel(day.session)}` : "SESSION CHANGE"}</span><strong className={day.net==null?'neutral':day.net<0?'negative':'positive'}>{day.net!=null?amount(day.net):"Quotes updating"}</strong><small>{day.covered} of {day.total} USD equities · current units</small></div> : <div><span>PORTFOLIO CONTEXT</span><strong>No holdings yet</strong><small>Add positions when you're ready</small></div>}
            <div><span>YOUR FOCUS</span><strong>{ordered.length}<small> companies</small></strong><small>{positions.length} holdings · {workspace?.watchlist.length ?? 0} watchlist ideas</small></div>
            <Link className="home-wealth-link" href={`${prefix}/${composition==='holdings'?'portfolio':'watchlist'}`}>{composition==='holdings'?'View portfolio':'Open watchlist'}<ArrowUpRight size={17}/></Link>
          </section>
          <section className="home-daily-brief" aria-label="Your daily briefing">
            <div className="home-brief-mark" aria-hidden="true">A<span>✦</span></div>
            <div className="home-brief-copy"><span>THE AURYN BRIEF · {brief.kind === 'earnings'?'UPCOMING EARNINGS':brief.kind==='news'?'COMPANY UPDATE':'YOUR NEXT CHECK-IN'}</span><h2>{brief.title}</h2><p>{brief.detail}</p><small>{brief.status}</small></div>
            <Link href={heroHref}>{brief.action}<ArrowRight size={18}/></Link>
          </section>
          <div className="briefing-evidence-grid">
            <section className="briefing-panel briefing-moves">
              <header>
                <h2>
                  {composition === "holdings"
                    ? "Session contributors"
                    : "Price changes"}
                </h2>
                <Link
                  href={
                    composition === "holdings"
                      ? `${prefix}/portfolio`
                      : `${prefix}/watchlist`
                  }
                >
                  View all →
                </Link>
              </header>
              {composition === "holdings" && day.moves.length ? (
                <>
                  {day.moves.slice(0, 5).map((m) => (
                    <Link
                      key={m.symbol}
                      className="briefing-impact-row"
                      href={companyHref(m.symbol)}
                    >
                      <span>{m.symbol}</span>
                      <i aria-hidden="true">
                        <b
                          style={{
                            width: `${(Math.abs(m.impact) / maxImpact) * 100}%`,
                            background:
                              m.impact < 0 ? "var(--red)" : "var(--green)",
                          }}
                        />
                      </i>
                      <strong
                        className={m.impact < 0 ? "negative" : "positive"}
                      >
                        {amount(m.impact, "USD")}
                      </strong>
                    </Link>
                  ))}
                  <p className="briefing-note">
                    Estimated price-reference change on current units. Excludes
                    trades, cash flows, fees and crypto; dates are not combined.
                  </p>
                </>
              ) : (
                <>
                  {ordered.slice(0, 5).map((s) => (
                    <Link
                      className="briefing-compact-row"
                      key={s}
                      href={companyHref(s)}
                    >
                      <SecurityLogo symbol={s} size={27} />
                      <b>{s}</b>
                      <span>
                        {amount(q[s]?.price ?? null, q[s]?.currency ?? "USD")}
                      </span>
                      <strong
                        className={
                          q[s]?.changePct == null
                            ? "neutral"
                            : q[s].changePct! < 0
                              ? "negative"
                              : "positive"
                        }
                      >
                        {percent(q[s]?.changePct ?? null, true)}
                      </strong>
                    </Link>
                  ))}
                  <p className="briefing-note">
                    Dated quote changes. Missing changes are not zero returns.
                  </p>
                </>
              )}
            </section>
            <section className="briefing-panel briefing-attention">
              <header>
                <h2>
                  {composition === "holdings"
                    ? "Exposure to revisit"
                    : "Keep your thesis honest"}
                </h2>
                <span className="briefing-mini-icon">
                  <PieChart size={18} />
                </span>
              </header>
              {composition === "holdings" && attention.length ? (
                attention.map(([s, v], i) => (
                  <Link
                    className="briefing-attention-row"
                    href={companyHref(s)}
                    key={s}
                  >
                    <span className="briefing-step">0{i + 1}</span>
                    <div>
                      <strong>{s}</strong>
                      <small>{names[s] ?? s}</small>
                    </div>
                    <strong>{percent((v / pricedTotal) * 100)}</strong>
                  </Link>
                ))
              ) : (
                <>
                  <p>What would change your view of a company?</p>
                  <ul className="briefing-review-list">
                    <li>Growth and cash generation</li>
                    <li>Valuation assumptions</li>
                    <li>Funding and dilution</li>
                  </ul>
                  <Link href={`${prefix}/watchlist`}>
                    Revisit your followed companies →
                  </Link>
                </>
              )}
              <p className="briefing-note">
                {composition === "holdings"
                  ? "Share of priced USD investments. Review common drivers as well as ticker concentration."
                  : "Price strength alone does not establish business quality."}
              </p>
            </section>
            <section
              className="briefing-panel briefing-calendar"
              id="home-upcoming"
            >
              <header>
                <h2>Next on your calendar</h2>
                <CalendarDays size={18} />
              </header>
              {eventRows.length ? (
                <div className="briefing-calendar-list">
                  {eventRows.slice(0, 4).map((e, i) => (
                    <Link
                      href={companyHref(e.symbol)}
                      key={`${e.symbol}-${e.date}-${i}`}
                    >
                      <time dateTime={e.date}>
                        <b>
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            timeZone: "UTC",
                          }).format(Date.parse(e.date))}
                        </b>
                        {e.date.slice(-2)}
                      </time>
                      <div>
                        <strong>{e.symbol}</strong>
                        <small>
                          {e.kind} · {names[e.symbol] ?? e.symbol}
                        </small>
                      </div>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="briefing-quiet-state">
                  <CalendarDays size={24} />
                  <strong>
                    {events.loading
                      ? "Checking upcoming dates"
                      : "Time for a business check-in"}
                  </strong>
                  <p>
                    {events.error
                      ? "Dates could not be checked. Company research remains available."
                      : "Review recent operating progress while the next dated event takes shape."}
                  </p>
                </div>
              )}
              {eventRows.length > 4 && (
                <details className="briefing-more-events">
                  <summary>See all {eventRows.length} upcoming events</summary>
                  {eventRows.slice(4).map((e, i) => (
                    <Link key={`${e.symbol}-${i}`} href={companyHref(e.symbol)}>
                      {dateLabel(e.date)} · {e.symbol} · {e.kind}
                    </Link>
                  ))}
                </details>
              )}
            </section>
          </div>
          <div className="briefing-main-grid">
            <section
              className="briefing-panel briefing-changes"
              id="home-company-headlines"
            >
              <header>
                <div>
                  <span className="briefing-kicker">THE LATEST EVIDENCE</span>
                  <h2>Latest company news</h2>
                </div>
                <span className="briefing-count">
                  {allHeadlines.length} matching headlines · {newsCompanies}{" "}
                  companies covered
                </span>
              </header>
              <p className="briefing-coverage">
                Published updates for your held and followed companies
                {newsTime ? ` · Checked ${quoteTime(newsTime)}` : ""}.
              </p>
              {headlines.length ? (
                <div
                  className="briefing-news-list"
                  data-expanded={expandedNews}
                >
                  {headlines.map((n, i) => (
                    <article key={`${n.symbol}-${n.url}-${i}`}>
                      <Link
                        className="briefing-news-company"
                        href={companyHref(n.symbol)}
                      >
                        <SecurityLogo symbol={n.symbol} size={34} />
                        <span>
                          <strong>{n.symbol}</strong>
                          <small>{names[n.symbol] ?? n.symbol}</small>
                        </span>
                      </Link>
                      <div className="briefing-news-story">
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {n.title}
                          <ArrowUpRight size={14} />
                        </a>
                        <span className="briefing-news-meta">
                          {replySources(n.url)} ·{" "}
                          <time dateTime={n.date}>{dateLabel(n.date)}</time>
                          {exposure.has(n.symbol) && pricedTotal > 0
                            ? ` · ${percent((exposure.get(n.symbol)! / pricedTotal) * 100)} of priced investments`
                            : ""}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="briefing-quiet-state">
                  <FileText size={24} />
                  <strong>
                    {news.loading
                      ? "Checking company updates"
                      : "Continue with the business evidence"}
                  </strong>
                  <p>
                    {news.error
                      ? "News could not be checked right now."
                      : "No matching recent headlines returned for this group."}
                  </p>
                  <Link href={`${prefix}/research`}>
                    Continue your research →
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
              {feed.pageCount > 1 && (
                <button
                  className="briefing-text-button"
                  onClick={() => setPage((page + 1) % feed.pageCount)}
                >
                  Company group {feed.page + 1} of {feed.pageCount} · Next →
                </button>
              )}
              {evidenceUnavailable && (
                <p className="briefing-note">
                  Some company evidence could not be checked. This does not mean
                  nothing changed.
                </p>
              )}
            </section>
            <section className="briefing-panel briefing-companies">
              <header>
                <h2>Your companies</h2>
                <Link
                  href={
                    composition === "holdings"
                      ? `${prefix}/portfolio`
                      : `${prefix}/watchlist`
                  }
                >
                  View all →
                </Link>
              </header>
              <div className="briefing-company-grid">
                {ordered.slice(0, 8).map((s) => {
                  const quote = q[s];
                  return (
                    <Link key={s} href={companyHref(s)}>
                      <SecurityLogo symbol={s} size={31} />
                      <span className="briefing-company-name">
                        <strong>{s}</strong>
                        <small>{names[s] ?? s}</small>
                      </span>
                      <CompanySparkline symbol={s} />
                      <span className="briefing-company-value">
                        <strong>
                          {quote?.price != null &&
                          Number.isFinite(quote.price) &&
                          quote.price > 0
                            ? amount(quote.price, quote.currency)
                            : "Check quote"}
                        </strong>
                        <small
                          data-direction={
                            quote?.changePct == null
                              ? "neutral"
                              : quote.changePct < 0
                                ? "down"
                                : quote.changePct > 0
                                  ? "up"
                                  : "neutral"
                          }
                          className={
                            quote?.changePct == null
                              ? "neutral"
                              : quote.changePct < 0
                                ? "negative"
                                : "positive"
                          }
                        >
                          {quote?.changePct == null
                            ? "Change unavailable"
                            : percent(quote.changePct, true)}
                        </small>
                        <small>
                          {quote?.stale ? "Last available · " : ""}
                          {quote?.asOf
                            ? quoteTime(quote.asOf)
                            : "Awaiting dated quote"}
                        </small>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
      {(error || workspaceError) && (
        <Notice error>{error || workspaceError}</Notice>
      )}
    </section>
  );
}
