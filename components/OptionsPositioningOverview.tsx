"use client";
import { useMemo } from "react";
import { Activity, ArrowLeftRight, Layers, MoveHorizontal } from "lucide-react";
import { optionsPositioning } from "@/lib/options-positioning";
import { dateLabel } from "@/lib/format";
import styles from "./OptionsPositioningOverview.module.css";
const number = (n: number | null) =>
  n == null
    ? "Not supplied"
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
export default function OptionsPositioningOverview({
  data,
}: {
  data: unknown;
}) {
  const p = useMemo(() => optionsPositioning(data), [data]);
  const maximum = Math.max(
    0,
    ...p.contracts.flatMap((c) => (c.volume == null ? [] : [c.volume])),
  );
  const tiles = [
    ["ATM implied volatility", p.metrics.atmIv, "%", Activity, "volatility"],
    ["Put / call volume", p.metrics.pcVol, "×", ArrowLeftRight, "volume"],
    ["Put / call open interest", p.metrics.pcOi, "×", Layers, "interest"],
    [
      "1-day expected move · 90% range",
      p.metrics.expectedMove,
      "%",
      MoveHorizontal,
      "range",
    ],
  ] as const;
  return (
    <section className={styles.root} aria-label="Options positioning overview">
      <header>
        <h3>Session snapshot</h3>
        <span>{p.asOf ? dateLabel(p.asOf) : "Snapshot date not supplied"}</span>
        <details data-info-disclosure>
          <summary aria-label="About options observations">ⓘ</summary>
          <p>
            End-of-day research observations, not executable prices. Calls and
            puts do not reveal buyer/seller direction. The expected range is an
            estimate, not a guaranteed outcome.
          </p>
        </details>
      </header>
      <div className={styles.metrics}>
        {tiles.map(([label, value, unit, Icon, family]) => (
          <article key={label} data-family={family}>
            <span>
              <Icon size={16} aria-hidden="true" />
              {label}
            </span>
            <strong>
              {number(value)}
              {value != null ? unit : ""}
            </strong>
          </article>
        ))}
      </div>
      <section
        className={styles.volume}
        aria-label="Reported call and put volume"
      >
        <header>
          <h4>Reported volume</h4>
          <span className={styles.legend}>
            <span data-side="Call">
              <i aria-hidden="true" />
              Calls {number(p.call)}
            </span>
            <span data-side="Put">
              <i aria-hidden="true" />
              Puts {number(p.put)}
            </span>
          </span>
        </header>
        {p.callShare != null ? (
          <div
            className={styles.split}
            role="img"
            aria-label={`Calls ${(p.callShare * 100).toFixed(1)}%, puts ${((1 - p.callShare) * 100).toFixed(1)}% of supplied volume`}
          >
            <i style={{ width: `${p.callShare * 100}%` }} />
            <b style={{ width: `${(1 - p.callShare) * 100}%` }} />
          </div>
        ) : (
          <p>
            Volume split unavailable: both nonnegative readings and a positive
            total are required.
          </p>
        )}
      </section>
      <section
        className={styles.volume}
        aria-label="Reported open-interest concentrations"
      >
        <header>
          <h4>Open-interest concentrations</h4>
          <span>
            {p.walls.expiry
              ? `Expiry ${dateLabel(p.walls.expiry)}`
              : "Expiry not supplied"}
          </span>
        </header>
        {p.walls.rows.length ? (
          <div
            className={styles.scroll}
            tabIndex={0}
            role="region"
            aria-label="Reported strike open interest"
          >
            {p.walls.rows.map((wall, index) => (
              <div
                className={styles.wall}
                data-side={wall.side}
                key={`${wall.side}-${wall.strike}-${index}`}
              >
                <span>
                  {wall.side} · ${number(wall.strike)}
                </span>
                <div
                  className={styles.wallMeter}
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(
                    1,
                    ...p.walls.rows.map((row) => row.oi),
                  )}
                  aria-valuenow={wall.oi}
                  aria-label={`${wall.side} ${wall.strike} open interest`}
                >
                  <span
                    style={{
                      width: `${(wall.oi / Math.max(1, ...p.walls.rows.map((row) => row.oi))) * 100}%`,
                    }}
                  />
                </div>
                <strong>{number(wall.oi)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No dated strike-level concentrations supplied.</p>
        )}
        <p>
          {p.walls.maxPain != null && (
            <>Reported max pain ${number(p.walls.maxPain)} · </>
          )}
          Colors distinguish contract types, not trade direction. Reported
          subset, not the full chain. Open interest is not dealer gamma or trade
          direction.
        </p>
      </section>
      <section
        className={styles.activity}
        aria-label="Published large-print summary"
      >
        <header>
          <h4>Published large prints</h4>
          <span>Latest published prints session; date not supplied</span>
        </header>
        <div className={styles.metrics}>
          <article>
            <span>Published event count</span>
            <strong>{number(p.prints.count)}</strong>
          </article>
          <article>
            <span>Largest premium percentile · 0–100</span>
            <strong>{number(p.prints.percentile)}</strong>
          </article>
        </div>
        <p>
          One event groups a contract’s fills into an order after the close. The
          percentile compares premium with this ticker’s own trailing prints; it
          is not a probability or trade direction. The prints session need not
          match the snapshot date above. Contract strikes, sides and a
          contract-level tape are not supplied by this summary.
        </p>
      </section>
      <section
        className={styles.activity}
        aria-label="Reported unusual contract activity"
      >
        <header>
          <h4>Reported contract activity</h4>
          <span>{p.contracts.length} supplied contracts</span>
        </header>
        <p>
          Color intensity shows volume within this reported subset only. This is
          not a full option chain or a signal to buy or sell.
        </p>
        {p.contracts.length ? (
          <div
            className={styles.scroll}
            tabIndex={0}
            role="region"
            aria-label="Contract activity grid"
          >
            <div className={styles.grid}>
              {p.contracts.map((c) => (
                <details
                  key={c.contract}
                  style={{
                    background:
                      c.volume != null && maximum > 0
                        ? `color-mix(in srgb, var(--blue) ${Math.round(5 + (c.volume / maximum) * 23)}%, var(--surface))`
                        : undefined,
                  }}
                >
                  <summary>
                    <span>
                      {dateLabel(c.expiry)} · {c.type}
                    </span>
                    <strong>${number(c.strike)}</strong>
                    <span>Volume {number(c.volume)}</span>
                  </summary>
                  <p>
                    {c.contract}
                    <br />
                    Open interest {number(c.oi)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ) : (
          <p>
            No dated, unambiguous contract observations supplied. Missing
            strikes, expiries, and Greeks are not estimated.
          </p>
        )}
        {!!p.omitted && (
          <small>
            {p.omitted} incomplete or ambiguous contract records omitted from
            the activity grid; available source fields remain in the table
            below.
          </small>
        )}
      </section>
    </section>
  );
}
