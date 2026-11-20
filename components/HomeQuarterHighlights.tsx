import Link from "next/link";
import { homeQuarterHighlights } from "@/lib/home-quarter-highlights";
import type { Research } from "@/lib/types";
import s from "./HomeQuarterHighlights.module.css";
export default function HomeQuarterHighlights({
  research,
  asOf,
  prefix = "",
}: {
  research: Research[];
  asOf: string;
  prefix?: string;
}) {
  const rows = homeQuarterHighlights(research, asOf);
  if (!rows.length) return null;
  const amount = (n: number, currency: string) =>
    `${new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n)} ${currency}`;
  return (
    <section className={s.root} aria-label="Reported quarter highlights">
      <header>
        <h2>Latest reported quarter</h2>
        <p>
          Reported revenue versus the prior quarter. Not the unfinished calendar
          quarter or a forecast.
        </p>
      </header>
      <div className={s.grid}>
        {rows.map((r) => {
          const max = Math.max(r.current, r.previous);
          return (
            <article key={r.symbol}>
              <header>
                <Link
                  href={`${prefix}/research/${encodeURIComponent(r.symbol)}`}
                >
                  {r.symbol} <span>{r.name}</span>
                </Link>
                <strong
                  data-direction={
                    r.changePct > 0 ? "up" : r.changePct < 0 ? "down" : "flat"
                  }
                >
                  {r.changePct > 0 ? "+" : ""}
                  {r.changePct.toFixed(1)}% <small>quarter over quarter</small>
                </strong>
              </header>
              <div className={s.comparison}>
                {[
                  { label: "Prior", date: r.from, value: r.previous },
                  { label: "Latest", date: r.to, value: r.current },
                ].map((v, i) => (
                  <div key={v.label} data-latest={i === 1}>
                    <span>
                      {v.label} · <time dateTime={v.date}>{v.date}</time>
                    </span>
                    <b>{amount(v.value, r.currency)}</b>
                    <svg
                      viewBox="0 0 100 8"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <rect width={(v.value / max) * 100} height="8" rx="2" />
                    </svg>
                  </div>
                ))}
              </div>
              <footer>
                {r.basis} · Filed <time dateTime={r.filed}>{r.filed}</time>
                {r.source && (
                  <a href={r.source} target="_blank" rel="noopener noreferrer">
                    Latest source ↗
                  </a>
                )}
                {r.priorSource && (
                  <a
                    href={r.priorSource}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Prior source ↗
                  </a>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
