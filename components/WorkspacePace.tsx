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
type Row = { signal?: PaceSignal; entrySignal?: PaceSignal; error?: string; checkedAt?: string };
export function useWorkspacePace(symbols: string[]) {
  const { cache, demo, workspace } = useProduct();
  const key = [...new Set(symbols)].sort().join(",");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setRows({});
    const names = key.split(",").filter(Boolean);
    if (demo) {
      setRows(Object.fromEntries(names.map(symbol => {
        const r = demo.research[symbol];
        return [symbol, r ? { signal: workspaceGuidance(r, true, Date.parse(r.retrievedAt)), entrySignal: workspaceGuidance(r, false, Date.parse(r.retrievedAt)) } : { error: "Reading unavailable" }];
      })));
      setLoading(false);
      return;
    }
    setLoading(names.length > 0);
    void (async () => {
      for (let i = 0; i < names.length && active; i += 2) {
        const batch = names.slice(i, i + 2);
        const path = `pace-scan?symbols=${encodeURIComponent(batch.join(","))}`;
        try {
          const result = await readResource<Record<string, Row>>(cache, path, revision ? 0 : 900000, () => api(path));
          if (active) setRows(old => ({ ...old, ...result }));
        } catch {
          if (active) setRows(old => ({ ...old, ...Object.fromEntries(batch.map(symbol => [symbol, { error: "Reading unavailable" }])) }));
        }
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [key, cache, demo, revision]);
  const presented = Object.fromEntries(Object.entries(rows).map(([symbol, row]) => [symbol, { ...row, signal: workspace?.positions.some(p => p.symbol === symbol && p.quantity > 0) ? row.signal : row.entrySignal ?? row.signal }]));
  return { rows: presented, loading, refresh: () => setRevision(n => n + 1) };
}
export function PaceBadge({ signal, loading = false }: { signal?: PaceSignal | null; loading?: boolean }) {
  const reading = signal?.periods.find(p => p.key === "confirmed");
  return <span className={s.badge} title={reading?.date ? `Confirmed ${dateLabel(reading.date)}` : undefined} data-level={signal?.view.permitted ? reading?.level : undefined}>
    <b>{signal?.view.code ?? (loading ? "Checking…" : "Unavailable")}</b>
    <span>{signal?.view.actionLabel.replace(/ · P[0-4]$/, "") ?? ""}</span>
    
  </span>;
}
export function PaceBoard({ rows, loading, prefix, refresh }: ReturnType<typeof useWorkspacePace> & { prefix: string }) {
  const qualifying = Object.entries(rows).filter(([,r]) => r.signal?.view.permitted && (r.signal.view.rawLevel ?? 0) >= 2);
  return <section className={s.board} aria-label="Accumulation opportunities">
    <header><div><h2>Auryn accumulation pace</h2><p>Your holdings and watchlist · confirmed readings</p></div><button type="button" disabled={loading} onClick={refresh}>{loading ? "Checking…" : "Refresh pace"}</button></header>
    <div className={s.list}>{qualifying.sort((a,b)=>(b[1].signal!.view.rawLevel??0)-(a[1].signal!.view.rawLevel??0)).map(([symbol,r])=><Link key={symbol} href={researchLink(symbol,prefix)}><strong>{symbol}</strong><PaceBadge signal={r.signal}/></Link>)}{!qualifying.length&&<p>{loading?"Checking your companies…":"No qualifying readings"}</p>}</div>
    <small>{Object.keys(rows).length} checked · {Object.values(rows).filter(r=>r.error).length} unavailable. Pace is a price zone; follow business checks and position limits.</small>
  </section>;
}
