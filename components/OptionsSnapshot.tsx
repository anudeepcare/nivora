import type { OptionContract } from "@/lib/options-analysis";
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
      <p className={s.note}>
        Volume counts reported session trades, not buying or selling direction.
        Rankings cover loaded contracts only.
      </p>
    </section>
  );
}
