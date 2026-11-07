import { parseBoardState } from "./exposure-board.ts";
import { cleanSimulationLedger } from "./options-simulation.ts";
import { cleanEstimateSnapshot } from "./estimate-revisions.ts";
import { workspacePreferences } from "./workspace-preferences.ts";
export type AlertRule = {
  symbol: string;
  type:
    | "price-above"
    | "price-below"
    | "monthly-zone"
    | "new-filing"
    | "earnings-soon"
    | "interest-below"
    | "sbc-above"
    | "current-below"
    | "margin-below"
    | "exposure-approach"
    | "exposure-cross"
    | "exposure-change";
  exposureRole?: "fixed" | "largest";
  referenceStrike?: number;
  marginPercent?: number;
  expiry?: string;
  threshold: number | null;
  enabled: boolean;
  name: string;
};
export function cleanDocument(
  kind: string,
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("A valid document is required.");
  const v = value as Record<string, unknown>;
  const text = (key: string, max: number) =>
    typeof v[key] === "string" ? v[key].trim().slice(0, max) : "";
  if (kind === "note") {
    const reviewDate = text("reviewDate", 10);
    if (
      reviewDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ||
        !Number.isFinite(Date.parse(reviewDate)) ||
        new Date(reviewDate).toISOString().slice(0, 10) !== reviewDate)
    )
      throw Error("Choose a valid review date.");
    const source = text("sourceUrl", 1000);
    if (source && !/^https:\/\//.test(source))
      throw Error("Source links must use HTTPS.");
    return {
      thesis: text("thesis", 3000),
      reviewDate,
      counterargument: text("counterargument", 2000),
      condition: text("condition", 1500),
      milestone: text("milestone", 1500),
      sourceUrl: source,
      evidenceDate: text("evidenceDate", 10),
      status: ["researching", "intact", "review", "broken"].includes(
        String(v.status),
      )
        ? v.status
        : "researching",
      horizon: ["tactical", "swing", "long-term"].includes(String(v.horizon))
        ? v.horizon
        : "long-term",
    };
  }
  if (kind === "comparison" || kind === "view") {
    const symbols = Array.isArray(v.symbols)
      ? [...new Set(v.symbols.map(String))].slice(0, 30)
      : [];
    if (
      symbols.some((s) => !/^[A-Z0-9][A-Z0-9.-]{0,14}(\/[A-Z]{3,5})?$/.test(s))
    )
      throw Error("Check your symbols.");
    return {
      name: text("name", 80),
      ...(kind === "view" && v.marketViews !== undefined
        ? { marketViews: cleanMarketViews(v.marketViews) }
        : {}),
      ...(kind === "view" && v.simulationLedger !== undefined
        ? {
            simulationLedger: (() => {
              const ledger = cleanSimulationLedger(v.simulationLedger);
              if (!ledger)
                throw Error("Invalid or oversized simulation ledger.");
              return ledger;
            })(),
          }
        : {}),
      ...(kind === "view" && v.estimateSnapshot !== undefined
        ? { estimateSnapshot: cleanEstimateSnapshot(v.estimateSnapshot) }
        : {}),
      ...(kind === "view" && v.preferences
        ? { preferences: workspacePreferences(v.preferences) }
        : {}),
      ...(kind === "view" && v.criteria && typeof v.criteria === "object" ? {criteria:(()=>{const c=v.criteria as Record<string,unknown>;return {sector:typeof c.sector==='string'&&c.sector.trim()?c.sector.trim().slice(0,100):'all',pace:['P0','P1','P2','P3','P4','unavailable'].includes(String(c.pace))?String(c.pace):'all',quality:['cash','growth','profit'].includes(String(c.quality))?String(c.quality):'all'};})()} : {}),
      symbols,
      filter: text("filter", 40),
      horizon: text("horizon", 20),
    };
  }
  if (kind === "alert") {
    const type = String(v.type),
      symbol = text("symbol", 20).toUpperCase();
    if (
      ![
        "price-above",
        "price-below",
        "monthly-zone",
        "new-filing",
        "earnings-soon",
        "interest-below",
        "sbc-above",
        "current-below",
        "margin-below",
        "exposure-approach",
        "exposure-cross",
        "exposure-change",
      ].includes(type) ||
      !/^[A-Z0-9][A-Z0-9.-]{0,14}(\/[A-Z]{3,5})?$/.test(symbol)
    )
      throw Error("Choose a valid symbol and alert type.");
    const threshold =
      typeof v.threshold === "number" && Number.isFinite(v.threshold)
        ? v.threshold
        : null;
    if (type.startsWith("price") && (threshold == null || threshold <= 0))
      throw Error("Enter a positive price threshold.");
    if (
      type === "monthly-zone" &&
      (threshold == null || ![0, 1, 2, 3, 4].includes(threshold))
    )
      throw Error("Choose a monthly zone from zero to four.");
    if (
      type === "earnings-soon" &&
      (threshold == null ||
        !Number.isInteger(threshold) ||
        threshold < 1 ||
        threshold > 30)
    )
      throw Error("Choose one to thirty days before earnings.");
    if (
      ["interest-below", "sbc-above", "current-below", "margin-below"].includes(
        type,
      ) &&
      (threshold == null ||
        threshold < (type === "margin-below" ? -1000 : 0) ||
        threshold > 1000)
    )
      throw Error("Enter a valid financial threshold.");
    let exposure: Record<string, unknown> = {};
    if (type.startsWith("exposure-")) {
      if (
        symbol.includes("/") ||
        threshold === null ||
        threshold <= 0 ||
        threshold > 1000000000
      )
        throw Error("Enter a positive exposure reference or change threshold.");
      if (type === "exposure-change" && threshold > 1000)
        throw Error("Choose an exposure change threshold up to 1000%.");
      const role = v.exposureRole === "largest" ? "largest" : "fixed";
      const strike =
        typeof v.referenceStrike === "number" &&
        Number.isFinite(v.referenceStrike) &&
        v.referenceStrike > 0
          ? v.referenceStrike
          : null;
      if (role === "fixed" && type === "exposure-change" && strike === null)
        throw Error("Choose a strike to monitor for exposure changes.");
      const margin =
        v.marginPercent === undefined ? 0.5 : Number(v.marginPercent);
      if (!Number.isFinite(margin) || margin < 0.01 || margin > 10)
        throw Error("Choose an approach margin between 0.01% and 10%.");
      const expiry = text("expiry", 10);
      if (
        expiry &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
          !Number.isFinite(Date.parse(expiry)) ||
          new Date(expiry).toISOString().slice(0, 10) !== expiry)
      )
        throw Error("Choose a valid exposure expiration.");
      exposure = {
        exposureRole: role,
        marginPercent: margin,
        ...(strike !== null ? { referenceStrike: strike } : {}),
        ...(expiry ? { expiry } : {}),
      };
    }
    return {
      name: text("name", 80),
      symbol,
      type,
      ...exposure,
      threshold,
      enabled: v.enabled === true,
    };
  }
  throw Error("Unsupported document type.");
}

export function cleanMarketViews(value: unknown) {
  if (!Array.isArray(value) || value.length > 10)
    throw Error("Keep up to ten saved market views.");
  const clean = parseBoardState(JSON.stringify({ presets: value })).presets;
  if (
    clean.length !== value.length ||
    new Set(clean.map((p) => p.name)).size !== clean.length
  )
    throw Error("Check saved market view settings and names.");
  return clean;
}
