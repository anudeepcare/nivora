import type { AlertRule } from "./documents";
export function evaluateAlert(
  rule: AlertRule,
  input: {
    snapshotId: string;
    price: number | null;
    stale: boolean;
    monthly: number | null;
    month: string | null;
    filings: { date: string; form: string; url: string }[];
  },
  since: string,
) {
  if (!rule.enabled) return null;
  const base = { symbol: rule.symbol, snapshot_id: input.snapshotId };
  if (rule.type === "new-filing") {
    const f = input.filings
      .filter((f) => f.date >= since.slice(0, 10))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return f
      ? {
          ...base,
          event_key: `filing:${f.url}`,
          title: `${rule.symbol}: ${f.form} filed`,
          detail: `Filed ${f.date}. Review the original disclosure before changing the thesis.`,
        }
      : null;
  }
  if (rule.type === "monthly-zone")
    return input.monthly === rule.threshold && input.month
      ? {
          ...base,
          event_key: `monthly:${input.month}:${input.monthly}`,
          title: `${rule.symbol}: ${input.monthly === 0 ? "pause" : `${input.monthly}×`} monthly zone`,
          detail: `Completed month ${input.month}. Experimental price policy; business evidence is a separate assessment.`,
        }
      : null;
  if (input.stale || input.price == null || rule.threshold == null) return null;
  const hit =
    rule.type === "price-above"
      ? input.price >= rule.threshold
      : input.price <= rule.threshold;
  return hit
    ? {
        ...base,
        event_key: `price:${rule.type}:${rule.threshold}`,
        title: `${rule.symbol} ${rule.type === "price-above" ? "above" : "below"} your level`,
        detail: `Observed price ${input.price.toFixed(2)} crossed your ${rule.threshold.toFixed(2)} reference. This alert is delivered once per rule; create a new rule to re-arm it.`,
      }
    : null;
}
