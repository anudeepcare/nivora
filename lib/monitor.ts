import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertRule } from "./documents";
import { research } from "./providers";
import { canonical } from "./canonical";
import { evaluateAlert } from "./alert-policy";
export async function checkAlerts(db: SupabaseClient, userId: string) {
  const rules = await db
    .from("auryn_documents")
    .select("key,body,created_at")
    .eq("user_id", userId)
    .eq("kind", "alert");
  if (rules.error) throw Error("Alert rules unavailable.");
  let checked = 0,
    created = 0;
  const errors: string[] = [];
  const sources = new Map<string, Awaited<ReturnType<typeof research>>>();
  for (const record of (rules.data ?? [])
    .filter((v) => v.body?.enabled)
    .slice(0, 12)) {
    const rule = record.body as AlertRule;
    try {
      let r = sources.get(rule.symbol);
      if (!r) {
        r = await research(rule.symbol);
        sources.set(rule.symbol, r);
      }
      const c = canonical(r);
      checked++;
      const event = evaluateAlert(
        rule,
        {
          snapshotId: c.id,
          price: r.quote.price,
          stale: r.quote.stale,
          monthly: c.monthly?.multiplier ?? null,
          month: c.monthly?.month ?? null,
          filings: r.filings,
        },
        record.created_at,
      );
      if (!event) continue;
      const saved = await db
        .from("auryn_alert_events")
        .upsert(
          { ...event, user_id: userId, rule_key: record.key },
          { onConflict: "user_id,rule_key,event_key", ignoreDuplicates: true },
        )
        .select("id");
      if (saved.error) throw Error("Could not persist the alert.");
      created += saved.data?.length ?? 0;
    } catch {
      errors.push(`${rule.symbol}: the source or alert store was unavailable.`);
    }
  }
  return { checked, created, errors, checkedAt: new Date().toISOString() };
}
