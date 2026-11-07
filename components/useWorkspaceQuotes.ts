"use client";

import { mergePriceTick } from "@/lib/live-price";
import { quoteHealth } from "@/lib/quote-health";
import { readResource } from "@/lib/resource-cache";
import {
  cachedQuotes,
  publishQuotes,
  subscribeQuotes,
} from "@/lib/shared-quotes";
import useLivePrices from "./useLivePrices";

import { api } from "@/lib/client";
import {
  mergePortfolioQuotes,
  refreshIntervals,
  usablePortfolioQuote,
  type RefreshMode,
} from "@/lib/portfolio-quotes";
import type { Company, Quote } from "@/lib/types";
import { workspaceSymbolBatches } from "@/lib/workspace";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProduct } from "./Session";

export type Quotes = Record<
  string,
  { company?: Company; quote?: Quote; error?: string }
>;
export function useWorkspaceQuotes(
  scope: "all" | "watchlist" | "portfolio" = "all",
) {
  const { workspace, demo, cache, marketProvider, owner } = useProduct(),
    groups = workspaceSymbolBatches(
      scope === "watchlist" ? [] : (workspace?.positions ?? []),
      scope === "portfolio" ? [] : (workspace?.watchlist ?? []),
      10,
    ),
    key = JSON.stringify(groups),
    [revision, setRevision] = useState(0),
    [data, setData] = useState<Quotes>(() =>
      demo
        ? Object.fromEntries(
            Object.entries(demo.research).map(([symbol, research]) => [
              symbol,
              { company: research.company, quote: research.quote },
            ]),
          )
        : Object.fromEntries(
            groups.flat().flatMap((s) => {
              const row = cache.get("quote:" + s);
              return row ? [[s, row.value as Quotes[string]]] : [];
            }),
          ),
    ),
    [loading, setLoading] = useState(!demo && groups.length > 0),
    [ready, setReady] = useState(
      !!demo || cache.has("workspace-quotes:" + key) || !groups.length,
    ),
    [error, setError] = useState("");
  const liveFresh = useRef(new Set<string>());
  const [dataOwner, setDataOwner] = useState(owner);
  const latestData = useRef(data);
  latestData.current = dataOwner === owner ? data : {};
  const [mode, setMode] = useState<RefreshMode>("balanced");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  useEffect(() => {
    if (scope !== "portfolio" || demo || !owner) return;
    try {
      const saved = localStorage.getItem("auryn-refresh-v1:" + owner);
      if (saved && saved in refreshIntervals) setMode(saved as RefreshMode);
    } catch {}
  }, [owner, scope, demo]);
  const changeMode = (value: RefreshMode) => {
    setMode(value);
    try {
      if (owner) localStorage.setItem("auryn-refresh-v1:" + owner, value);
    } catch {}
  };
  const refresh = useCallback(() => {
    for (const symbol of JSON.parse(key).flat()) {
      const row = cache.get("quote:" + symbol);
      if (row) cache.set("quote:" + symbol, { ...row, at: 0 });
    }
    setRevision((x) => x + 1);
  }, [cache, key]);
  useEffect(
    () =>
      subscribeQuotes(cache, (changed) => {
        const symbols = (JSON.parse(key) as string[][]).flat();
        if (!changed.some((symbol) => symbols.includes(symbol))) return;
        setData((prior) =>
          mergePortfolioQuotes(prior, cachedQuotes(cache, symbols), symbols),
        );
      }),
    [cache, key, owner],
  );
  // Discovering a hybrid/Twelve connection must not abort and restart a quote
  // batch that already began while provider metadata was loading.
  const rateLimited = marketProvider !== "eodhd";
  useEffect(() => {
    if (demo) {
      setData(
        Object.fromEntries(
          Object.entries(demo.research).map(([s, r]) => [
            s,
            { company: r.company, quote: r.quote },
          ]),
        ),
      );
      setReady(true);
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    let active = true;
    const selected = JSON.parse(key) as string[][],
      cached: Quotes = {};
    for (const symbol of selected.flat()) {
      const row = cache.get("quote:" + symbol);
      if (row) cached[symbol] = row.value as Quotes[string];
    }
    let persisted: Quotes = {};
    if (owner && !demo) {
      try {
        const saved = JSON.parse(
          localStorage.getItem("auryn-portfolio-quotes-v1:" + owner) || "null",
        );
        if (
          saved?.version === 1 &&
          saved.rows &&
          typeof saved.rows === "object"
        ) {
          persisted = saved.rows;
          setCheckedAt(
            typeof saved.checkedAt === "string" ? saved.checkedAt : null,
          );
        }
      } catch {}
    }
    const baseline = mergePortfolioQuotes(
      mergePortfolioQuotes(persisted, cached, selected.flat()),
      latestData.current,
      selected.flat(),
    );
    setDataOwner(owner);
    setData(baseline);
    setReady(
      Object.values(baseline).some((r) => r.quote?.price != null) ||
        !selected.length,
    );
    setLoading(selected.length > 0);
    setError("");
    let windowStarted = Date.now();
    const pause = () =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(
          resolve,
          Math.max(0, 61000 - (Date.now() - windowStarted)),
        );
        abort.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
    (async () => {
      let next: Quotes = { ...baseline };
      let requested = 0;
      for (const group of selected) {
        if (!active) break;
        const missing = group.filter(
          (s) =>
            !liveFresh.current.has(s) &&
            (!cache.get("quote:" + s) ||
              Date.now() - cache.get("quote:" + s)!.at > 60000),
        );
        if (!missing.length) continue;
        const weight = missing.reduce(
          (n, s) => n + (s.includes("/") ? 2 : 1),
          0,
        );
        if (rateLimited && requested + weight > 40) {
          await pause();
          requested = 0;
          windowStarted = Date.now();
        }
        if (!active) break;
        try {
          const path =
            "quotes?symbols=" +
            encodeURIComponent([...missing].sort().join(","));
          const result = await readResource(
            cache,
            path,
            revision ? 0 : 60000,
            () => api<Quotes>(path),
          );
          if (!active) break;
          next = mergePortfolioQuotes(next, result, selected.flat());
          publishQuotes(cache, next);
          for (const [symbol, row] of Object.entries(result)) {
            if (usablePortfolioQuote(row.quote)) {
              const saved = cache.get("quote:" + symbol);
              if (saved)
                cache.set("quote:" + symbol, { ...saved, at: Date.now() });
            }
            if (row.error)
              setError(
                "Some prices could not be updated. Available older prices remain included.",
              );
          }
          next = mergePortfolioQuotes(
            next,
            cachedQuotes(cache, selected.flat()),
            selected.flat(),
          );
          setData(next);
          requested += weight;
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : "Quotes unavailable");
          }
          requested += weight;
        }
      }
      if (active) {
        next = mergePortfolioQuotes(next, latestData.current, selected.flat());
        setData(next);
        const checked = new Date().toISOString();
        setCheckedAt(checked);
        if (owner && !demo) {
          try {
            const storageKey = "auryn-portfolio-quotes-v1:" + owner;
            const stored = JSON.parse(
              localStorage.getItem(storageKey) || "null",
            );
            const rows = mergePortfolioQuotes(
              stored?.version === 1 ? (stored.rows ?? {}) : {},
              next,
              [
                ...new Set([
                  ...Object.keys(
                    stored?.version === 1 ? (stored.rows ?? {}) : {},
                  ),
                  ...Object.keys(next),
                ]),
              ],
            );
            localStorage.setItem(
              storageKey,
              JSON.stringify({ version: 1, checkedAt: checked, rows }),
            );
          } catch {}
        }
        cache.set("workspace-quotes:" + key, { at: Date.now(), value: true });
        setReady(true);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      abort.abort();
    };
  }, [key, demo, cache, revision, rateLimited, scope, owner]);
  useEffect(() => {
    if (demo) return;
    const tick = () => {
      if (document.visibilityState === "visible" && !loading) refresh();
    };
    const interval = scope === "portfolio" ? refreshIntervals[mode] : 120000;
    if (!interval) return;
    let last = Date.now();
    const due = () => {
      if (
        Date.now() - last >= interval &&
        document.visibilityState === "visible" &&
        !loading
      ) {
        last = Date.now();
        tick();
      }
    };
    const timer = setInterval(due, Math.min(interval, 60000));
    document.addEventListener("visibilitychange", due);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", due);
    };
  }, [demo, loading, refresh, scope, mode]);
  const live = useLivePrices(
    groups.flat(),
    !!demo || (scope === "portfolio" && mode !== "live"),
  );
  liveFresh.current = new Set(
    live.connected
      ? Object.values(live.ticks)
          .filter((t) => Date.now() - Date.parse(t.asOf) < 30000)
          .map((t) => t.symbol)
      : [],
  );
  const pricedData = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(dataOwner === owner ? data : {}).map(([symbol, row]) => [
          symbol,
          {
            ...row,
            quote: quoteHealth(
              live.ticks[symbol]
                ? mergePriceTick(row.quote, {
                    ...live.ticks[symbol],
                    session: live.connected
                      ? live.ticks[symbol].session
                      : "Last streamed trade · reconnecting",
                  })
                : !live.connected && /^Live/.test(row.quote?.session || "")
                  ? {
                      ...row.quote!,
                      session: "Last streamed trade · reconnecting",
                    }
                  : row.quote,
            ),
          },
        ]),
      ),
    [data, live, dataOwner, owner],
  );
  useEffect(() => {
    let advanced = false;
    publishQuotes(cache, pricedData);
    for (const [symbol, row] of Object.entries(pricedData)) {
      if (
        usablePortfolioQuote(row.quote) &&
        (!usablePortfolioQuote(data[symbol]?.quote) ||
          Date.parse(row.quote!.asOf || "") >
            Date.parse(data[symbol]?.quote?.asOf || ""))
      )
        advanced = true;
      if (!row.quote || row.quote.stale) continue;
      const old = cache.get("quote:" + symbol)?.value as
        | Quotes[string]
        | undefined;
      if (
        !old?.quote ||
        Date.parse(row.quote.asOf || "") > Date.parse(old.quote.asOf || "")
      )
        cache.set("quote:" + symbol, { at: Date.now(), value: row });
    }
    // Commit streamed observations too: expiry/reconnect must not restore an older REST snapshot.
    if (advanced && dataOwner === owner)
      setData((prior) =>
        mergePortfolioQuotes(prior, pricedData, Object.keys(pricedData)),
      );
  }, [pricedData, cache, data, dataOwner, owner]);
  return {
    data: pricedData,
    loading,
    ready,
    error,
    refresh,
    mode,
    changeMode,
    checkedAt,
  };
}
