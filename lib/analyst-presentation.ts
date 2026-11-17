/** Never borrow a trading currency when the target feed omits its own units. */
export function consensusTarget(value: unknown, currency: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return "Not supplied";
  const code =
    typeof currency === "string" && /^[A-Z]{3}$/i.test(currency)
      ? currency.toUpperCase()
      : null;
  const number = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return code ? `${code} ${number}` : `${number} (currency not supplied)`;
}
