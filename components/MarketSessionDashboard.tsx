import type { TrackerSnapshot, TrackerMetric } from "@/lib/market-trackers";
import s from "./MarketSessionDashboard.module.css";
const numeric = (m?: TrackerMetric) =>
  typeof m?.value === "number" && Number.isFinite(m.value) ? m.value : null;
const format = (m: TrackerMetric) =>
  m.value === null
    ? "Not supplied"
    : `${typeof m.value === "number" ? m.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : m.value}${m.unit ? ` ${m.unit}` : ""}`;
function Evidence({ metrics }: { metrics: TrackerMetric[] }) {
  return (
    <details className={s.evidence}>
      <summary>Exact readings & source dates</summary>
      <dl>
        {metrics.map((m, i) => (
          <div key={i}>
            <dt>{m.label}</dt>
            <dd>{format(m)}</dd>
            {m.asOf && <small>As of {m.asOf}</small>}
            {m.period && <small>Period: {m.period}</small>}
            {m.note && <small>{m.note}</small>}
            {m.flags.length > 0 && (
              <small>Provider flags: {m.flags.join(", ")}</small>
            )}
            {m.sourceUrl && (
              <a href={m.sourceUrl} target="_blank" rel="noreferrer">
                Evidence source ↗
              </a>
            )}
          </div>
        ))}
      </dl>
    </details>
  );
}
export default function MarketSessionDashboard({
  data,
}: {
  data: TrackerSnapshot;
}) {
  const find = (label: string) =>
    data.headline.find((m) => m.label.toLowerCase() === label);
  const groups = [
    { label: "Higher", key: "companies higher", tone: "up" },
    { label: "Lower", key: "companies lower", tone: "down" },
    { label: "Unchanged", key: "companies unchanged", tone: "flat" },
  ].map((g) => ({ ...g, value: numeric(find(g.key)) }));
  const total = numeric(find("companies counted"));
  const valid =
    total !== null &&
    total > 0 &&
    groups.every(
      (g) => g.value !== null && g.value >= 0 && Number.isInteger(g.value),
    ) &&
    groups.reduce((sum, g) => sum + (g.value ?? 0), 0) === total;
  const changes = data.rows.map((row) =>
    numeric(
      row.metrics.find(
        (m) =>
          m.label.toLowerCase() === "change" &&
          m.unit?.toLowerCase() === "percent",
      ),
    ),
  );
  const maxChange = Math.max(...changes.map((v) => Math.abs(v ?? 0)), 0.01);
  return (
    <div className={s.root}>
      <section className={s.breadth} aria-label="Company price breadth">
        <header>
          <div>
            <h3>How broad was the move?</h3>
            <p>Delayed company prices versus previous close</p>
          </div>
          <span>
            {total === null
              ? "Count unavailable"
              : `${total.toLocaleString()} companies counted`}
          </span>
        </header>
        {valid ? (
          <div
            className={s.stack}
            role="img"
            aria-label="Company price breadth proportions"
          >
            {groups.map((g) => (
              <span
                key={g.key}
                data-direction={g.tone}
                style={{ width: `${(g.value! / total!) * 100}%` }}
              />
            ))}
          </div>
        ) : (
          <p>Not enough consistent counts to plot breadth.</p>
        )}
        <div className={s.counts}>
          {groups.map((g) => (
            <div key={g.key} data-direction={g.tone}>
              <span>{g.label}</span>
              <strong>
                {g.value === null ? "Not supplied" : g.value.toLocaleString()}
              </strong>
              {valid && (
                <small>
                  {((g.value! / total!) * 100).toFixed(1)}% of counted companies
                </small>
              )}
            </div>
          ))}
        </div>
        <p className={s.note}>
          As of {data.asOf ?? "not supplied"}. Company counts, not index weights
          or sentiment.
        </p>
        <Evidence metrics={data.headline} />
      </section>
      <section aria-label="ETF session comparison">
        <header>
          <h3>Index ETF snapshot</h3>
          <p>
            Changes compared on one shared scale. Not a historical price chart.
          </p>
        </header>
        <div className={s.funds}>
          {data.rows.map((row, i) => {
            const change = changes[i];
            const price = row.metrics.find(
              (m) => m.label.toLowerCase() === "price",
            );
            return (
              <article
                key={row.id}
                data-direction={
                  change === null || change === 0
                    ? "flat"
                    : change > 0
                      ? "up"
                      : "down"
                }
              >
                <header>
                  <div>
                    <strong>{row.id}</strong>
                    <h4>{row.name}</h4>
                    <p>{row.category}</p>
                  </div>
                  <div className={s.value}>
                    <strong>
                      {change === null
                        ? "Not supplied"
                        : `${change < 0 ? "−" : change > 0 ? "+" : ""}${Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
                    </strong>
                    <span>{price ? format(price) : "Price not supplied"}</span>
                  </div>
                </header>
                {change !== null && (
                  <svg
                    viewBox="0 0 400 16"
                    className={s.bar}
                    aria-hidden="true"
                  >
                    <line x1="200" x2="200" y1="0" y2="16" />
                    <rect
                      x={
                        change < 0
                          ? 200 - (Math.abs(change) / maxChange) * 200
                          : 200
                      }
                      y="4"
                      width={(Math.abs(change) / maxChange) * 200}
                      height="8"
                      rx="3"
                    />
                  </svg>
                )}
                <Evidence metrics={row.metrics} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
