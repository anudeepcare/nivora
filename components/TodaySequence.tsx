import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./TodaySequence.module.css";
export default function TodaySequence({
  decision,
  headline,
  concentration,
  prefix,
}: {
  decision: { symbol: string; action: string; code: string } | null;
  headline: { title: string; url: string; date: string; symbol: string } | null;
  concentration: { symbol: string; weight: number } | null;
  prefix: string;
}) {
  return (
    <section
      className={styles.sequence}
      data-has-decision={decision ? "true" : "false"}
      aria-label="Today's research priorities"
    >
      {decision && (
        <article className={styles.primary}>
          <span>DECISION</span>
          <h2>
            {decision.symbol}: {decision.action}
          </h2>
          <p>
            Review business checks and price bands before changing your plan.
          </p>
          <div className={styles.reading}>
            <b>{decision.code}</b>
            <span>
              Current research reading
              <small>Not a change alert or an executed trade</small>
            </span>
          </div>
          <Link
            href={`${prefix}/research/${encodeURIComponent(decision.symbol)}`}
          >
            Review {decision.symbol}
            <ArrowUpRight size={18} />
          </Link>
        </article>
      )}
      <article>
        <span>LATEST HEADLINE</span>
        <h3>{headline?.title || "Keep the source in view."}</h3>
        <p>
          {headline
            ? `${headline.symbol} · Published ${new Date(headline.date).toLocaleDateString()}. A headline is context, not a verified change in your investment case.`
            : "Dated headlines appear here when news coverage is available for the companies you follow."}
        </p>
        {headline ? (
          <a href={headline.url} target="_blank" rel="noopener noreferrer">
            Read the source <ArrowUpRight size={16} />
          </a>
        ) : (
          <Link href={`${prefix}/watchlist`}>
            Review your watchlist <ArrowUpRight size={16} />
          </Link>
        )}
      </article>
      <article>
        <span>EXPOSURE</span>
        <h3>
          {concentration
            ? `${concentration.symbol} is your largest priced position.`
            : "Make room for portfolio context."}
        </h3>
        <p>
          {concentration
            ? `${concentration.weight.toFixed(1)}% of the priced portfolio. Review missing quotes and cash before judging concentration; this is not a policy breach alert.`
            : "Record your holdings to see portfolio weights alongside your research. Unpriced positions are never treated as zero risk."}
        </p>
        <Link href={`${prefix}/portfolio`}>
          Review portfolio <ArrowUpRight size={16} />
        </Link>
      </article>
    </section>
  );
}
