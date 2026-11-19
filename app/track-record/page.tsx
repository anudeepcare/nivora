import PaceRecordFeed from "@/components/PaceRecordFeed";
import Link from "next/link";
import s from "@/components/PublicFrame.module.css";
import PublicFrame from "@/components/PublicFrame";
import { PACE_LEVELS } from "@/lib/pace-presentation";
export const metadata = {
  title: "Evidence & track record | AURYN",
  robots: { index: true, follow: true },
};
export default function Record() {
  return (
    <PublicFrame
      title="Understand the logic behind Pace."
      intro="A consistent framework for accumulation: completed price periods, business evidence and your portfolio limits."
    >
      <section className={s.levels} aria-label="Pace scale">
        {PACE_LEVELS.map((label, i) => (
          <div key={label}>
            <strong>P{i}</strong>
            <p>{label}</p>
          </div>
        ))}
      </section>
      <PaceRecordFeed />
      <details>
        <summary>
          Methodology and comparison with regular monthly investing
        </summary>
        <p>
          Comparative performance has not yet been established for the current
          policy. These are the standards used to evaluate it.
        </p>
        <h2>What a valid comparison must include</h2>
        <ul>
          <li>
            Signals committed before outcomes, with policy version, timestamp
            and an independently verifiable publication record.
          </li>
          <li>
            The same monthly contribution budget for Pace and fixed
            contributions, including idle cash and its return.
          </li>
          <li>
            Fees, total returns, corporate actions and delisted companies;
            decisions use only information available at the time.
          </li>
          <li>
            Walk-forward evaluation, the full distribution across stocks,
            drawdowns, losing periods and uncertainty.
          </li>
        </ul>
        <h2>What changes the conclusion?</h2>
        <p>
          Only reproducible evidence on suitable historical data and a forward
          record. A few winning examples or a signed snapshot alone do not
          establish an investing advantage.
        </p>
      </details>
      <nav className={s.actions}>
        <Link href="/portfolio-check">Check portfolio concentration</Link>
        <Link href="/about">How AURYN works</Link>
      </nav>
    </PublicFrame>
  );
}
