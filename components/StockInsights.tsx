"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { StockInsightsData, InsightMode } from "@/lib/stock-insights";
import s from "./SentiSensePanels.module.css";
import styles from "./StockInsights.module.css";
export default function StockInsights({ symbol }: { symbol: string }) {
  const [mode, setMode] = useState<InsightMode | null>(null);
  const [type, setType] = useState("all");
  const resource = useResource<
    StockInsightsData & {
      mode: InsightMode;
      retrievedAt: string;
      start: string | null;
      end: string | null;
    }
  >(
    mode
      ? `stock-insights?symbol=${encodeURIComponent(symbol)}&mode=${mode}`
      : null,
    undefined,
    300000,
  );
  const data =
    resource.data?.symbol === symbol && resource.data.mode === mode
      ? resource.data
      : null;
  const types = data ? [...new Set(data.rows.map((r) => r.type))] : [];
  const rows =
    data?.rows.filter((r) => type === "all" || r.type === type) ?? [];
  return (
    <section aria-label={`${symbol} stock Insights`}>
      <nav
        className={`${s.tabs} auryn-detail-tabs`}
        aria-label="Insights window"
      >
        {(["current", "month"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              setType("all");
            }}
          >
            {value === "current" ? "Current insights" : "Last 30 days"}
          </button>
        ))}
      </nav>
      <p>
        AI-generated observations, not independently verified facts or trade
        recommendations. Provider confidence is not a return probability or an
        Auryn score.
      </p>
      {!mode ? (
        <p>Select a window to load this stock’s insights.</p>
      ) : resource.loading ? (
        <p role="status">Loading insights…</p>
      ) : resource.error ? (
        <div role="status">
          <p>{resource.error}</p>
          <button type="button" onClick={() => resource.refresh()}>
            Retry insights
          </button>
        </div>
      ) : data ? (
        <>
          <div className={styles.actions}>
            <button type="button" onClick={() => resource.refresh()}>
              Refresh insights
            </button>
            <details data-info-disclosure>
              <summary>Source &amp; retrieval</summary>
              <p>
                Source: SentiSense. Fetched{" "}
                {data.retrievedAt
                  ? new Date(data.retrievedAt).toLocaleString()
                  : "time unavailable"}
                . Results are cached in this session for up to five minutes. An
                open view can be older. Refresh to request a new window;
                generation times below are provider observations, not retrieval
                times.
              </p>
            </details>
          </div>
          <p>
            {data.rows.length} returned
            {data.total !== null ? ` of ${data.total}` : ""}.{" "}
            {mode === "current"
              ? "Provider importance order."
              : `Generated ${data.start}–${data.end}, inclusive US Eastern dates. Provider urgency/confidence order.`}
          </p>
          {data.preview && (
            <p role="note">
              Limited provider preview. {data.previewReason} Missing text
              remains withheld.
            </p>
          )}
          {data.sampleCompany && (
            <p role="note">
              Provider sample-company access; this does not establish access for
              other stocks.
            </p>
          )}
          {types.length > 1 && (
            <label>
              Insight type{" "}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All returned types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!rows.length ? (
            <p>
              No insights returned for this selection. This is not evidence that
              no risks or events exist.
            </p>
          ) : (
            <ul className={styles.rows}>
              {rows.map((row) => (
                <li key={row.id}>
                  <header>
                    <strong>{row.type.replaceAll("_", " ")}</strong>
                    <span>
                      {row.urgency} provider priority ·{" "}
                      {row.category.toLowerCase()}
                    </span>
                  </header>
                  <p>{row.text ?? "Description withheld by provider."}</p>
                  <footer>
                    <time dateTime={row.generatedAt}>
                      Generated {new Date(row.generatedAt).toLocaleString()}
                    </time>
                    <span>
                      Provider confidence:{" "}
                      {row.confidence === null
                        ? "Not supplied"
                        : `${Math.round(row.confidence * 100)}%`}
                    </span>
                  </footer>
                  {row.sources.length > 0 ? (
                    <nav aria-label="Insight source documents">
                      {row.sources.map((source, i) => (
                        <a
                          key={`${source.url}:${i}`}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.type ?? "Source document"} {i + 1} ↗
                        </a>
                      ))}
                    </nav>
                  ) : (
                    <p>Source documents not supplied.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
