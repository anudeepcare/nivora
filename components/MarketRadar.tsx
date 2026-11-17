"use client";

import { useId, useMemo, useState } from "react";
import type { Research } from "../lib/types";
import {
  buildMarketRadar,
  radarCheckpoints,
  type RadarQuadrant,
} from "../lib/market-radar";
import styles from "./MarketRadar.module.css";

const quadrants: RadarQuadrant[] = [
  "Leading",
  "Improving",
  "Weakening",
  "Lagging",
  "In line",
];
const descriptions: Record<RadarQuadrant, string> = {
  Leading: "Ahead of the sample over 20 and 60 sessions",
  Improving: "Ahead over 20 sessions, behind over 60",
  Weakening: "Behind over 20 sessions, ahead over 60",
  Lagging: "Behind the sample over 20 and 60 sessions",
  "In line": "Matches the sample over both windows",
};
const percent = (value: number | null) =>
  value === null
    ? "Unavailable"
    : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const points = (value: number | null) =>
  value === null
    ? "Unavailable"
    : `${value > 0 ? "+" : ""}${value.toFixed(1)} pp`;

export function MarketRadar({
  research,
  asOf,
}: {
  research: Research[];
  asOf?: string;
}) {
  const id = useId();
  const [checkpoint, setCheckpoint] = useState("");
  const [sector, setSector] = useState("all");
  const [query, setQuery] = useState("");
  const dates = useMemo(
    () => radarCheckpoints(research, asOf),
    [research, asOf],
  );
  const latest = dates.at(-1) ?? "";
  const requested = checkpoint && checkpoint <= latest ? checkpoint : latest;
  const model = useMemo(
    () => buildMarketRadar(research, requested || asOf),
    [research, requested, asOf],
  );
  const selectedIndex = Math.max(0, dates.indexOf(model.asOf ?? ""));
  const selectedSector = model.sectors.some((row) => row.sector === sector)
    ? sector
    : "all";
  const visibleSectors = model.sectors.filter(
    (row) => selectedSector === "all" || row.sector === selectedSector,
  );
  const companies = model.companies.filter(
    (item) =>
      (selectedSector === "all" || item.sector === selectedSector) &&
      `${item.symbol} ${item.name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const grouped = quadrants.map((name) => ({
    name,
    members: companies.filter((item) => item.quadrant === name),
  }));

  return (
    <section className={styles.radar} aria-labelledby={`${id}-heading`}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Loaded-universe radar</span>
          <h2 id={`${id}-heading`}>Breadth &amp; rotation</h2>
          <p>
            Participation and relative price strength in the companies loaded
            here.
          </p>
        </div>
        <span className={styles.date}>
          {model.asOf ? `Checkpoint ${model.asOf}` : "Awaiting daily history"}
        </span>
      </header>
      <p className={styles.scope}>
        This is a loaded sample, not market-wide breadth. Sector groups may
        contain just one company. Historical checkpoints use today’s loaded
        universe and can carry survivorship bias.
      </p>
      <div className={styles.controls}>
        <label>
          Checkpoint date
          <input
            type="date"
            value={model.asOf ?? ""}
            min={dates[0]}
            max={latest || undefined}
            disabled={!dates.length}
            onChange={(event) => {
              if (event.target.value) setCheckpoint(event.target.value);
            }}
          />
        </label>
        <label className={styles.slider}>
          Browse completed checkpoints
          <input
            type="range"
            min="0"
            max={Math.max(0, dates.length - 1)}
            value={selectedIndex}
            disabled={dates.length < 2}
            aria-valuetext={model.asOf ?? "No completed history"}
            onChange={(event) =>
              setCheckpoint(dates[Number(event.target.value)])
            }
          />
        </label>
        <button
          type="button"
          disabled={!dates.length || model.asOf === latest}
          onClick={() => setCheckpoint("")}
        >
          Latest available
        </button>
      </div>
      <div className={styles.coverage} role="status" aria-live="polite">
        <div>
          <strong>
            {model.breadthEligible}
            <small> / {model.loaded}</small>
          </strong>
          <span>loaded companies eligible for breadth</span>
        </div>
        <div>
          <strong>
            {model.rotationEligible}
            <small> / {model.loaded}</small>
          </strong>
          <span>eligible for both return windows</span>
        </div>
        <div>
          <strong>{model.excluded}</strong>
          <span>excluded from breadth at this checkpoint</span>
        </div>
      </div>
      {!model.breadthEligible ? (
        <div className={styles.empty}>
          No eligible daily history at this checkpoint. Breadth requires 20
          valid, densely spaced completed observations and a bar on the shared
          date.
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <label>
              Sector filter
              <select
                value={selectedSector}
                onChange={(event) => setSector(event.target.value)}
              >
                <option value="all">All loaded sectors</option>
                {model.sectors.map((row) => (
                  <option key={row.sector} value={row.sector}>
                    {row.sector}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.filterNote}>
              Filters change the display. The sample benchmark keeps the same
              eligible companies.
            </p>
          </div>
          <h3>Sector participation</h3>
          <p className={styles.caption}>
            Percent of eligible companies closing above their own 20-observation
            simple average. An equal close is counted as not above.
          </p>
          <div className={styles.tableWrap}>
            <table>
              <caption className={styles.srOnly}>
                Loaded-sector breadth and price returns as of {model.asOf}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sector</th>
                  <th scope="col">Above average</th>
                  <th scope="col">Breadth coverage</th>
                  <th scope="col">20-session return</th>
                  <th scope="col">60-session return</th>
                  <th scope="col">Return coverage</th>
                  <th scope="col">Relative quadrant</th>
                </tr>
              </thead>
              <tbody>
                {visibleSectors.map((row) => (
                  <tr key={row.sector}>
                    <th scope="row">{row.sector}</th>
                    <td>
                      <span>
                        {row.above20Pct === null
                          ? "Unavailable"
                          : `${row.above20Pct.toFixed(0)}%`}
                      </span>
                      {row.above20Pct !== null && (
                        <span className={styles.track} aria-hidden="true">
                          <span style={{ width: `${row.above20Pct}%` }} />
                        </span>
                      )}
                    </td>
                    <td>
                      {row.eligible} / {row.loaded}
                    </td>
                    <td>{percent(row.return20)}</td>
                    <td>{percent(row.return60)}</td>
                    <td>
                      {row.rotationEligible} / {row.loaded}
                    </td>
                    <td>{row.quadrant ?? "Unavailable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.rotationHeading}>
            <h3>Relative rotation</h3>
            <label>
              Find a company
              <input
                type="search"
                placeholder="Symbol or company"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <p className={styles.caption}>
            {model.benchmark
              ? `Equal-weight sample benchmark: ${model.benchmark.count} companies; ${percent(model.benchmark.return20)} over 20 sessions and ${percent(model.benchmark.return60)} over 60. Company and sector returns are compared with this same basket.`
              : "A sample benchmark requires at least two companies with both 20- and 60-session returns. Relative quadrants are unavailable until that coverage exists."}
          </p>
          {model.benchmark && (
            <div className={styles.quadrants}>
              {grouped.map((group) => (
                <div
                  key={group.name}
                  className={`${styles.quadrant} ${group.name === "Leading" || group.name === "Improving" ? styles.positive : ""}`}
                >
                  <h4>
                    {group.name}
                    <span>{group.members.length}</span>
                  </h4>
                  <p>{descriptions[group.name]}</p>
                  {group.members.length ? (
                    <ul>
                      {group.members.map((item) => (
                        <li key={item.symbol}>
                          <strong title={item.name}>{item.symbol}</strong>
                          <span>
                            20s {points(item.relative20)} · 60s{" "}
                            {points(item.relative60)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.caption}>
                      No matching companies
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {companies.some((item) => !item.quadrant) && (
            <p className={styles.caption}>
              {companies.filter((item) => !item.quadrant).length} matching
              companies lack a relative comparison.
            </p>
          )}
        </>
      )}
      <details className={styles.method}>
        <summary>Coverage &amp; method</summary>
        <p>
          All included companies share the checkpoint date. Return windows use
          the same loaded weekday calendar: {model.start20 ?? "unavailable"} to{" "}
          {model.asOf ?? "unavailable"} (20 sessions), and{" "}
          {model.start60 ?? "unavailable"} to {model.asOf ?? "unavailable"} (60
          sessions). Returns require both endpoints and dense daily coverage;
          the same companies form both sample benchmark windows.
        </p>
        <p>
          Valid positive OHLC prices, at least 80% weekday density, and gaps no
          longer than seven calendar days are required. Today’s bars, weekend
          bars, duplicate dates, demonstration data and crypto are excluded. No
          missing prices are filled. Price returns use supplied bars and exclude
          dividends; provider adjustments may differ. No new market data is
          requested.
        </p>
        <p>
          Sector price returns are equal-weight averages of companies eligible
          for both windows. Relative values are percentage-point differences
          versus the sample benchmark; “Improving” and “Weakening” describe the
          two return windows, not a forecast or a measured quadrant transition.
        </p>
        {model.exclusions.length > 0 && (
          <ul>
            {model.exclusions.map((item) => (
              <li key={item.symbol}>
                {item.symbol}: {item.reason}
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
