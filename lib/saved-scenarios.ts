import type { ProjectionInputs } from "./price-projection.ts";
export type SavedScenario = {
  version: 1;
  symbol: string;
  currency: string;
  baselineDate: string;
  savedAt: string;
  years: number;
  selected: "Bear" | "Base" | "Bull";
  input: ProjectionInputs;
};
export function cleanSavedScenario(value: unknown): SavedScenario {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Check the saved scenario.");
  const x = value as Record<string, unknown>;
  const symbol = String(x.symbol ?? "");
  const currency = String(x.currency ?? "");
  if (
    x.version !== 1 ||
    !/^[A-Z0-9][A-Z0-9.-]{0,14}(\/[A-Z]{3,5})?$/.test(symbol) ||
    !/^[A-Z]{3}$/.test(currency)
  )
    throw Error("Check the scenario company and currency.");
  const date = (v: unknown) =>
    typeof v === "string" &&
    v.length <= 30 &&
    /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v) &&
    Number.isFinite(Date.parse(v));
  if (!date(x.baselineDate) || !date(x.savedAt))
    throw Error("Check the scenario dates.");
  if (
    ![1, 3, 5].includes(Number(x.years)) ||
    typeof x.years !== "number" ||
    !["Bear", "Base", "Bull"].includes(String(x.selected))
  )
    throw Error("Check the scenario horizon and case.");
  const raw = x.input as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Check the scenario assumptions.");
  const bounds = {
    revenue: [0, 1e18],
    shares: [0, 1e18],
    growth: [-50, 70],
    margin: [0, 100],
    multiple: [0, 100],
    dilution: [0, 30],
    discount: [0, 30],
  } as const;
  const input = {} as ProjectionInputs;
  for (const key of Object.keys(bounds) as (keyof ProjectionInputs)[]) {
    const value = raw[key];
    const [min, max] = bounds[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (["revenue", "shares", "margin", "multiple", "discount"].includes(key) &&
        value === 0)
    )
      throw Error("Check the scenario assumptions.");
    input[key] = value;
  }
  return {
    version: 1,
    symbol,
    currency,
    baselineDate: x.baselineDate as string,
    savedAt: x.savedAt as string,
    years: x.years,
    selected: x.selected as SavedScenario["selected"],
    input,
  };
}
export function matchingSavedScenario(
  value: unknown,
  symbol: string,
  currency: string,
): SavedScenario | null {
  try {
    const saved = cleanSavedScenario(value);
    return saved.symbol === symbol && saved.currency === currency
      ? saved
      : null;
  } catch {
    return null;
  }
}
export function applySavedScenario(
  saved: SavedScenario,
  current: ProjectionInputs,
): ProjectionInputs {
  return { ...saved.input, revenue: current.revenue, shares: current.shares };
}
