"use client";
import { useState } from "react";
import { useProduct, useResource } from "./Session";
import type { MarketCapSeries } from "@/lib/market-cap-history";
import s from "./MarketCapHistory.module.css";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
export default function MarketCapHistory({ symbol }: { symbol: string }) {
  const { demo } = useProduct();
  const [open, setOpen] = useState(false),
    [index, setIndex] = useState<number | null>(null);
  const resource = useResource<MarketCapSeries>(
    open && !demo ? `market-cap/${encodeURIComponent(symbol)}` : null,
    undefined,
    86400000,
  );
  const result =
    resource.data?.symbol === symbol.replace(/\.US$/, "")
      ? resource.data
      : null;
  const rows = result?.rows ?? [],
    active = rows[index ?? rows.length - 1] ?? rows.at(-1);
  const start = rows[0],
    end = rows.at(-1),
    min = Math.min(...rows.map((r) => r.value)),
    max = Math.max(...rows.map((r) => r.value)),
    span = max - min || 1;
  const elapsed =
    start && end ? Date.parse(end.date) - Date.parse(start.date) : 0;
  if (demo) return null;
  return (
    <div className={s.history}>
      <button
        type="button"
        className={s.toggle}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Market capitalization history{" "}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open &&
        (resource.loading ? (
          <p role="status">Loading weekly observations…</p>
        ) : resource.error ? (
          <div>
            <p role="status">{resource.error}</p>
            <button type="button" onClick={resource.refresh}>
              Retry history
            </button>
          </div>
        ) : !active ? (
          <p role="status">
            No market capitalization observations returned for this listing.
          </p>
        ) : (
          <div className={s.detail}>
            <div className={s.readout}>
              <strong>{money(active.value)}</strong>
              <span>{active.date} · USD</span>
              <details data-info-disclosure>
                <summary aria-label="Market capitalization methodology">
                  ⓘ
                </summary>
                <p>
                  Weekly EODHD observations for NYSE/NASDAQ equities. Market
                  capitalization is company equity value, not enterprise value
                  or your investment return. Dots are dated samples; gaps are
                  not filled.
                </p>
              </details>
            </div>
            {rows.length > 1 && (
              <>
                <svg
                  viewBox="0 0 640 110"
                  role="img"
                  aria-label={`Weekly market capitalization from ${start.date} to ${end!.date}`}
                  className={s.plot}
                >
                  <line x1="12" x2="628" y1="88" y2="88" stroke="var(--line)" />
                  {rows.map((row) => (
                    <circle
                      key={row.date}
                      cx={
                        12 +
                        (elapsed
                          ? (Date.parse(row.date) - Date.parse(start.date)) /
                            elapsed
                          : 0) *
                          616
                      }
                      cy={88 - ((row.value - min) / span) * 72}
                      r={row.date === active.date ? 4 : 2.5}
                      fill="var(--blue)"
                      opacity={row.date === active.date ? 1 : 0.6}
                    >
                      <title>{`${row.date}: ${money(row.value)}`}</title>
                    </circle>
                  ))}
                </svg>
                <input
                  aria-label="Market capitalization observation"
                  aria-valuetext={`${active.date}: ${money(active.value)} USD`}
                  type="range"
                  min="0"
                  max={rows.length - 1}
                  value={index ?? rows.length - 1}
                  onChange={(e) => setIndex(Number(e.target.value))}
                />
                <div className={s.dates}>
                  <span>{start.date}</span>
                  <span>{end!.date}</span>
                </div>
              </>
            )}
          </div>
        ))}
    </div>
  );
}
