"use client";
import Link from "next/link";
import { researchLink } from "../lib/approved-workspace";
import { useEffect, useState, type ReactNode } from "react";
import { providerSymbol, providerIdentity } from "../lib/provider-symbol";
import type { Research } from "../lib/types";
import type { DailyRadarSnapshot } from "../lib/daily-radar";
import { buildMarketRadar, type RadarResearch } from "../lib/market-radar";
import { api } from "../lib/client";
import { useProduct } from "./Session";
import { MarketRadar } from "./MarketRadar";
import s from "./DailyMarketRadar.module.css";

export default function DailyMarketRadar({
  research,
  requested,
  asOf,
  sampleEvidence,
  prefix = "",
}: {
  research: Research[];
  requested: string[];
  asOf: string;
  sampleEvidence?: ReactNode;
  prefix?: string;
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
    !!error &&
    /database migration|database schema|storage is not configured/i.test(error);
  const comparableSample =
    sampleOpen &&
    research.length > 1 &&
    buildMarketRadar(research, asOf).breadthEligible >= 2;
  return (
    <section
      className={s.daily}
      data-state={
        setupRequired
          ? "setup"
          : error ||
              snapshot?.sourceStatus === "unavailable" ||
              (snapshot && !snapshot.pending && !rows.length)
            ? "unavailable"
            : !snapshot || snapshot.pending > 0
              ? "loading"
              : "ready"
      }
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
                ? "An administrator needs to check daily price history setup. Your saved holdings and watchlist are unchanged."
                : "Your saved holdings, watchlist and existing research are unchanged. Retry to check daily history again."}
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => setRetry((n) => n + 1)}
            >
              {setupRequired ? "Check setup again" : "Retry daily radar"}
            </button>
            {error && (
              <details>
                <summary>
                  {setupRequired ? "Setup detail" : "Technical detail"}
                </summary>
                <p>{error}</p>
              </details>
            )}
          </div>
        ) : !snapshot ? (
          <p role="status">
            Checking today's saved holdings and watchlist history…
          </p>
        ) : null}
        {snapshot && !snapshot.pending && !rows.length && !error && (
          <p role="status">
            No daily histories are available for this selection.
          </p>
        )}
        {snapshot && (
          <>
            <dl className={s.metrics} aria-label="Daily radar coverage">
              <div>
                <dt>Histories shown</dt>
                <dd>{rows.length}</dd>
              </div>
              <div>
                <dt>Supported cached</dt>
                <dd>
                  {snapshot.ready}
                  <small> / {snapshot.eligible}</small>
                </dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd>{snapshot.pending}</dd>
              </div>
              <div>
                <dt>Unsupported</dt>
                <dd>{snapshot.excluded}</dd>
              </div>
            </dl>
            <p className={s.progress} role={error ? undefined : "status"}>
              {rows.length} histories shown · {snapshot.pending} pending ·
              Snapshot {snapshot.day} (UTC).
            </p>
          </>
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
      {research.length > 0 && (
        <details
          className={s.fallback}
          open={sampleOpen}
          onToggle={(event) => setSampleOpen(event.currentTarget.open)}
        >
          <summary>
            Loaded research sample ({research.length} of {requested.length})
          </summary>
          {sampleOpen && (
            <>
              <p>
                This is already-loaded company evidence, not the daily holdings
                and watchlist snapshot or market-wide breadth.
              </p>
              {comparableSample ? (
                <>
                  {!snapshot && <MarketRadar research={research} asOf={asOf} />}
                  {sampleEvidence}
                </>
              ) : (
                <>
                  <p>
                    At least two companies with eligible daily histories are
                    needed for a sample comparison.
                  </p>
                  <ul className={s.sampleLinks}>
                    {research.slice(0, 4).map(({ company }) => (
                      <li key={company.symbol}>
                        <Link href={researchLink(company.symbol, prefix)}>
                          Research {company.symbol}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
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
