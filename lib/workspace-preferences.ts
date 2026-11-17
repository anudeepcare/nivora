import { sanitizeResearchPreferences } from "./research-preferences.ts";
export function workspacePreferences(value: unknown) {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    ...sanitizeResearchPreferences(raw),
    hiddenSignals: Array.isArray(raw.hiddenSignals)
      ? [
          ...new Set(
            raw.hiddenSignals.filter(
              (v): v is string =>
                typeof v === "string" &&
                [
                  "congressional",
                  "insiders",
                  "institutions",
                  "options",
                  "technicals",
                ].includes(v),
            ),
          ),
        ]
      : [],
    visibleMetrics: Array.isArray(raw.visibleMetrics)
      ? [
          ...new Set(
            raw.visibleMetrics.filter(
              (v): v is string =>
                typeof v === "string" &&
                ["business", "valuation", "price", "ownership"].includes(v),
            ),
          ),
        ]
      : ["business", "valuation", "price", "ownership"],
    watchSort: ["name", "change", "review", "event"].includes(
      String(raw.watchSort),
    )
      ? String(raw.watchSort)
      : "name",
    chartRange: ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].includes(
      String(raw.chartRange),
    )
      ? String(raw.chartRange)
      : "1Y",
    cashReservePercent:
      typeof raw.cashReservePercent === "number" &&
      Number.isFinite(raw.cashReservePercent) &&
      raw.cashReservePercent >= 0 &&
      raw.cashReservePercent <= 100
        ? raw.cashReservePercent
        : null,
    maxLossPercent:
      typeof raw.maxLossPercent === "number" &&
      Number.isFinite(raw.maxLossPercent) &&
      raw.maxLossPercent > 0 &&
      raw.maxLossPercent <= 100
        ? raw.maxLossPercent
        : null,
    concentrationLimit:
      typeof raw.concentrationLimit === "number" &&
      Number.isFinite(raw.concentrationLimit) &&
      raw.concentrationLimit > 0 &&
      raw.concentrationLimit <= 100
        ? raw.concentrationLimit
        : null,
  };
}
