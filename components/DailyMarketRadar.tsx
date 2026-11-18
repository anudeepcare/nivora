"use client";
import { useEffect, useState } from "react";
import { providerSymbol, providerIdentity } from "../lib/provider-symbol";
import type { Research } from "../lib/types";
import type { DailyRadarSnapshot } from "../lib/daily-radar";
import type { RadarResearch } from "../lib/market-radar";
import { api } from "../lib/client";
import { useProduct } from "./Session";
import { MarketRadar } from "./MarketRadar";

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
        .filter((row) => row.status === "ready")
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
    : research;
  return (
    <section aria-label="Daily holdings and watchlist radar">
      <p role="status">
        {snapshot
          ? `${rows.length} histories shown · ${snapshot.ready} of ${snapshot.eligible} eligible held or watched instruments ready · ${snapshot.pending} pending · ${snapshot.excluded} unsupported. Daily snapshot ${snapshot.day} (UTC).`
          : "Checking today's saved holdings and watchlist history…"}
      </p>
      <p className="hint">
        Completed daily prices only. Price histories refresh once per UTC day
        while this page is open, in small batches; progress resumes on your next
        visit. Names and sectors use existing company evidence, otherwise remain
        unclassified. This is your selected universe, not the whole market.
      </p>
      {current?.error && (
        <p role="alert">
          {current.error}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry daily radar
          </button>
        </p>
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
