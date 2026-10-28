import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { PACE_LEVELS, PACE_DESCRIPTIONS } from "@/lib/pace-presentation";
import { PrivacyChoices } from "./AnalyticsConsent";
export default function PublicEducation({ pace = false }: { pace?: boolean }) {
  return (
    <main className="public-education">
      <header>
        <Link className="legal-brand" href="/">
          <img src="/icon.svg" width="30" height="30" alt="" /> AURYN
        </Link>
        <nav aria-label="Public navigation">
          <Link href="/pricing">Plans</Link>
          <Link className="button primary" href="/login?mode=signup">
            Get started <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <section className="education-hero">
        <span className="eyebrow">
          {pace
            ? "AURYN PACE · YOUR CONTRIBUTION RHYTHM"
            : "BUILT FOR A CLEARER NEXT MOVE"}
        </span>
        <h1>
          {pace ? (
            <>
              A pace for buying.
              <br />
              <em>A reason behind it.</em>
            </>
          ) : (
            <>
              See the business.
              <br />
              <em>Understand your next move.</em>
            </>
          )}
        </h1>
        <p>
          {pace
            ? "Business first. Growth, profitability and funding determine whether accumulation is supported. Confirmed Pace guides gradual purchases; valuation explains the price assumptions and risks."
            : "Business first. Understand growth, profits and funding, then see a clear Buy, Add, Hold, Reduce or Sell assessment. AURYN Pace helps plan gradual purchases while valuation stays a separate check."}
        </p>
        <Link className="button primary" href="/sample">
          Explore the product <ArrowRight size={17} />
        </Link>
      </section>
      {pace ? (
        <>
          <section className="education-levels" aria-label="Pace levels">
            {PACE_LEVELS.map((label, i) => (
              <article key={label}>
                <span>P{i}</span>
                <h2>{label}</h2>
                <p>{PACE_DESCRIPTIONS[i]}</p>
              </article>
            ))}
          </section>
          <section className="education-grid">
            <article>
              <span>01 / DECISION FIRST</span>
              <h2>Buy and Add mean different things.</h2>
              <p>
                For a new purchase, AURYN shows Buy, Watch, Wait or Avoid. For
                an existing holding, it can show Add, Hold, Reduce or Sell. If
                an assessment is incomplete or the business needs further
                review, it shows Review. A saved watchlist item does not mean
                you own it.
              </p>
            </article>
            <article>
              <span>02 / CONFIRMED BEFORE FORMING</span>
              <h2>Use the completed month.</h2>
              <p>
                The last completed month sets the confirmed accumulation zone.
                The current month is forming and may change. If the assessment
                supports buying and confirmed Pace is P2, the display reads “Buy
                small · P2”.
              </p>
            </article>
            <article>
              <span>03 / RISK BEFORE SPEED</span>
              <h2>P4 is never a shortcut.</h2>
              <p>
                P4 is not a company-quality rating. It describes accelerated
                buying conditions relative to price history. A lower share price
                alone cannot make a weak business a Buy. Business risks can
                still require Reduce, Sell or Avoid. P0 pauses additions; it is
                not a sell signal or a return forecast.
              </p>
            </article>
            <article>
              <span>04 / MAKE IT YOURS</span>
              <h2>Start with a sensible budget.</h2>
              <p>
                Pace zones do not prescribe an automatic purchase amount. Keep
                the total within your cash budget, concentration limits and risk
                tolerance. Missing price history leaves business research
                available without inventing a Pace level.
              </p>
            </article>
          </section>
        </>
      ) : (
        <section className="education-grid">
          <article>
            <span>THE BUSINESS</span>
            <h2>Evidence you can inspect.</h2>
            <p>
              Growth, margins, cash generation and funding explain operating
              progress. A company can keep improving while its share price
              falls. Price movement alone does not establish business quality.
            </p>
          </article>
          <article>
            <span>THE PRICE</span>
            <h2>Assumptions in the open.</h2>
            <p>
              A good business is not automatically cheap. Inspect the growth,
              cash-flow and downside assumptions separately. Conservative model
              estimates inform caution without blocking every scheduled
              purchase.
            </p>
          </article>
          <article>
            <span>YOUR PORTFOLIO</span>
            <h2>Context beyond a ticker.</h2>
            <p>
              See holdings, concentration, watchlists and upcoming reports
              together. Entry guidance and existing-holder guidance use the same
              underlying assessment.
            </p>
          </article>
          <article>
            <span>AURYN PACE</span>
            <h2>An accumulation scale of our own.</h2>
            <p>
              P1 means Watch or Hold. After the business checks, P2 starts
              small, P3 builds gradually and P4 supports deeper planned
              accumulation within your budget. P0 pauses additions. Confirmed
              readings guide the plan; forming readings can change.
            </p>
            <Link href="/pace">Understand Pace →</Link>
          </article>
        </section>
      )}
      <section className="education-method">
        <h2>Clear rules. Visible limits.</h2>
        <p>
          AURYN uses disclosed research heuristics. It does not guarantee
          returns or replace your judgment. Review the business, valuation
          assumptions and portfolio fit before acting.
        </p>
        <Link href="/methodology">Read the methodology →</Link>
      </section>
      <footer>
        <Link href="/">AURYN</Link>
        <Link href={pace ? "/about" : "/pace"}>
          {pace ? "About" : "AURYN Pace"}
        </Link>
        <Link href="/contact">Contact</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <Link href="/privacy">Privacy</Link>
        <PrivacyChoices />
      </footer>
    </main>
  );
}
