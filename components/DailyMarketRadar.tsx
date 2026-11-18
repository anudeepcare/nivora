"use client";
import { useEffect, useState } from "react";
import { providerSymbol, providerIdentity } from "../lib/provider-symbol";
import type { Research } from "../lib/types";
import type { DailyRadarSnapshot } from "../lib/daily-radar";
import type { RadarResearch } from "../lib/market-radar";
import { api } from "../lib/client";
import { useProduct } from "./Session";
import { MarketRadar } from "./MarketRadar";
import s from "./DailyMarketRadar.module.css";

export default function DailyMarketRadar({
  research,
  requested,
  asOf,
}: {
  research: Research[];
  requested: string[];
  asOf: string;
}) {
  const { cache } = useProduct();
  const key = [...new Set(requested)].sort().join(",");
  const [state, setState] = useState<{
    key: string;
    cache: typeof cache;
    snapshot: DailyRadarSnapshot | null;
    error: string;
  }>({ key, cache, snapshot: null, error: "" });
  const [retry, setRetry] = useState(0);
  const [sampleOpen, setSampleOpen] = useState(false);
  useEffect(() => {
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    setState({ key, cache, snapshot: null, error: "" });
    const run = async (advance = false, cursor = 0) => {
      try {
        const result = await api<DailyRadarSnapshot>(
          `daily-radar?cursor=${cursor}`,
          advance ? { continue: true } : undefined,
          controller.signal,
        );
        if (!active) return;
        setState((old) => ({
          key,
          cache,
          snapshot: {
            ...result,
            rows:
              result.incremental && old.snapshot?.day === result.day
                ? [
                    ...new Map(
                      [...old.snapshot.rows, ...result.rows].map((row) => [
                        row.symbol,
                        row,
                      ]),
                    ).values(),
                  ]
                : result.rows,
          },
          error: "",
        }));
        if (result.nextCursor != null) {
          timer = setTimeout(() => void run(false, result.nextCursor!), 2100);
          return;
        }
        if (advance && !result.pending) {
          timer = setTimeout(() => void run(), 2100);
          return;
        }
        if (result.pending)
          timer = setTimeout(
            () => void run(true),
            result.retryAfterSeconds * 1000,
          );
        else {
          const nextDay = new Date();
          nextDay.setUTCHours(24, 0, 2, 0);
          timer = setTimeout(() => void run(), nextDay.getTime() - Date.now());
        }
      } catch (e) {
        if (active)
          setState((old) => ({
            ...old,
            error:
              e instanceof Error ? e.message : "Daily radar is unavailable.",
          }));
      }
    };
    void run();
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [key, cache, asOf, retry]);
  const current = state.key === key && state.cache === cache ? state : null;
  const snapshot = current?.snapshot;
  const rows: RadarResearch[] = snapshot
    ? snapshot.rows
        .filter(
          (row) =>
            row.status === "ready" || (row.stale && row.history.length > 0),
        )
        .map((row) => {
          const full = research.find((r) => {
            try {
              return (
                providerIdentity(providerSymbol(r.company.symbol)) ===
                row.symbol
              );
            } catch {
              return false;
            }
          });
          return {
            company: {
              symbol: row.symbol,
              name: full?.company.name ?? row.symbol,
              assetType: "stock",
              sector: full?.company.sector ?? "Unclassified",
            },
            history: row.history,
          };
        })
    : [];
  const error = current?.error;
  const setupRequired =
    !!error && /database migration|storage is not configured/i.test(error);
  return (
    <section
      className={s.daily}
      aria-label="Daily holdings and watchlist radar"
    >
      <div className={s.summary}>
        {error ? (
          <div role="alert">
            <strong>
              {setupRequired
                ? "Daily radar setup required"
                : snapshot
                  ? "Refresh paused"
                  : "Daily radar unavailable"}
            </strong>
            <p>
              {setupRequired
                ? "The daily cache is not configured yet. Your saved holdings, watchlist and existing research are unchanged."
                : error}
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => setRetry((n) => n + 1)}
            >
              {setupRequired ? "Check setup again" : "Retry daily radar"}
            </button>
            {setupRequired && (
              <details>
                <summary>Setup detail</summary>
                <p>{error}</p>
              </details>
            )}
          </div>
        ) : !snapshot ? (
          <p role="status">
            Checking today's saved holdings and watchlist history…
          </p>
        ) : null}
        {snapshot && (
          <p className={s.progress} role={error ? undefined : "status"}>
            {rows.length} histories shown · {snapshot.ready} of{" "}
            {snapshot.eligible} supported instruments cached ·{" "}
            {snapshot.pending} pending · {snapshot.excluded} unsupported.
            Snapshot {snapshot.day} (UTC).
          </p>
        )}
        {snapshot?.mode === "bulk-opt-in" &&
          snapshot.sourceStatus === "unavailable" && (
            <p role="status">
              Bulk source refresh paused. Cached observations remain available;
              pending instruments are not current.
              {snapshot.sourceRetryAt && (
                <>
                  {" "}
                  Next source check no earlier than{" "}
                  <time dateTime={snapshot.sourceRetryAt}>
                    {new Date(snapshot.sourceRetryAt).toLocaleString()}
                  </time>
                  .
                </>
              )}
            </p>
          )}
        {snapshot?.mode === "bulk-opt-in" && (
          <div>
            <p>
              {snapshot.rows.filter((row) => row.stale).length} retained
              histories are awaiting refresh; latest price dates and historical
              acquisition dates are different.
            </p>
            <details>
              <summary>History freshness and limitations</summary>
              {snapshot.limitations?.map((text) => (
                <p key={text}>{text}</p>
              ))}
              <ul
                className={s.freshness}
                tabIndex={0}
                aria-label="Dated radar history sources"
              >
                {snapshot.rows
                  .filter((row) => row.historyAcquiredAt)
                  .map((row) => (
                    <li key={row.symbol}>
                      {row.symbol}: latest bar {row.observedThrough}; history
                      acquired {row.historyAcquiredAt?.slice(0, 10)}; split
                      history acquired {row.actionsAcquiredAt?.slice(0, 10)}
                      {row.stale ? " · refresh pending" : ""}
                    </li>
                  ))}
              </ul>
            </details>
          </div>
        )}
        {snapshot && (
          <small>
            Completed prices only · resumes while this page is open ·
            observation dates remain on the chart.
          </small>
        )}
      </div>
      {!snapshot && error && research.length > 0 && (
        <details
          className={s.fallback}
          open={sampleOpen}
          onToggle={(event) => setSampleOpen(event.currentTarget.open)}
        >
          <summary>
            View locally loaded sample ({research.length} of {requested.length})
          </summary>
          <p>
            This sample is not the daily holdings/watchlist snapshot. It
            includes only company histories already loaded in this account.
          </p>
          {sampleOpen && <MarketRadar research={research} asOf={asOf} />}
        </details>
      )}
      {rows.length > 0 && (
        <MarketRadar research={rows} asOf={snapshot?.day ?? asOf} />
      )}
      {snapshot && snapshot.rows.some((r) => r.status === "unavailable") && (
        <details>
          <summary>
            Unavailable histories (
            {snapshot.rows.filter((r) => r.status === "unavailable").length})
          </summary>
          <ul>
            {snapshot.rows
              .filter((r) => r.status === "unavailable")
              .map((row) => (
                <li key={row.symbol}>
                  {row.symbol}: {row.issue}
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
