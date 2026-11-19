import type { TrackerSnapshot } from "@/lib/market-trackers";
import s from "./TrackerPriceTiles.module.css";
export default function TrackerPriceTiles({
  rows,
}: {
  rows: TrackerSnapshot["rows"];
}) {
  return (
    <section aria-label="Delayed price-change tiles">
      <p className={s.note}>
        Equal-sized tiles show direction only, not market-cap weights or
        intensity. Prices are delayed; individual observation times may differ.
        No sentiment or options overlay is inferred.
      </p>
      <div className={s.legend}>
        <span>Blue · positive</span>
        <span>Amber · negative</span>
        <span>Neutral · unchanged or unavailable (labeled)</span>
      </div>
      <div className={s.grid}>
        {rows.map((row) => {
          const metric = row.metrics.find(
              (m) => m.label === "Price change" && m.unit === "percent",
            ),
            price = row.metrics.find(
              (m) => m.label === "Delayed price" && m.unit === "usd",
            );
          const change =
            typeof metric?.value === "number" && Number.isFinite(metric.value)
              ? metric.value
              : null;
          const tone =
            change === null
              ? "missing"
              : change > 0
                ? "positive"
                : change < 0
                  ? "negative"
                  : "flat";
          return (
            <article key={row.id} data-tone={tone} className={s.tile}>
              <strong>
                {row.researchSymbol ? (
                  <a
                    href={`/research/${encodeURIComponent(row.researchSymbol)}`}
                    aria-label={`Research ${row.researchSymbol}`}
                  >
                    {row.name} ↗
                  </a>
                ) : (
                  row.name
                )}
              </strong>
              {row.category && <small>{row.category}</small>}
              <span className={s.value}>
                {change === null
                  ? "Not supplied"
                  : `${change > 0 ? "+" : ""}${change.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
              </span>
              <small>
                {typeof price?.value === "number"
                  ? `$${price.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} delayed price`
                  : "Price not supplied"}
              </small>
              <small>As of {metric?.asOf ?? "Time not supplied"}</small>
              <details>
                <summary>Reported values</summary>
                <dl>
                  {row.metrics.map((m, i) => (
                    <div key={`${m.label}-${i}`}>
                      <dt>{m.label}</dt>
                      <dd>
                        {m.value === null
                          ? "Not supplied"
                          : `${m.value} ${m.unit ?? ""}`}
                      </dd>
                      {m.asOf && <small>{m.asOf}</small>}
                    </div>
                  ))}
                </dl>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
