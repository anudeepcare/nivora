"use client";
import { customerText } from "@/lib/customer-language";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { Research } from "@/lib/types";
import type { EodNews } from "@/lib/eodhd";
import { movementContext } from "@/lib/movement-context";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";

const shortDate = (value: string | null) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "Unavailable";

export default function MovementContext({
  research: r,
  onNews,
}: {
  research: Research;
  onNews: () => void;
}) {
  const { demo } = useProduct();
  const preview = useMemo(
    () =>
      demo
        ? {
            items: [],
            source: "Illustrative preview",
            retrievedAt: r.retrievedAt,
          }
        : undefined,
    [demo, r.retrievedAt],
  );
  const news = useResource<EodNews>(
    `news?symbol=${encodeURIComponent(r.company.symbol)}`,
    preview,
    3600000,
  );
  const [now, setNow] = useState(() => Date.now());
  const refreshNews = useRef(news.refresh);
  refreshNews.current = news.refresh;
  useEffect(() => {
    if (demo) return;
    let lastNewsRefresh = Date.now();
    const update = () => {
      if (document.visibilityState === "hidden") return;
      const time = Date.now();
      setNow(time);
      if (!demo && time - lastNewsRefresh >= 3600000) {
        lastNewsRefresh = time;
        refreshNews.current();
      }
    };
    update();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [demo, r.company.symbol]);
  const displayClock = demo ? Date.parse(r.retrievedAt) : now;
  const m = useMemo(
    () => movementContext(r, news.data?.items ?? [], { now: displayClock }),
    [r, news.data, displayClock],
  );
  const earningsTime =
    m.earnings &&
    (/before/i.test(m.earnings.time)
      ? "Before market open"
      : /after/i.test(m.earnings.time)
        ? "After market close"
        : "Time not confirmed");
  const priceLabel =
    m.change == null && m.priceBasis !== "older-quote"
      ? "Latest price"
      : m.priceBasis === "settled-close"
        ? "Latest close"
        : m.today
          ? "Today’s move"
          : m.priceBasis === "older-quote"
            ? "Older quote"
            : "Price move";
  return (
    <section
      className="card movement-context"
      aria-label="Price movement context"
    >
      <details className="movement-news">
        <summary
          className={`movement-summary movement-columns-${m.relativeVolume != null && m.earnings ? 3 : 2}`}
          aria-label="Price, volume and next event; expand sourced context"
        >
          <span className="movement-metric">
            <span>{priceLabel}</span>
            <strong
              className={
                m.change == null
                  ? ""
                  : m.change < 0
                    ? "red"
                    : m.change > 0
                      ? "green"
                      : ""
              }
            >
              {m.change != null
                ? percent(m.change, true)
                : amount(m.price, r.quote.currency)}
            </strong>
            <small>{shortDate(m.asOf)}</small>
          </span>
          {m.relativeVolume != null && (
            <span className="movement-metric">
              <span>Relative volume</span>
              <strong>{`${m.relativeVolume.toFixed(2)}×`}</strong>
              <small>{shortDate(m.volumeDate)}</small>
            </span>
          )}
          {m.earnings && (
            <span className="movement-metric">
              <span>Next earnings</span>
              <strong>{shortDate(m.earnings.date)}</strong>
              <small>
                {/before/i.test(m.earnings.time)
                  ? "Before open"
                  : /after/i.test(m.earnings.time)
                    ? "After close"
                    : "Time pending"}
              </small>
            </span>
          )}
          {m.relativeVolume == null && !m.earnings && (
            <span className="movement-metric movement-context-link">
              <span>News & context</span>
              <small>View source details</small>
            </span>
          )}
          <ChevronDown
            size={16}
            className="movement-chevron"
            aria-hidden="true"
          />
        </summary>
        <div className="movement-details">
          <p>
            {m.priceBasis === "settled-close"
              ? "Latest completed close"
              : "Price as of"}{" "}
            · {customerText(m.session)} ·{" "}
            {m.priceBasis === "settled-close"
              ? dateLabel(m.asOf)
              : quoteTime(m.asOf)}
            .
            {m.priceBasis === "older-quote"
              ? " This quote has expired; a recent settled replacement was not available."
              : ""}
            {m.priceBasis === "unavailable"
              ? " A valid dated price is unavailable."
              : ""}
            {m.changeFrom
              ? ` Change is versus the prior available close on ${dateLabel(m.changeFrom)}.`
              : ""}
          </p>
          <p>
            {m.volumeStatus}
            {m.volumeDate ? ` · ${dateLabel(m.volumeDate)}` : ""}.
          </p>
          <p>
            {m.earnings
              ? `Next earnings: ${dateLabel(m.earnings.date)} · ${earningsTime}. Company earnings calendar.`
              : `${m.earningsStatus}.`}
          </p>
          {m.headlines.map((n) => (
            <a
              key={n.url}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{n.title}</strong>
              <small>
                {n.publisher} · {dateLabel(n.date)} ↗
              </small>
            </a>
          ))}
          {!m.headlines.length && (
            <p>
              {news.loading
                ? "Company headlines are loading."
                : news.error
                  ? "The company news source is temporarily unavailable."
                  : demo
                    ? "Sample mode has no live headlines."
                    : "The company news source returned no eligible articles from the past seven days."}
            </p>
          )}
          {news.error && (
            <button className="text-link" onClick={news.refresh}>
              Retry headlines
            </button>
          )}
          <p>
            Related coverage provides context; it does not establish what caused
            the price move.
          </p>
          <button className="text-link movement-open-news" onClick={onNews}>
            News & earnings <ArrowUpRight size={15} />
          </button>
        </div>
      </details>
    </section>
  );
}
