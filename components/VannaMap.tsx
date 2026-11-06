"use client";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { OptionContract } from "@/lib/options-analysis";
import { modelVannaMap } from "@/lib/options-vanna";
import styles from "./VannaMap.module.css";
const money = (value: number | null) =>
  value === null
    ? "Unavailable"
    : `${value > 0 ? "+" : value < 0 ? "−" : ""}$${Math.abs(value).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}`;
const exact = (value: number | null) =>
  value === null
    ? "Unavailable"
    : value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
        signDisplay: "exceptZero",
      });

export default function VannaMap({
  contracts,
  spot,
  asOf,
}: {
  contracts: OptionContract[];
  spot: number;
  asOf: string;
}) {
  const [riskFree, setRiskFree] = useState("4");
  const [dividendYield, setDividendYield] = useState("0");
  const [selection, setSelection] = useState<string | null>(null);
  const assumptions = {
    riskFree: riskFree.trim() === "" ? NaN : Number(riskFree) / 100,
    dividendYield:
      dividendYield.trim() === "" ? NaN : Number(dividendYield) / 100,
  };
  const map = useMemo(
    () => modelVannaMap(contracts, spot, asOf, assumptions),
    [contracts, spot, asOf, assumptions.riskFree, assumptions.dividendYield],
  );
  const key = (expiry: string, strike: number) => `${expiry}|${strike}`;
  const lookup = new Map(map.cells.map((c) => [key(c.expiry, c.strike), c]));
  const selected = selection ? lookup.get(selection) : null;
  const maximum = Math.max(1, ...map.cells.map((c) => Math.abs(c.net ?? 0)));
  return (
    <section className={styles.panel} aria-label="Modeled vanna exposure">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Model estimate · VEX</span>
          <h3>How delta responds to volatility</h3>
          <p>
            Signed dollar delta-notional sensitivity for a +1 percentage-point
            move in implied volatility.
          </p>
        </div>
        <div className={styles.coverage}>
          <strong>{Math.round(map.coverage * 100)}%</strong>
          <span>input coverage</span>
          <small>
            {map.modeled} of {map.eligible} standard contracts
          </small>
        </div>
      </div>
      <div className={styles.controls}>
        <label>
          Risk-free rate (%)
          <input
            type="number"
            step="0.25"
            value={riskFree}
            onChange={(event) => setRiskFree(event.target.value)}
          />
        </label>
        <label>
          Continuous dividend yield (%)
          <input
            type="number"
            step="0.25"
            value={dividendYield}
            onChange={(event) => setDividendYield(event.target.value)}
          />
        </label>
        <p>
          Model clock <strong>{asOf || "Unavailable"}</strong>
          <br />
          Source dates {map.observedDates.join(", ") || "Unavailable"}
        </p>
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.teal} />
          Positive convention
        </span>
        <span>
          <i className={styles.amber} />
          Negative convention
        </span>
        <span>— Unavailable</span>
      </div>
      {map.cells.length ? (
        <div
          className={styles.scroll}
          tabIndex={0}
          role="region"
          aria-label="Scrollable vanna heatmap"
        >
          <table className={styles.table}>
            <caption>
              Strike × expiry · $ delta-notional per +1pp IV. Select a cell for
              inputs and source dates.
            </caption>
            <thead>
              <tr>
                <th scope="col">Strike</th>
                {map.expiries.map((expiry) => (
                  <th scope="col" key={expiry}>
                    {expiry}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {map.strikes.map((strike) => (
                <tr key={strike}>
                  <th scope="row">
                    {strike.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </th>
                  {map.expiries.map((expiry) => {
                    const cell = lookup.get(key(expiry, strike));
                    const value = cell?.net ?? null;
                    const strength =
                      value === null ? 0 : Math.abs(value) / maximum;
                    return (
                      <td key={expiry}>
                        {cell ? (
                          <button
                            type="button"
                            className={`${styles.cell} ${value === null ? styles.unavailable : value > 0 ? styles.positive : value < 0 ? styles.negative : styles.zero}`}
                            style={
                              {
                                "--strength": `${Math.round(18 + strength * 62)}%`,
                              } as CSSProperties
                            }
                            aria-pressed={selection === key(expiry, strike)}
                            aria-label={`Strike ${strike}, expiry ${expiry}, ${exact(value)} per +1 percentage-point IV. ${cell.reason ?? "Select for source dates"}`}
                            onClick={() => setSelection(key(expiry, strike))}
                          >
                            <strong>
                              {value === null ? "—" : money(value)}
                            </strong>
                            <small>
                              {cell.modeled}/{cell.total} inputs
                            </small>
                          </button>
                        ) : (
                          <span
                            className={styles.absent}
                            title="No supplied contract at this strike and expiry"
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>
          No standard 100-share contracts are available for the vanna model.
        </p>
      )}
      <div className={styles.inspector} aria-live="polite">
        {selected ? (
          <>
            <strong>
              Strike {selected.strike} · {selected.expiry}
            </strong>
            <p>
              Net {exact(selected.net)} · Calls {exact(selected.call)} · Puts{" "}
              {exact(selected.put)} per +1pp IV.
            </p>
            <p>
              Observed {selected.observedDates.join(", ") || "Unavailable"} ·{" "}
              {selected.modeled}/{selected.total} usable inputs.
              {selected.reason ? ` ${selected.reason}.` : ""}
            </p>
          </>
        ) : (
          <p>
            Select a cell to inspect the call/put contributions, source date and
            input coverage.
          </p>
        )}
      </div>
      <p className={styles.note}>
        Calls use a + sign and puts a − sign by convention. Vanna itself can
        have either sign. This map does not reveal dealer inventory or predict
        buying, selling or price direction. Cells cover supplied contracts only;
        coverage is input availability, not a claim of a complete market chain.
        {map.excluded > 0
          ? ` ${map.excluded} adjusted or nonstandard contracts excluded.`
          : ""}
      </p>
      <details className={styles.help}>
        <summary>Model assumptions and calculation</summary>
        <div>
          <p>
            This is modeled European Black–Scholes vanna, not provider-supplied
            vanna. The same raw vanna formula applies to calls and puts: ∂Δ/∂σ =
            −e^(−qT) φ(d₁)d₂/σ, where d₁ = [ln(S/K) + (r − q + σ²/2)T]/(σ√T), d₂
            = d₁ − σ√T.
          </p>
          <p>
            Each contribution = call/put sign × vanna × open interest × 100
            shares × spot × 0.01. IV is a decimal; +1pp means, for example, 30%
            to 31%. Spot is held fixed. A displayed zero requires valid inputs
            and may reflect zero open interest or offsetting contributions.
          </p>
          <p>
            r and q are the editable annual continuous rates above; defaults are
            4% and 0%. Time uses the model clock above, a 365.25-day year, and
            expiry at 21:00 UTC as an approximation, not an official settlement
            time. A date-only clock means 00:00 UTC. Missing, invalid, expired
            or mixed-date inputs make a cell unavailable instead of a partial
            net.
          </p>
          <p>
            American early exercise, discrete dividends, volatility-surface
            changes and actual positions are not modeled. Source dates may
            precede the model clock; stale observations reduce relevance.
            Results are local sensitivities, not a forecast or a hedge
            instruction.{" "}
            <a
              href="https://strata.opengamma.io/apidocs/com/opengamma/strata/pricer/impl/option/BlackScholesFormulaRepository.html"
              target="_blank"
              rel="noreferrer"
            >
              Formula reference: OpenGamma Strata
            </a>
            .
          </p>
        </div>
      </details>
    </section>
  );
}
