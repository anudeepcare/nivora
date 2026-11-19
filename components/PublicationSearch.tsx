"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { searchRequest, type SearchResult } from "@/lib/publication-search";
import styles from "./PublicationFeeds.module.css";
export function SearchResults({ data }: { data: SearchResult }) {
  return (
    <div aria-live="polite">
      <p>
        {data.rows.length} results for “{data.request.query}” · requested{" "}
        {data.request.days} days. Search matches are not restricted to the
        current stock; entity matching may fall back to keywords.
      </p>
      {data.preview && <p role="note">Limited preview. {data.previewReason}</p>}
      <ul className={styles.rows}>
        {data.rows.map((row) => (
          <li key={row.id}>
            <div>
              {row.url ? (
                <a href={row.url} target="_blank" rel="noopener noreferrer">
                  {row.title} ↗
                </a>
              ) : (
                <strong>{row.title}</strong>
              )}
              <p>
                {row.source}
                {row.tickers.length ? ` · ${row.tickers.join(", ")}` : ""}
              </p>
              <p>
                {data.request.kind === "stories" ? "Broke: " : "Published: "}
                {row.published ? (
                  <time dateTime={row.published}>
                    {new Date(row.published).toLocaleString()}
                  </time>
                ) : (
                  "Not supplied"
                )}
                {row.assembledAt && (
                  <>
                    {" "}
                    · Assembled:{" "}
                    <time dateTime={row.assembledAt}>
                      {new Date(row.assembledAt).toLocaleString()}
                    </time>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {!data.rows.length && (
        <p>No results returned, not proof of no activity or coverage.</p>
      )}
      <p>
        Retrieved {new Date(data.receivedAt).toLocaleString()}. Results do not
        refresh automatically. Submit again for a new search.
      </p>
    </div>
  );
}
export default function PublicationSearch() {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState<"stories" | "links">("stories"),
    [days, setDays] = useState<7 | 14>(7),
    [data, setData] = useState<SearchResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const input = searchRequest({ query, kind, days });
    if (!input) {
      setError("Enter a public topic of 2–240 characters.");
      return;
    }
    setBusy(true);
    setData(null);
    setError("");
    try {
      const result = await api<SearchResult>("publication-search", input);
      if (
        result.request.query !== input.query ||
        result.request.kind !== input.kind ||
        result.request.days !== input.days
      )
        throw Error("Search result does not match the submitted request.");
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <form className={styles.search} onSubmit={run}>
        <label>
          Public topic
          <input
            value={query}
            maxLength={240}
            minLength={2}
            required
            onChange={(e) => setQuery(e.target.value)}
            placeholder="NVDA earnings"
          />
        </label>
        <label>
          Results
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "stories" | "links")}
          >
            <option value="stories">Stories</option>
            <option value="links">Source links</option>
          </select>
        </label>
        <label>
          Window
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as 7 | 14)}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </label>
        <button disabled={busy} type="submit">
          {busy ? "Searching…" : "Search publications"}
        </button>
      </form>
      <p>
        Your entered query is sent to SentiSense when you submit. Use public
        topics only; do not enter personal or confidential information.
      </p>
      <p>
        Stories show provider-authored titles, not publisher headlines. Source
        links contain metadata only, not article text. Search is limited to 20
        results per request; no full story details are fetched.
      </p>
      {error && <p role="alert">{error} Submit again to retry.</p>}
      {data && <SearchResults data={data} />}
    </div>
  );
}
