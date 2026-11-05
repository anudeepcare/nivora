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
// Featured brands include supplied logo references. Unknown symbols get a stable design fallback.
// These identify a company; they must never indicate performance or quality.
const logoAccents: Readonly<Record<string, string>> = {
  ZETA: "#5950c7",
  APP: "#263b34",
  OSCR: "#6254ef",
  HIMS: "#264c3b",
  BE: "#63ad64",
  CRDO: "#0879c7",
  CBRS: "#365b73",
  FPS: "#208d9b",
  "ETH/USD": "#627eea",
  "BTC/USD": "#f7931a",
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
  const known = logoAccents[canonical === "GOOG" ? "GOOGL" : canonical];
  if (known) return known;
  // Decorative fallback, not a claim about the issuer's official brand color.
  const palette = [
    "#527cb8",
    "#488d79",
    "#8f69b3",
    "#b88249",
    "#598e9f",
    "#a36981",
  ];
  let hash = 0;
  for (const char of canonical) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

/** Pick a representative foreground from an already loaded logo; skip its white canvas. */
export function dominantLogoColor(pixels: ArrayLike<number>): string | null {
  if (!pixels.length || pixels.length % 4) return null;
  const bins = new Map<
    string,
    { count: number; r: number; g: number; b: number; chroma: number }
  >();
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [
      pixels[i],
      pixels[i + 1],
      pixels[i + 2],
      pixels[i + 3],
    ];
    if (
      ![r, g, b, a].every((v) => Number.isFinite(v) && v >= 0 && v <= 255) ||
      a < 180
    )
      continue;
    const hi = Math.max(r, g, b),
      lo = Math.min(r, g, b);
    if (lo > 225 || hi < 15) continue;
    const key = [r, g, b].map((v) => Math.round(v / 32)).join(":");
    const row = bins.get(key) ?? {
      count: 0,
      r: 0,
      g: 0,
      b: 0,
      chroma: hi - lo,
    };
    row.count++;
    row.r += r;
    row.g += g;
    row.b += b;
    bins.set(key, row);
  }
  const rows = [...bins.values()];
  const colored = rows.filter((r) => r.chroma > 35);
  const best = (colored.length ? colored : rows).sort(
    (a, b) => b.count - a.count,
  )[0];
  return best
    ? "#" +
        [best.r, best.g, best.b]
          .map((v) =>
            Math.round(v / best.count)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
    : null;
}
