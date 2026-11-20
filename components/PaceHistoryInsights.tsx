"use client";
import { useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { paceHistoryInsights } from "@/lib/pace-history-insights";
import styles from "./PaceHistoryInsights.module.css";
const zoneLabel = (zone: number) => (zone === 0 ? "P0 · Pause" : `P${zone}`);
const pct = (value: number | null) =>
  value === null
    ? "Not available"
    : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
export default function PaceHistoryInsights({
  research,
}: {
  research: Research;
}) {
  const data = useMemo(
    () =>
      paceHistoryInsights(
        research.history,
        research.retrievedAt,
        research.company.assetType === "crypto" ? "crypto" : "us-equity",
      ),
    [research.history, research.retrievedAt, research.company.assetType],
  );
  const [selected, setSelected] = useState(2);
  const zone = data.zones.find((row) => row.zone === selected)!;
  const returnScale = Math.max(
    1,
    ...zone.outcomes.map((o) => Math.abs(o.medianReturn ?? 0)),
  );
  if (!data.available)
    return (
      <section
        className={styles.unavailable}
        aria-label="Pace historical evidence"
      >
        <strong>Historical outcomes not available</strong>
        <span>
          The supplied price history has no eligible monthly readings.
        </span>
        <details>
          <summary>History requirements</summary>
          <p>{data.reason}</p>
          <p>
            This does not mean a P0 reading or a zero return. Current price
            evidence remains separate.
          </p>
        </details>
      </section>
    );
  return (
    <section className={styles.history} aria-label="Pace historical evidence">
      <header className={styles.heading}>
        <div>
          <span className="eyebrow">Monthly price evidence</span>
          <h3>How this zone behaved before</h3>
        </div>
        <div className={styles.controls}>
          <label htmlFor="pace-history-zone">Explore a zone</label>
          <select
            id="pace-history-zone"
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {data.zones.map((z) => (
              <option key={z.zone} value={z.zone}>
                {zoneLabel(z.zone)}
              </option>
            ))}
          </select>
        </div>
      </header>
      <p className={styles.note}>
        Selected zone, not the current reading. Historical observations, not a
        forecast.
      </p>
      <dl className={styles.stats}>
        <div>
          <dt>Observed visits</dt>
          <dd>
            <strong>{zone.visits}</strong>
            <small>
              {zone.months} confirmed {zone.months === 1 ? "month" : "months"}
            </small>
          </dd>
        </div>
        <div>
          <dt>Median completed stay</dt>
          <dd>
            <strong>
              {zone.medianDuration === null
                ? "Not available"
                : `${zone.medianDuration} ${zone.medianDuration === 1 ? "month" : "months"}`}
            </strong>
            <small>
              {zone.completedVisits} fully observed{" "}
              {zone.completedVisits === 1 ? "stay" : "stays"}
            </small>
          </dd>
        </div>
        <div>
          <dt>Duration range</dt>
          <dd>
            <strong>
              {zone.durationRange
                ? `${zone.durationRange[0]}–${zone.durationRange[1]} months`
                : "Not available"}
            </strong>
            <small>Shortest to longest completed stay</small>
          </dd>
        </div>
      </dl>
      <h4>After entering {zoneLabel(zone.zone)}</h4>
      <div
        className={styles.scroll}
        tabIndex={0}
        role="region"
        aria-label="Price change after entering the selected zone"
      >
        <table>
          <caption className={styles.outcomeCaption}>
            Price changes after a newly confirmed visit
          </caption>
          <thead>
            <tr>
              <th scope="col">Horizon</th>
              <th scope="col">Median change</th>
              <th scope="col">Worst observed downside</th>
              <th scope="col">Samples</th>
            </tr>
          </thead>
          <tbody>
            {zone.outcomes.map((outcome) => (
              <tr key={outcome.months}>
                <th scope="row">{outcome.months} months</th>
                <td>
                  <span
                    className={styles.returnValue}
                    data-direction={
                      outcome.medianReturn === null
                        ? "missing"
                        : outcome.medianReturn > 0
                          ? "positive"
                          : outcome.medianReturn < 0
                            ? "negative"
                            : "flat"
                    }
                  >
                    {pct(outcome.medianReturn)}
                  </span>
                  {outcome.count > 0 && outcome.medianReturn !== null && (
                    <span className={styles.outcomeBar} aria-hidden="true">
                      <i
                        style={{
                          left: `${outcome.medianReturn < 0 ? 50 - (Math.abs(outcome.medianReturn) / returnScale) * 48 : 50}%`,
                          width: `${(Math.abs(outcome.medianReturn) / returnScale) * 48}%`,
                        }}
                        data-direction={
                          outcome.medianReturn < 0 ? "negative" : "positive"
                        }
                      />
                    </span>
                  )}
                </td>
                <td>
                  <span className={styles.downside}>
                    {pct(outcome.worstDownside)}
                  </span>
                </td>
                <td>
                  <span
                    className={outcome.count < 5 ? styles.limited : undefined}
                  >
                    {outcome.count} {outcome.count === 1 ? "sample" : "samples"}
                    {outcome.count < 5 ? " · limited" : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className={styles.methods} data-research-disclosure>
        <summary>Method and limitations</summary>
        <p className={styles.note}>
          A visit is a consecutive run of confirmed monthly closes in the same
          zone. Ongoing stays and stays cut off by the start of history or a gap
          are excluded from duration statistics.
        </p>
        <p className={styles.note}>
          Measured from the first confirmed month-end close to the close 6, 12
          or 24 calendar months later. Only fully elapsed windows with every
          month-end present qualify. Overlapping visits are skipped within each
          zone and horizon; horizons and zones can still share market periods.
          Downside is the largest decline from the entry close to an available
          later daily low, not peak-to-trough drawdown. Sparse observations can
          miss lows. These small, related samples are descriptive, not
          independent evidence or a forecast. Dividends, fees and business
          fundamentals are excluded.
        </p>
      </details>
      <details data-research-disclosure>
        <summary>
          Confirmed vs temporary readings · latest 12 observed months
        </summary>
        <div
          className={styles.scroll}
          tabIndex={0}
          role="region"
          aria-label="Settled and temporary monthly readings"
        >
          <table>
            <caption>
              {data.version} · available settled observations; earlier readings
              retain their original policy
            </caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Confirmed</th>
                <th scope="col">Deepest daily-close reading</th>
                <th scope="col">Deepest band touched</th>
              </tr>
            </thead>
            <tbody>
              {data.rows
                .slice(-12)
                .reverse()
                .map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{row.month}</th>
                    <td>
                      {row.confirmed === null
                        ? `Forming P${row.forming}`
                        : zoneLabel(row.confirmed)}
                    </td>
                    <td>
                      {zoneLabel(row.strongest)}
                      <small>{row.observations} observations</small>
                    </td>
                    <td>
                      {row.touched === null
                        ? "None observed"
                        : `P${row.touched} band`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Daily-close readings reconstruct the monthly policy using only prior
          completed months. A band touch uses an observed daily low against that
          month’s fixed thresholds; it is not a confirmed signal or proof of
          support. The deepest daily-close reading may reverse before month-end.
          Missing daily observations cannot establish that no touch occurred. P0
          is a separate extension/pause condition.
        </p>
      </details>
    </section>
  );
}
