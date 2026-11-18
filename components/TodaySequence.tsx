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
  if (!decision && !headline && !concentration) return null;
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
          <p>Research prompt, not a trade instruction.</p>
          <div className={styles.reading}>
            <b>{decision.code}</b>
            <span>Current research reading</span>
          </div>
          <Link
            href={`${prefix}/research/${encodeURIComponent(decision.symbol)}`}
          >
            Review {decision.symbol}
            <ArrowUpRight size={18} />
          </Link>
        </article>
      )}
      {headline && (
        <article>
          <span>LATEST HEADLINE</span>
          <h3>{headline.title}</h3>
          <p>
            {headline.symbol} · Published{" "}
            {new Date(headline.date).toLocaleDateString()}. Headline only, not a
            verified change in the investment case.
          </p>
          <a href={headline.url} target="_blank" rel="noopener noreferrer">
            Read the source <ArrowUpRight size={16} />
          </a>
        </article>
      )}
      {concentration && (
        <article>
          <span>EXPOSURE</span>
          <div className={styles.exposureMetric}>
            {concentration.weight.toFixed(1)}
            <small>%</small>
          </div>
          <h3>{concentration.symbol} · Largest priced position</h3>
          <p>
            Of the priced portfolio; missing quotes and cash affect
            concentration. Not a breach alert.
          </p>
          <Link href={`${prefix}/portfolio`}>
            Review portfolio <ArrowUpRight size={16} />
          </Link>
        </article>
      )}
    </section>
  );
}
