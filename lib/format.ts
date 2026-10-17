export const amount = (
  n: number | null | undefined,
  currency = "USD",
  compact = false,
) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (!/^[A-Z]{3}$/.test(currency))
    return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} · ${currency || "currency unknown"}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(n);
};
export const percent = (n: number | null | undefined, signed = false) =>
  typeof n !== "number" || !Number.isFinite(n)
    ? "—"
    : `${signed && n > 0 ? "+" : ""}${n.toFixed(1)}%`;
export const dateLabel = (s: string | null | undefined) =>
  s && Number.isFinite(Date.parse(s))
    ? new Date(s).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Date unavailable";
export const words = (s: string) =>
  s
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
export function symbolInput(value: unknown) {
  const s = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.-]{0,14}(\/[A-Z]{3,5})?$/.test(s))
    throw Error("Enter a valid stock symbol or crypto pair.");
  return s;
}
