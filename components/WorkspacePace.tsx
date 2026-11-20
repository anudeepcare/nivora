"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProduct } from "./Session";
import { api } from "@/lib/client";
import { readResource } from "@/lib/resource-cache";
import { workspaceGuidance } from "@/lib/edge-research";
import { dateLabel } from "@/lib/format";
import { researchLink } from "@/lib/approved-workspace";
import s from "./WorkspacePace.module.css";
export type PaceSignal = ReturnType<typeof workspaceGuidance>;
type Row = {
  signal?: PaceSignal;
  entrySignal?: PaceSignal;
  error?: string;
  checkedAt?: string;
};
export function useWorkspacePace(symbols: string[]) {
  const { cache, demo, workspace } = useProduct();
  const key = [...new Set(symbols)].sort().join(",");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [settledKey, setSettledKey] = useState("");
  useEffect(() => {
    let active = true;
    setRows((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([symbol]) =>
          key.split(",").includes(symbol),
        ),
      ),
    );
    const names = key.split(",").filter(Boolean);
    if (demo) {
      setRows(
        Object.fromEntries(
          names.map((symbol) => {
            const r = demo.research[symbol];
            return [
              symbol,
              r
                ? {
                    signal: workspaceGuidance(
                      r,
                      true,
                      Date.parse(r.retrievedAt),
                    ),
                    entrySignal: workspaceGuidance(
                      r,
                      false,
                      Date.parse(r.retrievedAt),
                    ),
                  }
                : { error: "Reading unavailable" },
            ];
          }),
        ),
      );
      setLoading(false);
      setSettledKey(key);
      return;
    }
    setLoading(names.length > 0);
    void (async () => {
      for (let i = 0; i < names.length && active; i += 2) {
        const batch = names.slice(i, i + 2);
        const path = `pace-scan?symbols=${encodeURIComponent(batch.join(","))}`;
        try {
          const result = await readResource<Record<string, Row>>(
            cache,
            path,
            revision ? 0 : 900000,
            () => api(path),
          );
          if (active) setRows((old) => ({ ...old, ...result }));
        } catch {
          if (active)
            setRows((old) => ({
              ...old,
              ...Object.fromEntries(
                batch.map((symbol) => [
                  symbol,
                  { error: "Reading unavailable" },
                ]),
              ),
            }));
        }
      }
      if (active) {
        setLoading(false);
        setSettledKey(key);
      }
    })();
    return () => {
      active = false;
    };
  }, [key, cache, demo, revision]);
  const requestedNames = key.split(",").filter(Boolean);
  const presented = Object.fromEntries(
    requestedNames.flatMap((symbol) => {
      const row = Object.hasOwn(rows, symbol) ? rows[symbol] : undefined;
      if (!row) return [];
      return [
        [
          symbol,
          {
            ...row,
            signal: workspace?.positions.some(
              (p) => p.symbol === symbol && p.quantity > 0,
            )
              ? row.signal
              : (row.entrySignal ?? row.signal),
          },
        ],
      ];
    }),
  );
  return {
    rows: presented,
    loading: !!key && (loading || settledKey !== key),
    requested: requestedNames.length,
    refresh: () => {
      if (!key) return;
      setLoading(true);
      setRevision((n) => n + 1);
    },
  };
}
export function PaceBadge({
  signal,
  loading = false,
}: {
  signal?: PaceSignal | null;
  loading?: boolean;
}) {
  const reading = signal?.periods.find((p) => p.key === "confirmed");
  const code = signal?.view.code ?? (loading ? "Checking…" : "Unavailable");
  // A category colors the technical code only; the business action stays separate.
  const level = /^P([0-4])$/.exec(code)?.[1];
  return (
    <span
      className={`${s.badge} ${s.palette}`}
      title={reading?.date ? `Confirmed ${dateLabel(reading.date)}` : undefined}
      data-pace-level={level}
    >
      <b>{code}</b>
      <span>{signal?.view.actionLabel.replace(/ · P[0-4]$/, "") ?? ""}</span>
    </span>
  );
}
export function PaceBoard({
  rows,
  loading,
  prefix,
  refresh,
  requested = Object.keys(rows).length,
}: Omit<ReturnType<typeof useWorkspacePace>, "requested"> & {
  prefix: string;
  requested?: number;
}) {
  if (!requested) return null;
  const readings = Object.entries(rows);
  const available = readings.filter(
    ([, r]) => !r.error && r.signal?.view.rawLevel != null,
  );
  const qualifying = available.filter(
    ([, r]) => r.signal!.view.permitted && r.signal!.view.rawLevel! >= 2,
  );
  const incomplete = Math.max(0, requested - available.length);
  const coverage = `${available.length} of ${requested} Pace readings available.`;
  const status = loading
    ? "Checking Pace…"
    : !available.length
      ? "Pace readings unavailable."
      : incomplete
        ? "Coverage incomplete."
        : !qualifying.length
          ? "No qualifying Pace readings."
          : "";
  const quiet = qualifying.length === 0;
  return (
    <section
      className={quiet ? `${s.board} ${s.quiet}` : s.board}
      aria-label="Accumulation opportunities"
    >
      <header>
        <div>
          <h2>Auryn accumulation pace</h2>
          {!quiet && <p>Your holdings and watchlist · confirmed readings</p>}
          {(quiet || status) && (
            <p className={s.scanStatus} role="status">
              {status} {coverage}
            </p>
          )}
        </div>
        <button type="button" disabled={loading} onClick={refresh}>
          {loading ? "Checking…" : "Refresh Pace"}
        </button>
      </header>
      {!quiet && (
        <>
          <div className={s.list}>
            {qualifying
              .sort(
                (a, b) =>
                  (b[1].signal!.view.rawLevel ?? 0) -
                  (a[1].signal!.view.rawLevel ?? 0),
              )
              .map(([symbol, r]) => (
                <Link key={symbol} href={researchLink(symbol, prefix)}>
                  <strong>{symbol}</strong>
                  <PaceBadge signal={r.signal} />
                  <span className={s.inspect}>View evidence →</span>
                </Link>
              ))}
          </div>
          <small>
            {!status && coverage} Pace is a price zone; follow business checks
            and position limits.
          </small>
        </>
      )}
    </section>
  );
}
