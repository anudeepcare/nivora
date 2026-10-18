export type AlertRule = {
  symbol: string;
  type:
    | "price-above"
    | "price-below"
    | "monthly-zone"
    | "new-filing"
    | "earnings-soon";
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
    const source = text("sourceUrl", 1000);
    if (source && !/^https:\/\//.test(source))
      throw Error("Source links must use HTTPS.");
    return {
      thesis: text("thesis", 3000),
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
    return {
      name: text("name", 80),
      symbol,
      type,
      threshold,
      enabled: v.enabled === true,
    };
  }
  throw Error("Unsupported document type.");
}
