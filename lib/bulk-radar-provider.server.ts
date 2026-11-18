import "server-only";
import { createHash } from "node:crypto";
import {
  sharedEodBoundedRead,
  sharedMarketEnabled,
  pauseSharedEod,
} from "./shared-market";
import { readBoundedMarketJson } from "./market-response";
import {
  bootstrapRadar,
  bulkPriceDay,
  bulkSplits,
  radarSymbol,
  completedRadarDate,
} from "./bulk-radar";
import { eodTicker } from "./eodhd-normalize";
export function bulkRadarEnabled() {
  return process.env.AURYN_BULK_RADAR_ENABLED === "true";
}
export function bulkRadarProvider(signal?: AbortSignal) {
  if (
    !bulkRadarEnabled() ||
    process.env.EODHD_BULK_RADAR_ENTITLEMENT !== "verified" ||
    !sharedMarketEnabled()
  )
    throw Error(
      "Bulk radar is disabled until entitlement and shared budget protection are configured.",
    );
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  if (!token) throw Error("Bulk radar provider is not configured.");
  const scope = createHash("sha256").update(token).digest("hex");
  const deadline = Date.now() + 45000;
  const read = async (
    path: string,
    params: Record<string, string>,
    ttl: number,
  ) => {
    const cached = await sharedEodBoundedRead(
      token,
      path,
      { ...params, _auryn_policy: "bulk-radar-raw-v2" },
      (value) => (value.available ? ttl : 3600000),
      async () => {
        try {
          signal?.throwIfAborted();
          if (Date.now() >= deadline)
            throw Error("Bulk radar time budget exhausted");
          const response = await fetch(
            `https://eodhd.com/api/${path}?${new URLSearchParams({ ...params, api_token: token, fmt: "json" })}`,
            {
              cache: "no-store",
              redirect: "error",
              signal: AbortSignal.any([
                AbortSignal.timeout(
                  Math.max(1, Math.min(15000, deadline - Date.now())),
                ),
                ...(signal ? [signal] : []),
              ]),
            },
          );
          if (response.status === 429 || response.status === 402) {
            await pauseSharedEod(token, 3600);
            throw Error("Bulk radar source allowance is paused.");
          }
          if (!response.ok)
            throw Error(
              "Bulk radar dataset is not available for this account.",
            );
          const data = await readBoundedMarketJson(response, 16 * 1024 * 1024);
          // Raw response is reduced/validated before entering the shared five-MiB publisher.
          const value = path.startsWith("eod-bulk-last-day/")
            ? params.type === "splits"
              ? bulkSplits(data, params.date)
              : bulkPriceDay(data, params.date)
            : data;
          const payload = JSON.stringify(value);
          const packed = {
            payload,
            available:
              !path.startsWith("eod-bulk-last-day/") ||
              params.type === "splits" ||
              value.status === "ready",
            acquiredAt: new Date().toISOString(),
            error: null,
          };
          if (
            new TextEncoder().encode(JSON.stringify(packed)).byteLength >
            4 * 1024 * 1024
          )
            throw Error("Bulk encoded payload exceeds safe cache bound");
          return packed;
        } catch {
          return {
            payload: null,
            available: false,
            acquiredAt: new Date().toISOString(),
            error:
              "Bulk radar source unavailable; retry is bounded by the hourly negative cache.",
          };
        }
      },
    );
    return {
      ...cached,
      value: cached.payload === null ? null : JSON.parse(cached.payload),
    };
  };
  return {
    scope,
    async seed(symbol: string, through: string) {
      completedRadarDate(through);
      const canonical = radarSymbol(symbol),
        ticker = eodTicker(canonical);
      const from = new Date(Date.parse(through) - 190 * 86400000)
        .toISOString()
        .slice(0, 10);
      const raw = await read(
        `eod/${ticker}`,
        { from, to: through, period: "d", order: "a" },
        86400000,
      );
      const splits = await read(
        `splits/${ticker}`,
        { from, to: through },
        86400000,
      );
      if (raw.error || splits.error)
        throw Error("Bulk radar seed history unavailable");
      return bootstrapRadar(
        canonical,
        raw.value,
        splits.value,
        raw.acquiredAt,
        splits.acquiredAt,
      );
    },
    async daily(date: string) {
      completedRadarDate(date);
      const prices = await read(
        "eod-bulk-last-day/US",
        { date, type: "eod" },
        86400000,
      );
      if (prices.error) throw Error("Bulk price source unavailable");
      if (prices.value.status !== "ready")
        return {
          prices: prices.value,
          actions: [],
          pricesAcquiredAt: prices.acquiredAt,
          actionsAcquiredAt: null,
        };
      const actions = await read(
        "eod-bulk-last-day/US",
        { date, type: "splits" },
        86400000,
      );
      if (actions.error) throw Error("Bulk action source unavailable");
      return {
        prices: prices.value,
        actions: actions.value,
        pricesAcquiredAt: prices.acquiredAt,
        actionsAcquiredAt: actions.acquiredAt,
      };
    },
  };
}
