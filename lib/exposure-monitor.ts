import { allowMarketUser } from "./shared-market";
import { getAccess, requestAccess, requireFeature } from "./access-server";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanDocument, type AlertRule } from "./documents";
import {
  captureMarket,
  marketSigningKey,
  type MarketCapture,
} from "./market-workspace-server";
import {
  evaluateExposureRule,
  sealCheckpoint,
  verifyCheckpoint,
  type ExposureObservation,
} from "./market-checkpoints";

export async function checkExposureAlert(
  db: SupabaseClient,
  userId: string,
  record: { key: string; body: unknown },
  source: Map<string, Promise<MarketCapture>>,
  request?: Request,
) {
  const rule = cleanDocument("alert", record.body) as AlertRule;
  if (!rule.enabled || !rule.type.startsWith("exposure-"))
    return { checked: 0, created: 0 };
  const access = request
    ? await requestAccess(request, userId)
    : await getAccess(userId);
  if (access.sampleOnly) throw Error("Market data is not enabled.");
  requireFeature(access, "options");
  const signingKey = marketSigningKey();
  const sourceKey = JSON.stringify([userId, rule.symbol, rule.expiry ?? ""]);
  if (!source.has(sourceKey)) {
    if (!(await allowMarketUser(userId)))
      throw Error(
        "Market-data allowance reached. Exposure checks remain pending.",
      );
    source.set(
      sourceKey,
      captureMarket(db, userId, rule.symbol, rule.expiry ?? null),
    );
  }
  const snapshot = await source.get(sourceKey)!;
  const board = snapshot.board;
  const nodes = board.cells.filter(
    (c) => c.gex !== null && (!rule.expiry || c.expiry === rule.expiry),
  );
  const node =
    rule.exposureRole === "largest"
      ? [...nodes].sort(
          (a, b) =>
            Math.abs(b.gex!) - Math.abs(a.gex!) || a.key.localeCompare(b.key),
        )[0]
      : nodes.find(
          (c) => c.strike === (rule.referenceStrike ?? rule.threshold),
        );
  if (!node)
    return {
      checked: 0,
      created: 0,
      error: `${rule.symbol}: the selected exposure reference has no complete gamma/OI inputs.`,
    };
  const current: ExposureObservation = {
    price: board.spot,
    strike: node.strike,
    gex: node.gex,
    observedAt:
      rule.type === "exposure-change" ? node.observed! : snapshot.quoteAsOf,
    fingerprint: snapshot.id,
    universe: board.universe,
    reference: node.key,
  };
  const key =
    "internal:exposure:" +
    createHash("sha256").update(record.key).digest("hex").slice(0, 40);
  // A changed rule starts a new baseline, including changes to symbol, expiry,
  // reference role, margin and threshold. The display name is immaterial.
  const { name: _name, ...settings } = rule;
  const ruleFingerprint = createHash("sha256")
    .update(JSON.stringify(settings))
    .digest("hex");
  type Pending = {
    event_key: string;
    symbol: string;
    snapshot_id: string;
    title: string;
    detail: string;
  };
  type Baseline = {
    ruleKey: string;
    ruleFingerprint: string;
    state: ExposureObservation;
    pending: Pending | null;
  };
  let created = 0;
  const emit = async (pending: Pending | null) => {
    if (!pending) return;
    const saved = await db
      .from("auryn_alert_events")
      .upsert(
        { user_id: userId, rule_key: record.key, ...pending },
        { onConflict: "user_id,rule_key,event_key", ignoreDuplicates: true },
      )
      .select("id");
    if (saved.error) throw Error("Exposure alert could not be stored.");
    created += saved.data?.length ?? 0;
  };
  // Retry a lost compare-and-swap against the newer committed baseline. An older
  // concurrent capture must never replace a newer observation or emit from it.
  for (let attempt = 0; attempt < 3; attempt++) {
    const stored = await db
      .from("auryn_documents")
      .select("body,updated_at")
      .eq("user_id", userId)
      .eq("kind", "view")
      .eq("key", key)
      .maybeSingle();
    if (stored.error) throw Error("Exposure alert baseline unavailable.");
    const trusted = verifyCheckpoint(stored.data?.body, userId, signingKey)
      ? (stored.data?.body.snapshot as Baseline)
      : undefined;
    const matching =
      trusted?.ruleKey === record.key &&
      trusted.ruleFingerprint === ruleFingerprint
        ? trusted
        : undefined;
    // Persisted pending events make a failed event insert retryable after the
    // baseline commits; its unique event key makes repeated delivery harmless.
    if (trusted?.ruleKey === record.key) await emit(trusted.pending);
    const previous = matching?.state ?? null;
    if (
      previous &&
      (previous.fingerprint === current.fingerprint ||
        Date.parse(previous.observedAt) >= Date.parse(current.observedAt))
    )
      return { checked: 1, created };
    const event = evaluateExposureRule(rule, previous, current);
    const pending = event
      ? {
          event_key: `exposure:${ruleFingerprint}:${snapshot.id}:${node.key}`,
          symbol: rule.symbol,
          snapshot_id: snapshot.id,
          ...event,
        }
      : null;
    const body = sealCheckpoint(
      { ruleKey: record.key, ruleFingerprint, state: current, pending },
      userId,
      signingKey,
    );
    // Store only the state needed for comparisons, well below the existing
    // documents table's 20 KB JSONB constraint (never a full option checkpoint).
    if (Buffer.byteLength(JSON.stringify(body)) > 12000)
      throw Error("Exposure alert baseline exceeds account storage limits.");
    const updated_at = new Date(
      Math.max(Date.now(), Date.parse(stored.data?.updated_at ?? "") + 1 || 0),
    ).toISOString();
    const row = { user_id: userId, kind: "view", key, body, updated_at };
    const saved = stored.data
      ? await db
          .from("auryn_documents")
          .update(row)
          .eq("user_id", userId)
          .eq("kind", "view")
          .eq("key", key)
          .eq("updated_at", stored.data.updated_at)
          .select("updated_at")
      : await db.from("auryn_documents").insert(row).select("updated_at");
    if (saved.error) {
      if (saved.error.code === "23505") continue;
      throw Error("Exposure alert baseline could not be saved.");
    }
    if (!saved.data?.length) continue;
    await emit(pending);
    return { checked: 1, created };
  }
  throw Error("Exposure alert baseline changed concurrently. Retry the check.");
}
