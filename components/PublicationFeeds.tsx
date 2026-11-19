"use client";
import { useState } from "react";
import PublicationSearch from "./PublicationSearch";
import {
  publicationSources,
  type PublicationSource,
  type PublicationFeed,
} from "@/lib/publication-feeds";
import { useResource } from "./Session";
import s from "./SentiSensePanels.module.css";
import styles from "./PublicationFeeds.module.css";
export default function PublicationFeeds({ symbol }: { symbol: string }) {
  const [search, setSearch] = useState(false);
  const [source, setSource] = useState<PublicationSource | null>(null);
  const resource = useResource<PublicationFeed>(
    source && !search
      ? `publications/${encodeURIComponent(symbol)}?source=${source}`
      : null,
    undefined,
    300000,
  );
  const data = resource.data;
  return (
    <section aria-label="Publication sources">
      <nav
        className={`${s.tabs} auryn-view-tabs`}
        aria-label="Publication mode"
      >
        <button
          type="button"
          aria-pressed={!search}
          onClick={() => setSearch(false)}
        >
          This stock
        </button>
        <button
          type="button"
          aria-pressed={search}
          onClick={() => setSearch(true)}
        >
          Search publications
        </button>
      </nav>
      {search ? (
        <PublicationSearch />
      ) : (
        <>
          <nav
            className={`${s.tabs} auryn-detail-tabs`}
            aria-label="Publication source"
          >
            {publicationSources.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={source === item}
                onClick={() => setSource(item)}
              >
                {item === "NEWS"
                  ? "News"
                  : item === "REDDIT"
                    ? "Reddit"
                    : item === "SUBSTACK"
                      ? "Substack"
                      : item === "YOUTUBE"
                        ? "YouTube"
                        : "X"}
              </button>
            ))}
          </nav>
          <p>
            Requested window: last 30 days. Publication times are shown when
            supplied. Publisher headlines and article text are not supplied.
          </p>
          {!source ? (
            <p>Select a source to load publications.</p>
          ) : resource.loading ? (
            <p role="status">Loading publications…</p>
          ) : resource.error ? (
            <div role="status">
              <p>{resource.error}</p>
              <button type="button" onClick={() => resource.refresh()}>
                Retry publications
              </button>
            </div>
          ) : data && data.source === source ? (
            <>
              <p>
                {data.rows.length} returned of {data.totalCount} matching
                records.
              </p>
              {data.preview && (
                <p role="note">
                  Limited provider preview. {data.previewReason}
                </p>
              )}
              <ul className={styles.rows} aria-label="Publication links">
                {data.rows.map((row) => (
                  <li key={row.id}>
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.publisher || row.source} ↗
                      </a>
                    ) : (
                      <span>
                        {row.publisher || row.source} · source link unavailable
                      </span>
                    )}{" "}
                    {" · "}
                    {row.published ? (
                      <time dateTime={row.published}>
                        {new Date(row.published).toLocaleString()}
                      </time>
                    ) : (
                      "Publication time unavailable"
                    )}
                  </li>
                ))}
              </ul>
              {!data.rows.length && (
                <p>
                  No matching documents returned. This is not proof of no
                  coverage or activity.
                </p>
              )}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
