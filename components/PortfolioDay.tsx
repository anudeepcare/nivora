"use client";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Position } from "@/lib/types";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import { portfolioDay } from "@/lib/portfolio-day";
import { amount, percent, quoteTime } from "@/lib/format";
import { researchLink } from "@/lib/approved-workspace";
import s from "./PortfolioDay.module.css";

/** Home summary of how the user's own holdings moved in the latest session. */
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
  const direction =
    d.move == null || d.move === 0 ? "flat" : d.move > 0 ? "up" : "down";
  const signed = (v: number) =>
    `${v >= 0 ? "+" : "−"}${amount(Math.abs(v), "USD", Math.abs(v) >= 1e5)}`;
  return (
    <section
      className={s.root}
      aria-label="Your holdings in the latest session"
    >
      <div className={s.total}>
        <span className={s.eyebrow}>Your holdings · latest session</span>
        <strong>{amount(d.value, "USD", d.value >= 1e7)}</strong>
        <p data-direction={direction}>
          {d.move == null ? (
            "Session change not available"
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
          {d.covered} of {d.holdings} holdings with a dated session change
          {d.asOf ? ` · ${quoteTime(d.asOf, true)}` : ""}. Price moves on
          today&rsquo;s quantities, not account performance.
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
                        <Link href={researchLink(m.symbol, prefix)}>
                          {m.symbol}
                        </Link>
                        <span>{signed(m.move)}</span>
                        <small>{percent(m.changePct, true)}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
      <Link className={s.open} href={`${prefix}/portfolio`}>
        Open portfolio <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}
