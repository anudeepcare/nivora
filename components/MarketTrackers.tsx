"use client";
import ProductLookup from "./ProductLookup";
import { useState } from "react";
import { useResource } from "./Session";
import {
  trackerGroups,
  type TrackerCatalogItem,
  type TrackerSnapshot,
  type TrackerMetric,
} from "@/lib/market-trackers";
import styles from "./MarketTrackers.module.css";
type Reply<T> = { data: T; retrievedAt: string };
const show = (m: TrackerMetric) =>
  m.value === null
    ? "Not supplied"
    : `${typeof m.value === "number" ? m.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : m.value}${m.unit ? ` ${m.unit}` : ""}`;
export default function MarketTrackers() {
  const catalog = useResource<Reply<TrackerCatalogItem[]>>(
    "market-trackers",
    undefined,
    300000,
  );
  const [selected, setSelected] = useState<string | null>(null),
    [page, setPage] = useState(0);
  const snapshot = useResource<Reply<TrackerSnapshot>>(
    selected ? `market-trackers?id=${encodeURIComponent(selected)}` : null,
    undefined,
    300000,
  );
  const data = snapshot.data?.data;
  return (
    <section className={styles.root} aria-label="Market trackers">
      <header>
        <h2>Market trackers</h2>
        <p>
          Choose one board. Observations and reported activity, not trade
          recommendations. No background loading of other boards.
        </p>
      </header>
      {catalog.loading ? (
        <p role="status">Loading available trackers…</p>
      ) : catalog.error ? (
        <p role="status">{catalog.error}</p>
      ) : (
        <nav aria-label="Tracker categories">
          {Object.entries(trackerGroups).map(([group, ids]) => {
            const items = (catalog.data?.data ?? []).filter((x) =>
              (ids as readonly string[]).includes(x.id),
            );
            return items.length ? (
              <section key={group}>
                <h3>{group}</h3>
                <div className={styles.choices}>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      aria-pressed={selected === item.id}
                      onClick={() => {
                        setSelected(item.id);
                        setPage(0);
                      }}
                    >
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                      <small>
                        {item.tier === "pro"
                          ? "Provider PRO / preview"
                          : "Provider free tier"}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            ) : null;
          })}
        </nav>
      )}
      {!selected ? (
        <p>Select a tracker to request its current snapshot.</p>
      ) : snapshot.loading ? (
        <p role="status">Loading selected snapshot…</p>
      ) : snapshot.error ? (
        <p role="status">{snapshot.error}</p>
      ) : data && data.id === selected ? (
        <section aria-label={data.name} className={styles.board}>
          <header>
            <h2>{data.name}</h2>
            <p>{data.description}</p>
            <p>
              Provider data as of {data.asOf ?? "not supplied"}. Retrieved{" "}
              {snapshot.data?.retrievedAt}. Snapshot dates are not a live-feed
              guarantee.
            </p>
          </header>
          {data.preview && (
            <p role="note">
              Limited provider preview: rows or columns may be withheld.{" "}
              {data.withheld.length
                ? `Withheld layers: ${data.withheld.join(", ")}.`
                : ""}
            </p>
          )}
          {data.id === "market-heatmap" && (
            <p>
              This is the heatmap’s price table, not an area-scaled heatmap.
              Quotes are delayed. Proprietary sentiment/options overlays are not
              displayed here.
            </p>
          )}
          <div className={styles.headlines}>
            {data.headline.map((m, i) => (
              <div key={`${m.label}-${i}`}>
                <span>{m.label}</span>
                <strong>{show(m)}</strong>
                {m.asOf && <small>{m.asOf}</small>}
                {m.period && <small>Period: {m.period}</small>}
                {m.flags.length > 0 && (
                  <small>Provider flags: {m.flags.join(", ")}</small>
                )}
                {m.note && <small>{m.note}</small>}
                {m.sourceUrl && (
                  <a href={m.sourceUrl} target="_blank" rel="noreferrer">
                    Evidence source ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          <p>
            {data.rows.length} returned rows
            {data.totalCount !== null ? ` of ${data.totalCount} reported` : ""}.
            Missing readings remain unavailable.
          </p>
          <div className={styles.rows}>
            {data.rows.slice(page * 25, (page + 1) * 25).map((row) => (
              <article key={row.id}>
                <header>
                  <h3>{row.name}</h3>
                  <span>{row.category}</span>
                </header>
                <dl>
                  {row.metrics.map((m, i) => (
                    <div key={`${m.label}-${i}`}>
                      <dt>{m.label}</dt>
                      <dd>{show(m)}</dd>
                      {m.asOf && <small>As of {m.asOf}</small>}
                      {m.period && <small>Period: {m.period}</small>}
                      {m.flags.length > 0 && (
                        <small>Provider flags: {m.flags.join(", ")}</small>
                      )}
                      {m.note && <small>{m.note}</small>}
                      {m.sourceUrl && (
                        <a href={m.sourceUrl} target="_blank" rel="noreferrer">
                          Evidence source ↗
                        </a>
                      )}
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          {!data.rows.length && (
            <p>
              No rows returned. This does not establish that no activity
              occurred.
            </p>
          )}
          {data.rows.length > 25 && (
            <div className={styles.paging}>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page + 1} of {Math.ceil(data.rows.length / 25)}
              </span>
              <button
                disabled={(page + 1) * 25 >= data.rows.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
          <a
            href="https://sentisense.ai/methodology"
            target="_blank"
            rel="noreferrer"
          >
            Provider methodology ↗
          </a>
        </section>
      ) : null}
      <ProductLookup />
    </section>
  );
}
