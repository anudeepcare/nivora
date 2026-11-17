import Link from "next/link";
import PublicFrame from "./PublicFrame";
import s from "./PublicFrame.module.css";
import { PACE_LEVELS, PACE_DESCRIPTIONS } from "@/lib/pace-presentation";
export default function PublicEducation({ pace = false }: { pace?: boolean }) {
  return (
    <PublicFrame
      title={
        pace
          ? "A clear rhythm for accumulation."
          : "Understand the business. Put the price in perspective."
      }
      intro="AURYN connects business evidence, price conditions and portfolio limits so you can inspect the reasons behind your next decision."
    >
      {pace && (
        <section className={s.levels} aria-label="Pace levels">
          {PACE_LEVELS.map((label, i) => (
            <div key={label}>
              <strong>P{i}</strong>
              <p>
                <b>{label}</b>
                <br />
                {PACE_DESCRIPTIONS[i]}
              </p>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>{pace ? "How to use Pace" : "A practical research workflow"}</h2>
        <dl className={s.steps}>
          <dt>1. Business</dt>
          <dd>
            Business first. Review growth, profitability, cash generation and
            funding. A lower share price alone does not make a weak business
            attractive.
          </dd>
          <dt>2. Price & valuation</dt>
          <dd>
            Inspect the assumptions behind valuation separately from the price
            zone. For a new purchase, Buy, Watch, Wait and Avoid describe entry
            guidance; existing holdings use Add, Hold, Reduce and Sell.
          </dd>
          <dt>3. Pace</dt>
          <dd>
            P0 pauses additions. P1 watches or holds. After business checks, P2
            starts small, P3 builds gradually and P4 supports the deepest
            planned accumulation within your limits. Use confirmed completed
            periods; forming readings can change. When buying qualifies at P2,
            the action reads “Buy small · P2”. P4 is not a company-quality
            rating. <Link href="/pace">Explore the scale →</Link>
          </dd>
          <dt>4. Portfolio</dt>
          <dd>
            Check existing exposure, cash and concentration before adding. A
            price level is not a position-size instruction.{" "}
            <Link href="/portfolio-check">Check concentration →</Link>
          </dd>
        </dl>
      </section>
      <section>
        <h2>Know what supports the conclusion.</h2>
        <p>
          Check the observation date, reporting period, source and missing
          inputs. When the assessment needs more evidence or attention, AURYN
          shows Review. Historical signals and model outputs do not guarantee
          future returns.
        </p>
        <div className={s.actions}>
          <Link href="/sample">Explore the product →</Link>
          <Link href="/track-record">Evidence and methodology →</Link>
        </div>
      </section>
    </PublicFrame>
  );
}
