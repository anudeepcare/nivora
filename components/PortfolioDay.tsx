"use client";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Wallet, Clock3 } from "lucide-react";
import type { Position } from "@/lib/types";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import { portfolioDay } from "@/lib/portfolio-day";
import { amount, percent, quoteTime } from "@/lib/format";
import { researchLink } from "@/lib/approved-workspace";
import s from "./PortfolioDay.module.css";

/** Quoted price changes, with their actual observation range rather than a session claim. */
export default function PortfolioDay({
  positions,
  quotes,
  prefix,
  now,
}: {
  positions: Position[];
  quotes: QuoteRows;
  prefix: string;
  now?: number;
}) {
  const d = portfolioDay(positions, quotes, now);
  if (!d.priced) return null;
  const largestMove = Math.max(
    1,
    ...[...d.gainers, ...d.decliners].map((m) => Math.abs(m.move)),
  );
  const direction =
    d.move == null || d.move === 0 ? "flat" : d.move > 0 ? "up" : "down";
  const signed = (v: number) =>
    `${v >= 0 ? "+" : "−"}${amount(Math.abs(v), "USD", Math.abs(v) >= 1e5)}`;
  return (
    <section
      className={s.root}
      aria-label="Your holdings and quoted price changes"
    >
      <header className={s.heading}>
        <span className={s.eyebrow}>
          <Wallet size={15} aria-hidden="true" /> Holdings snapshot
        </span>
        <Link className={s.open} href={`${prefix}/portfolio`}>
          Open portfolio <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>
      <div className={s.total}>
        <span className={s.valueLabel}>Priced holdings value · USD</span>
        <strong>{amount(d.value, "USD", d.value >= 1e7)}</strong>
        <span className={s.changeLabel}>Sum of reported quote changes</span>
        <p data-direction={direction}>
          {d.move == null ? (
            "Quoted changes not available"
          ) : (
            <>
              {direction === "down" ? (
                <ArrowDownRight size={16} aria-hidden="true" />
              ) : direction === "up" ? (
                <ArrowUpRight size={16} aria-hidden="true" />
              ) : null}
              {signed(d.move)} · {percent(d.movePct, true)}
            </>
          )}
        </p>
        <small>
          {d.priced} of {d.holdings} holdings priced · excludes cash
        </small>
      </div>
      {(d.gainers.length > 0 || d.decliners.length > 0) && (
        <div className={s.movers}>
          {(
            [
              ["Helped most", d.gainers, "up"],
              ["Hurt most", d.decliners, "down"],
            ] as const
          ).map(
            ([title, rows, tone]) =>
              rows.length > 0 && (
                <div key={title} data-direction={tone}>
                  <h3>{title}</h3>
                  <ul>
                    {rows.map((m) => (
                      <li key={m.symbol}>
                        <Link
                          href={researchLink(m.symbol, prefix)}
                          title={`Quote observed ${m.asOf}`}
                        >
                          {m.symbol}
                        </Link>
                        <span>{signed(m.move)}</span>
                        <small>{percent(m.changePct, true)}</small>
                        <svg
                          className={s.contributionBar}
                          viewBox="0 0 100 8"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <line x1="50" x2="50" y1="0" y2="8" />
                          <rect
                            x={
                              m.move < 0
                                ? 50 - (Math.abs(m.move) / largestMove) * 50
                                : 50
                            }
                            y="2"
                            width={(Math.abs(m.move) / largestMove) * 50}
                            height="4"
                            rx="2"
                          />
                        </svg>
                        <time className={s.observed} dateTime={m.asOf}>
                          Quote {quoteTime(m.asOf, true)}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
      <footer className={s.basis}>
        <Clock3 size={14} aria-hidden="true" />
        <div>
          {(d.gainers.length > 0 || d.decliners.length > 0) && (
            <span className={s.barBasis}>
              Bar lengths compare the displayed dollar contributions.
            </span>
          )}{" "}
          {d.covered} of {d.holdings} holdings with dated reported changes.
          {d.oldestAsOf && d.asOf && (
            <>
              {" "}
              Quotes:{" "}
              <time dateTime={d.oldestAsOf} title={d.oldestAsOf}>
                {quoteTime(d.oldestAsOf, true)}
              </time>
              {d.oldestAsOf !== d.asOf && (
                <>
                  {" "}
                  to{" "}
                  <time dateTime={d.asOf} title={d.asOf}>
                    {quoteTime(d.asOf, true)}
                  </time>
                </>
              )}
              .
            </>
          )}
          <strong className={s.warning}>
            {d.mixedQuoteDates
              ? " Mixed quote dates, not one session."
              : " Reported changes may cover different sessions."}
          </strong>{" "}
          Current quantities × quoted changes, not account performance.
        </div>
      </footer>
    </section>
  );
}
