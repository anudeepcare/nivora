import type { AlertRule } from "./documents";
export function evaluateAlert(
  rule: AlertRule,
  input: {
    asOf?: string;
    earnings?: { date: string }[];
    financial?: {value:number;period:string;previous:number|null};
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
  if (["interest-below","sbc-above","current-below","margin-below"].includes(rule.type)) {
    const f=input.financial,t=rule.threshold;
    if(!f||t==null||f.previous==null||![f.value,f.previous,t].every(Number.isFinite))return null;
    const breached=(v:number)=>rule.type==='sbc-above'?v>t:v<t;
    if(!breached(f.value)||breached(f.previous))return null;
    return {...base,event_key:`financial:${rule.type}:${t}:${f.period}`,title:`${rule.symbol}: financial threshold crossed`,detail:`${rule.type}: ${f.previous.toFixed(2)} → ${f.value.toFixed(2)}; threshold ${t}, reporting period ${f.period}. Observed between checks, not an intraday or trade signal.`};
  }
  if (rule.type === "earnings-soon") {
    const now = Date.parse(input.asOf ?? ""),
      today = (input.asOf ?? "").slice(0, 10);
    if (
      !Number.isFinite(now) ||
      rule.threshold == null ||
      rule.threshold < 1 ||
      rule.threshold > 30
    )
      return null;
    const next = input.earnings
      ?.filter(
        (e) =>
          e.date >= today &&
          Number.isFinite(Date.parse(e.date)) &&
          Date.parse(e.date) - Date.parse(today) <= rule.threshold! * 86400000,
      )
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return next
      ? {
          ...base,
          event_key: `earnings:${next.date}`,
          title: `${rule.symbol}: earnings approaching`,
          detail: `Scheduled report ${next.date}. Dates can change; check the company calendar before acting.`,
        }
      : null;
  }
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
