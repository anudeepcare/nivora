"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { UsGdp } from "@/lib/us-macro";
import s from "./EconomicContext.module.css";
export default function UsMacro() {
  const [open, setOpen] = useState(false);
  const r = useResource<UsGdp>(open ? "us-macro" : null, undefined, 3600000);
  return (
    <section className={s.body} aria-label="US annual GDP history">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        US annual GDP growth {open ? "−" : "+"}
      </button>
      {open && (
        <>
          <p>
            Annual economic context, not a live growth reading or trading
            forecast.
          </p>
          {r.loading ? (
            <p role="status">Loading annual GDP history…</p>
          ) : r.error ? (
            <p role="status">
              {r.error} <button onClick={r.refresh}>Retry</button>
            </p>
          ) : r.data ? (
            <>
              {r.data.rows.length ? (
                <div
                  className={s.scroll}
                  tabIndex={0}
                  role="region"
                  aria-label="Annual GDP observations"
                >
                  <table>
                    <caption>
                      US GDP growth · annual % · period-end dates
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Annual period ending</th>
                        <th scope="col">GDP growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...r.data.rows].reverse().map((row) => (
                        <tr key={row.date}>
                          <td>
                            <time dateTime={row.date}>{row.date}</time>
                          </td>
                          <td>
                            {row.value === null
                              ? "Not supplied"
                              : `${row.value.toLocaleString(undefined, { maximumFractionDigits: 3 })}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No annual observations returned. No values are inferred.</p>
              )}
              <details>
                <summary>Source, dates &amp; coverage</summary>
                <p>
                  EODHD macro indicators, sourced from World Bank WDI. Dates
                  describe annual periods, not publication dates. Historical
                  values can be revised; this feed supplies no publication date
                  or historical vintage. Latest 20 returned annual observations;{" "}
                  {r.data.omitted} older observations omitted.
                </p>
                <p>
                  Checked {r.data.checkedAt}. Configured server cache interval:
                  24 hours; cached data may be older. This is not a new
                  observation or acquisition timestamp.
                </p>
              </details>
            </>
          ) : (
            <p role="status">Annual observations are unavailable.</p>
          )}
        </>
      )}
    </section>
  );
}
