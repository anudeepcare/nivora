"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { MarketHeadline } from "@/lib/home-feed";
import { researchLink } from "@/lib/approved-workspace";
import { dateLabel } from "@/lib/format";
import { SecurityLogo } from "./Ui";
import s from "./HomeNewsFeed.module.css";

export default function HomeNewsFeed({
  headlines,
  prefix,
}: {
  headlines: MarketHeadline[];
  prefix: string;
}) {
  const [page, setPage] = useState(0);
  const size = 4;
  const lastPage = Math.max(0, Math.ceil(headlines.length / size) - 1);
  const current = Math.min(page, lastPage);
  useEffect(() => {
    setPage((previous) => Math.min(previous, lastPage));
  }, [lastPage]);
  const start = current * size;
  const visible = headlines.slice(start, start + size);
  return (
    <div className={s.feed}>
      <div className={s.list}>
        {visible.map((news) => (
          <article className={s.story} key={`${news.symbol}:${news.url}`}>
            <div className={s.logo}>
              <SecurityLogo symbol={news.symbol} />
            </div>
            <div className={s.copy}>
              <div className={s.meta}>
                <Link href={researchLink(news.symbol, prefix)}>
                  {news.symbol}
                </Link>
                <time dateTime={news.date}>{dateLabel(news.date)}</time>
              </div>
              <a
                className={s.title}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{news.title}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
      {headlines.length > size && (
        <nav className={s.pagination} aria-label="Company headlines">
          <span aria-live="polite" aria-atomic="true">
            {start + 1}–{Math.min(start + size, headlines.length)} of{" "}
            {headlines.length}
          </span>
          <div>
            <button
              type="button"
              disabled={current === 0}
              aria-label="Previous headlines"
              onClick={() => setPage(Math.max(0, current - 1))}
            >
              <ArrowLeft size={16} /> <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={current === lastPage}
              aria-label="Next headlines"
              onClick={() => setPage(Math.min(lastPage, current + 1))}
            >
              <span>Next</span> <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
