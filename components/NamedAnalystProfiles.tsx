"use client";
import { useState } from "react";
import { useResource } from "./Session";
import {
  namedAnalysts,
  type PersonProfile,
  type PersonCalls,
} from "@/lib/analyst-person";
import styles from "./MarketTrackers.module.css";
type Reply = { data: PersonProfile | PersonCalls; retrievedAt: string };
const value = (n: number | null) =>
  n === null
    ? "Not supplied"
    : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export default function NamedAnalystProfiles({ data }: { data: unknown }) {
  const people = namedAnalysts(data);
  const [slug, setSlug] = useState<string | null>(null),
    [mode, setMode] = useState<"profile" | "calls">("profile"),
    [offset, setOffset] = useState(0);
  const resource = useResource<Reply>(
    slug ? `analyst-person?slug=${slug}&mode=${mode}&offset=${offset}` : null,
    undefined,
    300000,
  );
  const result = resource.data?.data;
  const profile =
    mode === "profile" && result?.slug === slug && "coverage" in result
      ? result
      : null;
  const calls =
    mode === "calls" &&
    result?.slug === slug &&
    "rows" in result &&
    result.offset === offset
      ? result
      : null;
  return (
    <section className={styles.root} aria-label="Named analyst profiles">
      <header className={styles.analystHeading}>
        <h3>Named analysts & published notes</h3>
        <details className={styles.analystNotes}>
          <summary>Coverage &amp; target notes</summary>
          <p>
            Named profiles use attributed coverage. Unnamed firm notes remain in
            coverage; these records are not accuracy rankings.
          </p>
          <p>
            Target units are as published; currency is not supplied here.
            Original and split-adjusted targets are separate, not returns. Note
            dates are not employment dates.
          </p>
        </details>
      </header>
      <div className={styles.analystControls}>
        {!people.length ? (
          <p>
            No linked analyst profiles were supplied in this coverage slice.
          </p>
        ) : (
          <label className={styles.analystPicker}>
            Analyst · {people.length} linked analysts
            <select
              value={slug ?? ""}
              onChange={(event) => {
                setSlug(event.target.value || null);
                setMode("profile");
                setOffset(0);
              }}
            >
              <option value="">Choose an analyst</option>
              {people.map((person) => (
                <option key={person.slug} value={person.slug}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {slug && (
          <div
            className={`${styles.analystViews} auryn-detail-tabs`}
            role="group"
            aria-label="Analyst evidence views"
          >
            <button
              aria-pressed={mode === "profile"}
              onClick={() => {
                setMode("profile");
                setOffset(0);
              }}
            >
              Profile & coverage
            </button>
            <button
              aria-pressed={mode === "calls"}
              onClick={() => {
                setMode("calls");
                setOffset(0);
              }}
            >
              Published calls
            </button>
          </div>
        )}
      </div>
      {slug && (
        <>
          {resource.loading ? (
            <p role="status">Loading selected analyst…</p>
          ) : resource.error ? (
            <div role="status">
              <p>{resource.error}</p>
              <button type="button" onClick={() => resource.refresh()}>
                Retry selected analyst
              </button>
            </div>
          ) : result && (profile || calls) ? (
            <div className={styles.board}>
              {result.preview && (
                <p role="note">
                  Limited provider preview. The returned slice is not the
                  complete history or coverage book.
                </p>
              )}
              {resource.data?.retrievedAt && (
                <p>
                  Retrieved{" "}
                  <time
                    dateTime={resource.data.retrievedAt}
                    title={resource.data.retrievedAt}
                  >
                    {resource.data.retrievedAt.slice(0, 10)}
                  </time>
                </p>
              )}
              {profile && (
                <>
                  <h3>{profile.name}</h3>
                  <p>
                    {profile.firm} · Most recent publishing firm
                    <br /> Observed notes: {profile.first} to {profile.last}
                  </p>
                  <p>
                    {profile.noteCount} attributed notes · {profile.tickerCount}{" "}
                    covered tickers. {profile.coverage.length} coverage rows
                    shown{profile.total !== null ? ` of ${profile.total}` : ""}.
                  </p>
                  <div className={styles.rows}>
                    {profile.firms.map((f, i) => (
                      <article key={`${f.firm}-${i}`}>
                        <h4>{f.firm}</h4>
                        <p>
                          Notes observed {f.first} to {f.last}
                          {f.recent
                            ? " · most recently published under this firm"
                            : ""}
                        </p>
                      </article>
                    ))}
                  </div>
                  <details>
                    <summary>
                      Covered tickers and latest published targets
                    </summary>
                    <div className={styles.rows}>
                      {profile.coverage.map((c, i) => (
                        <article key={`${c.ticker}-${i}`}>
                          <h4>{c.ticker}</h4>
                          <p>
                            {c.firm} · latest note {c.last}
                          </p>
                          <p>
                            Target {value(c.target)} · {c.notes} notes
                          </p>
                        </article>
                      ))}
                    </div>
                  </details>
                </>
              )}
              {calls && (
                <>
                  {calls.withheldPage && (
                    <p role="note">
                      This later page is withheld. The provider may return an
                      earlier allowance slice, so no rows are relabeled as this
                      page. Return to the first page for available notes.
                    </p>
                  )}
                  <p>
                    {calls.rows.length} notes shown from requested offset{" "}
                    {calls.offset}; {calls.total} total attributed notes. Dates
                    are day-granular, not precise intraday timestamps.
                  </p>
                  <p>
                    After-close notes may carry the following day’s publisher
                    date. This does not establish a future intraday publication
                    time.
                  </p>
                  <div className={styles.rows}>
                    {calls.rows.map((c, i) => (
                      <article key={`${offset + i}`}>
                        <h4>
                          {c.ticker} · {c.firm}
                        </h4>
                        <p>
                          {c.date} · {c.publisher}
                        </p>
                        <dl>
                          <div>
                            <dt>Original target</dt>
                            <dd>{value(c.target)}</dd>
                          </div>
                          <div>
                            <dt>Split-adjusted target</dt>
                            <dd>{value(c.adjusted)}</dd>
                          </div>
                          <div>
                            <dt>Price when posted</dt>
                            <dd>{value(c.price)}</dd>
                          </div>
                        </dl>
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noreferrer">
                            {c.title} ↗
                          </a>
                        ) : (
                          <p>{c.title}</p>
                        )}
                      </article>
                    ))}
                  </div>
                  {!calls.rows.length && <p>No notes in this returned page.</p>}
                  <div className={styles.paging}>
                    <button
                      disabled={offset === 0}
                      onClick={() => setOffset(offset - 25)}
                    >
                      Previous 25
                    </button>
                    <button
                      disabled={
                        calls.preview ||
                        calls.rows.length < 25 ||
                        offset + calls.rows.length >= calls.total ||
                        offset >= 10000
                      }
                      onClick={() => setOffset(offset + 25)}
                    >
                      Next 25
                    </button>
                  </div>
                  {calls.preview && (
                    <p>Further paging withheld by provider preview.</p>
                  )}
                  {offset >= 10000 && <p>Application paging limit reached.</p>}
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
