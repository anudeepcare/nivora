import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { research } from "./providers";
import { latestFinancialEvidence } from "./analysis";
import { canonical } from "./canonical";
import { evaluateThesisRule, thesisConditionIdentity } from "./thesis-rules";
export async function checkSavedTheses(
  db: SupabaseClient,
  userId: string,
  symbol?: string,
) {
  let q = db
    .from("auryn_documents")
    .select("key,body,updated_at")
    .eq("user_id", userId)
    .eq("kind", "note")
    .eq("body->>monitorEnabled", "true")
    .order("key");
  if (symbol) q = q.eq("key", symbol);
  // Explicit bounded coverage; scheduled calls rotate via an owner-scoped cursor.
  const cursor = await db
    .from("auryn_documents")
    .select("body")
    .eq("user_id", userId)
    .eq("kind", "view")
    .eq("key", "internal:thesis-cursor")
    .maybeSingle();
  if (cursor.error) throw Error("Thesis continuation unavailable.");
  const after =
    !symbol && typeof cursor.data?.body?.filter === "string"
      ? cursor.data.body.filter
      : "";
  let result = await (after ? q.gt("key", after) : q).limit(12);
  if (!result.error && !result.data?.length && after)
    result = await db
      .from("auryn_documents")
      .select("key,body,updated_at")
      .eq("user_id", userId)
      .eq("kind", "note")
      .eq("body->>monitorEnabled", "true")
      .order("key")
      .limit(12);
  if (result.error) throw Error("Saved thesis conditions unavailable.");
  const rows = [];
  for (const note of result.data ?? []) {
    if (!symbol) {
      const saved = await db.from("auryn_documents").upsert(
        {
          user_id: userId,
          kind: "view",
          key: "internal:thesis-cursor",
          body: { filter: note.key },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,kind,key" },
      );
      if (saved.error) throw Error("Thesis continuation could not be saved.");
    }
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(note.key)) {
      rows.push({
        symbol: note.key,
        status: "unknown",
        reason: "Unsupported listing.",
      });
      continue;
    }
    try {
      const r = await research(note.key),
        check = evaluateThesisRule(
          note.body,
          latestFinancialEvidence(r).latest,
          new Date().toISOString(),
        );
      if (check.status === "review") {
        const ruleHash = createHash("sha256")
          .update(thesisConditionIdentity(note.body))
          .digest("hex");
        const event = {
          user_id: userId,
          rule_key: `thesis:${note.key}`,
          event_key: `${ruleHash}:${check.period}:${check.value}`,
          symbol: note.key,
          snapshot_id: canonical(r).id,
          title: `${note.key}: thesis condition needs review`,
          detail: `${check.label} ${check.value.toFixed(2)}${check.unit} is ${check.direction} your ${check.threshold}${check.unit} threshold. ${check.basis}, period ${check.period}, ${check.currency}. Review your reasoning; the thesis is not automatically marked broken.`,
        };
        const saved = await db.from("auryn_alert_events").upsert(event, {
          onConflict: "user_id,rule_key,event_key",
          ignoreDuplicates: true,
        });
        if (saved.error) throw Error("Thesis alert could not be saved.");
      }
      rows.push({ symbol: note.key, ...check });
    } catch {
      rows.push({
        symbol: note.key,
        status: "unknown",
        reason:
          "Evidence or alert storage is unavailable; this check did not complete.",
      });
    }
  }
  return {
    rows,
    checkedAt: new Date().toISOString(),
    coverage: symbol
      ? "Selected company"
      : "Up to 12 saved conditions per run; subsequent runs continue in symbol order.",
  };
}
