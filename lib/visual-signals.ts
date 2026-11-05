/** Chart color describes the displayed endpoints, not total return or a forecast. */
export function seriesDirection(
  values: readonly number[],
): "up" | "down" | "flat" | "unknown" {
  if (values.length < 2 || values.some((v) => !Number.isFinite(v)))
    return "unknown";
  const change = values[values.length - 1] - values[0];
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

// Representative chromatic fills sampled from bundled public/logos assets.
// Monochrome, unknown and remotely supplied logos use a neutral accent.
// These identify a company; they must never indicate performance or quality.
const logoAccents: Readonly<Record<string, string>> = {
  NVDA: "#76B900",
  GOOGL: "#4285F4",
  AMZN: "#ff9201",
  SHOP: "#7AB55C",
  NOW: "#81b5a1",
  NBIS: "#daff33",
  CRM: "#00a2e1",
  SPOT: "#1DB954",
  ASTS: "#f99f2d",
  CIFR: "#ffba00",
  MU: "#0093d6",
  SOFI: "#00a2c7",
  CRWV: "#2b42e7",
  ADBE: "#fa0c00",
  NFLX: "#E50914",
  TSLA: "#E82127",
  IREN: "#0B344F",
  META: "#0866FF",
  SAP: "#01b5ef",
  "SOL/USD": "#9568FF",
  "DOGE/USD": "#C2A633",
};
export function companyAccent(symbol: string): string {
  const canonical = symbol
    .trim()
    .toUpperCase()
    .replace(/-(USD)$/, "/$1");
  return logoAccents[canonical === "GOOG" ? "GOOGL" : canonical] ?? "#66717b";
}
