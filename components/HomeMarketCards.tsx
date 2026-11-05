"use client";

import Link from "next/link";
import { companyAccent, seriesDirection } from "@/lib/visual-signals";
import type { CSSProperties } from "react";
import { useEffect, useId, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Compass,
} from "lucide-react";
import type { Candle, Research } from "@/lib/types";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import { api } from "@/lib/client";
import { amount, dateLabel, percent } from "@/lib/format";
import { useProduct } from "./Session";
import { SecurityLogo } from "./Ui";
import styles from "./HomeMarketCards.module.css";

type HistoryReply = { candles: Candle[]; source?: string };
type HistoryState = {
  scope: string;
  rows: Record<string, Candle[]>;
  pending: string[];
};
const DAY = 86400000;

/** Never fill missing observations or render a stale/malformed series as a current trend. */
function usableHistory(history: Candle[] | undefined, now: number): Candle[] {
  if (!history?.length || !Number.isFinite(now)) return [];
  const valid = history.every((p) => {
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(p.time)) return false;
    const time = Date.parse(p.time);
    return (
      Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === p.time.slice(0, 10) &&
      time <= now &&
      Number.isFinite(p.close) &&
      p.close > 0
    );
  });
  if (!valid) return [];
  const points = [
    ...new Map(history.map((p) => [p.time.slice(0, 10), p])).values(),
  ].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (points.length < 2 || now - Date.parse(points.at(-1)!.time) > 10 * DAY)
    return [];
  const settled = points.filter(
    (p) => p.time.slice(0, 10) < new Date(now).toISOString().slice(0, 10),
  );
  if (settled.length < 2) return [];
  const from = Date.parse(settled.at(-1)!.time) - 31 * DAY;
  return settled.filter((p) => Date.parse(p.time) >= from);
}

function PriceArea({
  symbol,
  points,
  currency,
}: {
  symbol: string;
  points: Candle[];
  currency: string;
}) {
  const id = useId().replaceAll(":", "");
  const low = Math.min(...points.map((p) => p.close));
  const high = Math.max(...points.map((p) => p.close));
  const first = Date.parse(points[0].time),
    last = Date.parse(points.at(-1)!.time);
  const x = (time: string) =>
    6 + ((Date.parse(time) - first) / (last - first)) * 288;
  const y = (price: number) =>
    high === low ? 51 : 10 + ((high - price) / (high - low)) * 78;
  const path = points
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${x(p.time).toFixed(2)} ${y(p.close).toFixed(2)}`,
    )
    .join(" ");
  return (
    <div
      className={styles.history}
      data-direction={seriesDirection(points.map((p) => p.close))}
    >
      <svg
        viewBox="0 0 300 106"
        role="img"
        aria-label={`${symbol} closing prices, ${dateLabel(points[0].time)} to ${dateLabel(points.at(-1)!.time)}. ${amount(points[0].close, currency)} to ${amount(points.at(-1)!.close, currency)}.`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".28" />
            <stop offset="1" stopColor="currentColor" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[22, 52, 82].map((y) => (
          <line
            key={y}
            x1="0"
            x2="300"
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity=".12"
            strokeWidth=".75"
          />
        ))}
        <path d={`${path} L294 104 L6 104 Z`} fill={`url(#${id})`} />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="294"
          cy={y(points.at(-1)!.close)}
          r="3.5"
          fill="currentColor"
        />
      </svg>
      <div className={styles.window}>
        <span>{dateLabel(points[0].time)}</span>
        <span>{dateLabel(points.at(-1)!.time)}</span>
      </div>
      <span className={styles.historyLabel}>Closing price history</span>
    </div>
  );
}

export default function HomeMarketCards({
  symbols,
  quotes,
  research,
  prefix,
  context = "home",
  total,
}: {
  symbols: string[];
  quotes: QuoteRows;
  research: Research[];
  prefix: string;
  context?: "home" | "research";
  total?: number;
}) {
  const { cache, demo, owner } = useProduct();
  const [logoAccents, setLogoAccents] = useState<Record<string, string>>({});
  const allSymbols = [...new Set(symbols)];
  const selected = allSymbols.slice(0, 4);
  const selectedKey = selected.join(",");
  const scope = `${owner}:${demo ? "demo" : "live"}:${selectedKey}`;
  // A stable payload avoids restarting requests when a parent creates a new array.
  const suppliedKey = JSON.stringify(
    Object.fromEntries(
      selected.map((symbol) => {
        const supplied =
          research.find((r) => r.company.symbol === symbol) ??
          demo?.research[symbol];
        const cached = cache.get(
          `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
        )?.value as Research | undefined;
        return [symbol, (supplied ?? cached)?.history ?? []];
      }),
    ),
  );
  const demoDate = demo
    ? Object.values(demo.research)[0]?.retrievedAt
    : undefined;
  const [state, setState] = useState<HistoryState>({
    scope: "",
    rows: {},
    pending: [],
  });
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    const reference = demoDate ? Date.parse(demoDate) : Date.now();
    const supplied = JSON.parse(suppliedKey) as Record<string, Candle[]>;
    const rows: Record<string, Candle[]> = {};
    const missing: string[] = [];
    for (const symbol of selectedKey ? selectedKey.split(",") : []) {
      const path = `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=1M`;
      const cached = cache.get(path);
      const candles = usableHistory(supplied[symbol], reference);
      const chart =
        cached && Date.now() - cached.at < 900000
          ? (cached.value as HistoryReply)
          : undefined;
      const points =
        candles.length > 1 ? candles : usableHistory(chart?.candles, reference);
      if (points.length > 1) rows[symbol] = points;
      else missing.push(symbol);
    }
    setState({ scope, rows, pending: demo ? [] : missing });
    if (!demo)
      void (async () => {
        for (const symbol of missing) {
          if (!active) break;
          const path = `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=1M`;
          let points: Candle[] = [];
          try {
            const result = await api<HistoryReply>(
              path,
              undefined,
              abort.signal,
            );
            if (active) cache.set(path, { at: Date.now(), value: result });
            points = usableHistory(result.candles, Date.now());
          } catch {
            /* An honest unavailable state preserves the rest of the cards. */
          }
          if (active)
            setState((prior) =>
              prior.scope === scope
                ? {
                    ...prior,
                    rows: { ...prior.rows, [symbol]: points },
                    pending: prior.pending.filter((s) => s !== symbol),
                  }
                : prior,
            );
        }
      })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [cache, demo, demoDate, owner, scope, selectedKey, suppliedKey]);

  const ready = selected.filter((symbol) => {
    const quote =
      quotes[symbol]?.quote ??
      research.find((r) => r.company.symbol === symbol)?.quote ??
      demo?.research[symbol]?.quote;
    return (
      quote?.price != null &&
      Number.isFinite(quote.price) &&
      quote.price > 0 &&
      quote.asOf &&
      Number.isFinite(Date.parse(quote.asOf)) &&
      Date.parse(quote.asOf) <= Date.now()
    );
  }).length;
  return (
    <section
      className={`${styles.section} ${context === "research" ? styles.research : ""}`}
      aria-labelledby="home-market-pulse"
    >
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            <ChartNoAxesCombined size={15} aria-hidden="true" />{" "}
            {context === "research" ? "SAVED COMPANIES" : "THE BIG PICTURE"}
          </span>
          <h2 id="home-market-pulse">
            {context === "research"
              ? "Your research universe"
              : "Your market pulse"}
          </h2>
          <p>
            {selected.length
              ? `${selected.length} of ${total ?? allSymbols.length} ${context === "research" ? "saved" : "followed"} companies · ${ready} quotes available`
              : "A little curiosity. A clearer view of the market."}
          </p>
        </div>
        <Link href={`${prefix}/discover`} className={styles.explore}>
          Explore companies <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      {!selected.length ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Compass size={30} aria-hidden="true" />
          </span>
          <div>
            <h3>Find your next company to follow</h3>
            <p>
              Keep the businesses you care about close. Their prices and market
              history will come together here.
            </p>
            <Link href={`${prefix}/discover`}>
              Discover companies <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {selected.map((symbol) => {
            const supplied =
              research.find((r) => r.company.symbol === symbol) ??
              demo?.research[symbol];
            const company = quotes[symbol]?.company ?? supplied?.company;
            const quote = quotes[symbol]?.quote ?? supplied?.quote;
            const points =
              state.scope === scope ? (state.rows[symbol] ?? []) : [];
            const pending =
              state.scope !== scope ? !demo : state.pending.includes(symbol);
            const current =
              quote?.price != null &&
              Number.isFinite(quote.price) &&
              quote.price > 0 &&
              quote.asOf &&
              Number.isFinite(Date.parse(quote.asOf)) &&
              Date.parse(quote.asOf) <= Date.now();
            const href = `${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`;
            return (
              <article
                key={symbol}
                className={styles.card}
                style={
                  {
                    "--company-accent":
                      logoAccents[symbol] ?? companyAccent(symbol),
                  } as CSSProperties
                }
              >
                <div className={styles.company}>
                  <SecurityLogo
                    symbol={symbol}
                    size={44}
                    onAccent={(color) =>
                      setLogoAccents((prior) =>
                        prior[symbol] === color
                          ? prior
                          : { ...prior, [symbol]: color },
                      )
                    }
                  />
                  <div>
                    <span className={styles.symbol}>{symbol}</span>
                    <h3>{company?.name || symbol}</h3>
                  </div>
                  <Link
                    href={href}
                    className={styles.open}
                    aria-label={`Research ${company?.name || symbol}`}
                  >
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </Link>
                </div>
                <div className={styles.quote}>
                  <strong>
                    {current ? amount(quote?.price, quote?.currency) : "—"}
                  </strong>
                  <span className={styles.currency}>
                    {quote?.currency || "Price unavailable"}
                  </span>
                </div>
                <div className={styles.change}>
                  {current &&
                  quote?.changePct != null &&
                  Number.isFinite(quote.changePct) ? (
                    <>
                      <span
                        className={styles.changeValue}
                        data-direction={quote.changePct < 0 ? "down" : "up"}
                      >
                        {quote.changePct < 0 ? (
                          <ArrowDownRight size={15} aria-hidden="true" />
                        ) : (
                          <ArrowUpRight size={15} aria-hidden="true" />
                        )}
                        {percent(quote.changePct, true)}
                      </span>
                      <span>daily change</span>
                    </>
                  ) : (
                    <span>Daily change unavailable</span>
                  )}
                </div>
                <p className={styles.asOf}>
                  {current
                    ? `${quote?.stale ? "Last available · " : "As of "}${dateLabel(quote?.asOf)}`
                    : "Quote date unavailable"}
                </p>
                {points.length > 1 ? (
                  <PriceArea
                    symbol={symbol}
                    points={points}
                    currency={quote?.currency || company?.currency || "USD"}
                  />
                ) : (
                  <div className={styles.unavailable}>
                    <ChartNoAxesCombined size={24} aria-hidden="true" />
                    <span>
                      {pending
                        ? "Loading price history…"
                        : "Price history unavailable"}
                    </span>
                    <Link href={href}>
                      Explore company research{" "}
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
