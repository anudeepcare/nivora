"use client";
import { useState } from "react";
import { amount, percent, dateLabel } from "@/lib/format";
import s from "./TechnicalLevelMap.module.css";
type Level = {
  name: string;
  price: number | null;
  period: string;
  asOf: string | null;
};
export default function TechnicalLevelMap({
  spot,
  currency,
  levels,
}: {
  spot: number | null;
  currency: string;
  levels: Level[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const valid = levels
    .filter(
      (l): l is Level & { price: number } =>
        l.price !== null && Number.isFinite(l.price) && l.price > 0,
    )
    .sort((a, b) => b.price - a.price);
  if (!spot || !Number.isFinite(spot) || spot <= 0 || !valid.length)
    return null;
  const max = Math.max(
    5,
    ...valid.map((l) => Math.abs((l.price / spot - 1) * 100)),
  );
  const focus = valid.find((l) => l.name === selected);
  return (
    <section className={s.map}>
      <header>
        <div>
          <h3>Where price sits</h3>
          <p>Compare the stock price with completed-period reference levels.</p>
        </div>
        <span>
          Reference <strong>{amount(spot, currency)}</strong>
        </span>
      </header>
      <div className={s.levels}>
        {valid.map((l) => {
          const distance = (l.price / spot - 1) * 100;
          return (
            <button
              key={l.name}
              type="button"
              aria-pressed={selected === l.name}
              onClick={() => setSelected(selected === l.name ? null : l.name)}
            >
              <span>
                <strong>{l.name}</strong>
                <small>{l.period}</small>
              </span>
              <span className={s.track} aria-hidden="true">
                <i style={{ left: `${50 + (distance / max) * 45}%` }} />
              </span>
              <span>
                <b>{amount(l.price, currency)}</b>
                <small>
                  {percent(Math.abs(distance))}{" "}
                  {distance >= 0 ? "above" : "below"} price
                </small>
              </span>
            </button>
          );
        })}
      </div>
      {focus && (
        <p className={s.detail} role="status">
          <strong>{focus.name}</strong> · {focus.period} · through{" "}
          {dateLabel(focus.asOf)}. A historical reference, not a guaranteed
          reversal level. Price crossing this level alone does not change your
          business assessment or position limit.
        </p>
      )}
      <small className={s.note}>
        Center marks the reference price. Daily and weekly averages use
        different periods; gamma exposure is shown separately in Options.
      </small>
    </section>
  );
}
