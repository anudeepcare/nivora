import type { OptionContract } from "@/lib/options-analysis";
import { optionsLiquidity } from "@/lib/options-liquidity";
import { busiestStrike } from "@/lib/options-snapshot";
import { amount, dateLabel } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import s from "./OptionsSnapshot.module.css";
export default function OptionsSnapshot({
  contracts,
  spot,
  expiry,
}: {
  contracts: OptionContract[];
  spot: number;
  expiry: string;
}) {
  const liquidity = optionsLiquidity(contracts, expiry);
  const levels = (["call", "put"] as const).map((type) => ({
    type,
    level: busiestStrike(contracts, type, expiry),
  }));
  const hasVolume = levels.some(({ level }) => level !== null);
  const suppliedVolume = contracts.some(
    (c) =>
      c.expiry === expiry &&
      c.volume !== null &&
      Number.isFinite(c.volume) &&
      c.volume >= 0,
  );
  return (
    <section className={s.snapshot} aria-label="Options at a glance">
      <header>
        <h3>Trading activity</h3>
        <span>Expires {dateLabel(expiry)}</span>
      </header>
      {hasVolume ? (
        <div className={s.levels}>
          {levels.map(({ type, level }) => {
            return (
              <article key={type} data-side={type}>
                <span>
                  {type === "call" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}{" "}
                  Most traded {type} strike
                </span>
                <strong>
                  {level ? amount(level.strike) : "No volume reported"}
                </strong>
                {level && (
                  <>
                    <p>
                      {level.volume.toLocaleString()} contracts
                      {level.tied ? " · tied for highest" : ""}
                    </p>
                    <small>
                      {spot > 0
                        ? `${((Math.abs(level.strike - spot) / spot) * 100).toFixed(1)}% ${level.strike >= spot ? "above" : "below"} stock price · `
                        : ""}
                      {dateLabel(level.observed)}
                    </small>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className={s.unavailable}>
          {suppliedVolume
            ? "No trades reported for this expiration in supplied volume observations."
            : "No volume reported for this expiration."}
        </p>
      )}
      <details className={s.liquidity}>
        <summary>
          Quote quality · {liquidity.twoSided}/{liquidity.contracts} contracts
          have two-sided quotes
        </summary>
        <dl>
          <dt>Median spread</dt>
          <dd>
            {liquidity.medianSpread === null
              ? "Not measured"
              : `${liquidity.medianSpread.toFixed(1)}% of midpoint`}
          </dd>
          <dt>Observations</dt>
          <dd>
            {liquidity.oldest
              ? `${dateLabel(liquidity.oldest)} – ${dateLabel(liquidity.newest)}`
              : "No dated quotes"}
          </dd>
        </dl>
        <p className={s.note}>
          Spread uses positive bids and valid asks for this expiration. Snapshot
          quotes do not confirm current execution prices. Inspect the individual
          contract before acting.
        </p>
      </details>
      <details>
        <summary>Volume & options guide</summary>
        <p className={s.note}>
          Volume counts trades in the reported session. It does not show whether
          traders bought or sold, or predict a price target. Rankings cover
          loaded contracts only.
        </p>

        <dl>
          <dt>Call</dt>
          <dd>A right to buy shares at the strike price by expiration.</dd>
          <dt>Put</dt>
          <dd>A right to sell shares at the strike price by expiration.</dd>
          <dt>Strike</dt>
          <dd>The contract’s price level, not a forecast for the stock.</dd>
          <dt>Open interest</dt>
          <dd>Contracts still open. Different from trading volume.</dd>
          <dt>Gamma</dt>
          <dd>
            How quickly an option’s sensitivity to the stock changes. The
            heatmap estimates where that exposure is concentrated; a large level
            is not guaranteed support or resistance.
          </dd>
        </dl>
      </details>
    </section>
  );
}
