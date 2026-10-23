"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight, CalendarDays, ArrowRight, Search } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Notice } from "./Ui";
import { amount, percent, quoteTime, dateLabel } from "@/lib/format";
import { homeDay } from "@/lib/home-day";
import { companyFeedPage, holdingAttention } from "@/lib/product-attention";
import { relevantHoldingHeadlines, type HomeFeed } from "@/lib/home-feed";
import type { Candle, Company, Quote } from "@/lib/types";
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
    prefix = demo ? "/preview" : "";
  const [selection, setSelection] = useState<{
    symbol: string;
    reason: string;
  } | null>(null);
  const [range, setRange] = useState("1Y"),
    [page, setPage] = useState(0),
    [expandedNews, setExpandedNews] = useState(false);
  const positions =
    workspace?.positions.filter((p) => p.assetType !== "cash") ?? [];
  const symbols = [
    ...new Set([
      ...positions.map((p) => p.symbol),
      ...(workspace?.watchlist.map((p) => p.symbol) ?? []),
    ]),
  ];
  const q = Object.fromEntries(
    Object.entries(quotes).flatMap(([symbol, row]) =>
      row.quote ? [[symbol, row.quote]] : [],
    ),
  );
  const names = Object.fromEntries(
    Object.entries(quotes).flatMap(([symbol, row]) =>
      row.company?.name ? [[symbol, row.company.name]] : [],
    ),
  );
  const exposure = new Map<string, number>();
  for (const p of positions) {
    const quote = q[p.symbol];
    const value =
      quote?.currency === p.currency &&
      p.currency === "USD" &&
      quote.price != null &&
      quote.price > 0 &&
      Number.isFinite(quote.price)
        ? p.quantity * quote.price
        : 0;
    exposure.set(p.symbol, (exposure.get(p.symbol) ?? 0) + value);
  }
  const orderedSymbols = [...symbols].sort(
    (a, b) =>
      (exposure.get(b) ?? 0) - (exposure.get(a) ?? 0) || a.localeCompare(b),
  );
  const feed = companyFeedPage(
      orderedSymbols.filter((s) => !s.includes("/")),
      page,
    ),
    key = feed.symbols.join(",");
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
  const now = new Date(),
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  const day = homeDay(
    workspace?.positions ?? [],
    q,
    events.data?.events ?? [],
    now.toISOString(),
  );
  const watchFocus = orderedSymbols.find((s) => q[s]?.price != null);
  const automatic = day.focus
    ? {
        symbol: day.focus.symbol,
        reason:
          day.focus.kind === "impact"
            ? `Largest estimated session impact · ${amount(day.focus.impact, "USD")}`
            : day.focus.kind === "event"
              ? `Upcoming company event · ${dateLabel(day.focus.date)}`
              : "Largest priced holding",
      }
    : watchFocus
      ? { symbol: watchFocus, reason: "A company on your watchlist" }
      : null;
  const choice =
    selection && symbols.includes(selection.symbol) ? selection : automatic;
  const symbol = choice?.symbol ?? "";
  useEffect(() => {
    if (!selection && automatic) setSelection(automatic);
  }, [selection, automatic?.symbol, automatic?.reason]);
  const previewHistory = useMemo(
    () =>
      demo ? { candles: demo.research[symbol]?.history ?? [] } : undefined,
    [demo, symbol],
  );
  const history = useResource<{ candles: Candle[] }>(
    symbol
      ? `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=1Y`
      : null,
    previewHistory,
    3600000,
  );
  const bars = (history.data?.candles ?? [])
    .filter((c) => Number.isFinite(c.close) && c.close > 0)
    .slice(range === "1M" ? -22 : range === "3M" ? -66 : -252);
  const min = Math.min(...bars.map((c) => c.close)),
    max = Math.max(...bars.map((c) => c.close)),
    spread = max - min || max * 0.01 || 1;
  const path = bars
    .map(
      (c, i) =>
        `${i ? "L" : "M"}${(10 + (i / Math.max(1, bars.length - 1)) * 480).toFixed(2)} ${(170 - ((c.close - min) / spread) * 135).toFixed(2)}`,
    )
    .join(" ");
  const calendar = holdingAttention(
    workspace?.positions ?? [],
    q,
    events.data?.events ?? [],
    today,
  ).sort((a, b) => a.date.localeCompare(b.date));
  const allHeadlines = relevantHoldingHeadlines(
      news.data?.news ?? [],
      names,
      exposure,
    ),
    headlines = expandedNews ? allHeadlines : allHeadlines.slice(0, 3);
  const newsCompanies = new Set(allHeadlines.map((n) => n.symbol)).size;
  const chosen = quotes[symbol]?.quote;
  const reviewSymbols = [
    ...new Set([...day.moves.map((m) => m.symbol), ...orderedSymbols]),
  ];
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Chicago",
    }).format(now),
  );
  const greeting =
    hour < 12
      ? "Good morning."
      : hour < 18
        ? "Good afternoon."
        : "Good evening.";
  return (
    <section className="briefing-home">
      <header className="briefing-greeting">
        <div>
          <span>YOUR DAILY PERSPECTIVE</span>
          <h1>
            {displayName
              ? `${greeting.slice(0, -1)}, ${displayName}.`
              : greeting}
          </h1>
          <p>
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "America/Chicago",
            })}
          </p>
        </div>
        <Link href={`${prefix}/research`} className="briefing-search">
          <Search size={17} />
          Find a company
        </Link>
      </header>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {error && <Notice error>{error}</Notice>}
      <section className="briefing-day" aria-label="Your latest session impact">
        <article
          data-tone={day.net != null && day.net < 0 ? "risk" : "positive"}
        >
          <span>
            {day.covered < day.total
              ? "Partial estimated move"
              : "Estimated session move"}
          </span>
          <strong>
            {day.net == null ? "Not available" : amount(day.net, "USD")}
          </strong>
          <small>
            {day.session
              ? `US observations · ${dateLabel(day.session)}`
              : "Dated quotes are needed"}
          </small>
        </article>
        <article data-tone="blue">
          <span>Behind the move</span>
          <strong>
            {day.positive} up <i>·</i> {day.negative} down
          </strong>
          <small>
            {day.covered} of {day.total} USD equity holdings with comparable
            changes
          </small>
        </article>
        <article data-tone="amber">
          <span>The next seven days</span>
          <strong>
            {new Set(day.upcoming.map((e) => e.symbol)).size} companies
          </strong>
          <small>
            {day.upcoming.length
              ? day.upcoming
                  .slice(0, 3)
                  .map((e) => e.symbol)
                  .join(" · ")
              : "No scheduled company events returned"}
          </small>
        </article>
        <p>
          Estimated price change on your current recorded units. Excludes
          trades, cash flows, fees and crypto; not brokerage P&amp;L. Different
          observation dates are not combined.
        </p>
      </section>
      <div className="briefing-columns">
        <section className="briefing-market">
          <header>
            <div>
              <span className="briefing-kicker">THE BIG PICTURE</span>
              <h2>Your companies, in focus.</h2>
            </div>
            <Link
              href={`${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`}
              aria-label={`Research ${symbol || "a company"}`}
            >
              <ArrowUpRight size={20} />
            </Link>
          </header>
          {symbol ? (
            <>
              <p className="briefing-focus-reason">{choice?.reason}</p>
              <div className="briefing-company-picker">
                <label>
                  <span className="sr-only">Company chart</span>
                  <select
                    value={symbol}
                    onChange={(e) =>
                      setSelection({
                        symbol: e.target.value,
                        reason: "Selected by you",
                      })
                    }
                  >
                    {symbols.map((s) => (
                      <option key={s} value={s}>
                        {names[s] ?? s}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {chosen?.price != null && chosen.price > 0
                    ? amount(chosen.price, chosen.currency)
                    : "Price unavailable"}
                </span>
              </div>
              <div className="briefing-chart-meta">
                <b
                  data-direction={(chosen?.changePct ?? 0) < 0 ? "down" : "up"}
                >
                  {Number.isFinite(chosen?.changePct)
                    ? percent(chosen!.changePct, true)
                    : "Change unavailable"}
                </b>
                <small>
                  {chosen ? quoteTime(chosen.asOf) : "Waiting for a quote"}
                </small>
              </div>
              <div className="briefing-chart">
                {bars.length > 1 ? (
                  <svg
                    viewBox="0 0 500 205"
                    role="img"
                    aria-label={`${symbol} daily closing prices, ${range}`}
                  >
                    <defs>
                      <linearGradient
                        id="home-price-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop stopColor="#5c9df9" stopOpacity=".25" />
                        <stop offset="1" stopColor="#5c9df9" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[40, 90, 140, 180].map((y) => (
                      <line
                        key={y}
                        x1="10"
                        x2="490"
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        opacity=".08"
                      />
                    ))}
                    <path
                      d={`${path}L490 180L10 180Z`}
                      fill="url(#home-price-fill)"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke="#397fea"
                      strokeWidth="2.5"
                    />
                    <text
                      x="10"
                      y="201"
                      fill="currentColor"
                      opacity=".6"
                      fontSize="11"
                    >
                      {dateLabel(bars[0].time)}
                    </text>
                    <text
                      x="490"
                      y="201"
                      textAnchor="end"
                      fill="currentColor"
                      opacity=".6"
                      fontSize="11"
                    >
                      {dateLabel(bars[bars.length - 1].time)}
                    </text>
                  </svg>
                ) : (
                  <p className="briefing-empty">
                    {history.loading
                      ? "Loading price history…"
                      : history.error
                        ? "Price history is temporarily unavailable. Your holdings remain below."
                        : "Add a company to start your daily perspective."}
                  </p>
                )}
              </div>
              <div className="briefing-range" aria-label="Chart history">
                {["1M", "3M", "1Y"].map((r) => (
                  <button
                    key={r}
                    aria-pressed={range === r}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
                <small>Daily closes · {symbol}</small>
              </div>
              {day.moves.length > 0 && (
                <div
                  className="briefing-drivers"
                  aria-label="Largest estimated session drivers"
                >
                  {day.moves.slice(0, 3).map((m) => (
                    <Link
                      key={m.symbol}
                      href={`${prefix}/research/${encodeURIComponent(m.symbol)}`}
                      data-direction={m.impact < 0 ? "down" : "up"}
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
                </div>
              )}
            </>
          ) : (
            <p className="briefing-empty">
              {symbols.length ? "Waiting for a dated quote to choose your focus. Your companies remain available below." : "Save your first company or add your holdings to begin."}
            </p>
          )}
        </section>
        <section className="briefing-calendar">
          <header>
            <span className="briefing-kicker">LOOK AHEAD</span>
            <h2>Next on your calendar</h2>
          </header>
          {calendar.length ? (
            <>
              <div className="briefing-next">
                <CalendarDays size={21} />
                <span>{dateLabel(calendar[0].date)}</span>
              </div>
              <Link
                className="briefing-event-title"
                href={`${prefix}/research/${encodeURIComponent(calendar[0].symbol.replace("/", "-"))}`}
              >
                {names[calendar[0].symbol] ?? calendar[0].symbol}
                <ArrowUpRight size={18} />
              </Link>
              <p>{calendar[0].kind}</p>
              {(calendar[0].weight ?? 0) > 0 && (
                <strong className="briefing-exposure">
                  {percent(calendar[0].weight)} <small>of priced assets</small>
                </strong>
              )}
              <div className="briefing-timeline">
                {calendar.slice(0, 3).map((e, i) => (
                  <Link
                    key={`${e.symbol}-${e.date}-${i}`}
                    href={`${prefix}/research/${encodeURIComponent(e.symbol.replace("/", "-"))}`}
                  >
                    <i />
                    <small>{dateLabel(e.date)}</small>
                    <b>{e.symbol}</b>
                    <span>{e.kind}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="briefing-empty">
              <CalendarDays size={28} />
              <p>
                {events.loading
                  ? "Checking company events…"
                  : "No upcoming dated events returned for these companies."}
              </p>
            </div>
          )}
          {events.error && (
            <small role="status">
              Company events are temporarily unavailable.
            </small>
          )}
          {feed.pageCount > 1 && (
            <button
              className="briefing-feed-next"
              onClick={() => setPage((page + 1) % feed.pageCount)}
            >
              Company group {feed.page + 1} of {feed.pageCount} · Next →
            </button>
          )}
        </section>
        <section className="briefing-changes">
          <header>
            <span className="briefing-kicker">THE LATEST EVIDENCE</span>
            <h2>What changed</h2>
            <p className="briefing-news-coverage">
              {allHeadlines.length} matching headlines · {newsCompanies}{" "}
              companies
              <br />
              {feed.symbols.length} companies requested in this group
            </p>
          </header>
          {headlines.length ? (
            <div
              className="briefing-headline-list"
              id="home-company-headlines"
              data-expanded={expandedNews}
            >
              {headlines.map((n, i) => (
                <a
                  key={`${n.url}-${i}`}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div>
                    <SecurityLogo symbol={n.symbol} size={28} />
                    <b>{n.symbol}</b>
                    <span>{dateLabel(n.date)}</span>
                  </div>
                  <p>{n.title}</p>
                  <small>
                    Company news <ArrowUpRight size={12} />
                  </small>
                </a>
              ))}
            </div>
          ) : (
            <div className="briefing-empty">
              <p>
                {news.loading
                  ? "Looking for company updates…"
                  : news.error
                    ? "News is temporarily unavailable."
                    : "No matching recent headlines returned for this company group."}
              </p>
              <Link href={`${prefix}/research`}>
                Explore a company <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {allHeadlines.length > 3 && (
            <button
              className="briefing-news-expand"
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
            <small className="briefing-news-coverage" role="status">
              Some company updates could not be checked.
            </small>
          )}
        </section>
      </div>
      <section className="briefing-holdings">
        <header>
          <div>
            <span className="briefing-kicker">KEEP THE BUSINESS IN VIEW</span>
            <h2>Your companies</h2>
          </div>
          <Link href={`${prefix}/portfolio`}>
            View portfolio <ArrowRight size={15} />
          </Link>
        </header>
        {symbols.length ? (
          <div className="briefing-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Price</th>
                  <th scope="col">Day change</th>
                  <th scope="col">Observation</th>
                  <th scope="col">Next checkpoint</th>
                </tr>
              </thead>
              <tbody>
                {reviewSymbols.slice(0, 8).map((s) => {
                  const row = quotes[s],
                    quote = row?.quote,
                    event = calendar.find((e) => e.symbol === s);
                  return (
                    <tr key={s}>
                      <th scope="row">
                        <Link
                          href={`${prefix}/research/${encodeURIComponent(s.replace("/", "-"))}`}
                        >
                          <SecurityLogo symbol={s} size={35} />
                          <span>
                            <b>{row?.company?.name ?? s}</b>
                            <small>{s}</small>
                          </span>
                        </Link>
                      </th>
                      <td>
                        {quote?.price != null && quote.price > 0 ? (
                          amount(quote.price, quote.currency)
                        ) : (
                          <span className="briefing-unpriced">Not priced</span>
                        )}
                      </td>
                      <td
                        data-direction={
                          (quote?.changePct ?? 0) < 0 ? "down" : "up"
                        }
                      >
                        {Number.isFinite(quote?.changePct)
                          ? percent(quote!.changePct, true)
                          : "—"}
                      </td>
                      <td>
                        <small>
                          {quote
                            ? `${quote.stale ? "Last available · " : ""}${quoteTime(quote.asOf)}`
                            : "Waiting for quote"}
                        </small>
                      </td>
                      <td>
                        <Link
                          href={`${prefix}/research/${encodeURIComponent(s.replace("/", "-"))}`}
                        >
                          {event
                            ? `${event.kind} · ${dateLabel(event.date)}`
                            : "Review company brief"}
                          <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="briefing-empty">
            <p>
              Your companies will appear here when you save a ticker or add a
              position.
            </p>
            <Link href={`${prefix}/research`}>Find your first company →</Link>
          </div>
        )}
      </section>
    </section>
  );
}
