import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertRule } from "./documents";
import { research } from "./providers";
import { canonical } from "./canonical";
import { eodEnabled, eodRequest } from "./eodhd";
import { eodTicker } from "./eodhd-normalize";
import { calendarHighlights, marketDay } from "./home-feed";
import { latestFinancialEvidence } from "./analysis";
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
      let earnings =
        r.evidence?.earnings.map((e) => ({ date: e.date, actual: e.actual })) ??
        [];
      if (rule.type === "earnings-soon" && eodEnabled()) {
        const from = marketDay(r.retrievedAt),
          to = new Date(Date.parse(from) + 30 * 86400000)
            .toISOString()
            .slice(0, 10);
        try {
          const raw = await eodRequest(
            "calendar/earnings",
            { symbols: eodTicker(rule.symbol), from, to },
            300000,
          );
          earnings = calendarHighlights(raw, null, [rule.symbol], from, to).map(
            (e) => ({
              date: e.date,
              actual:
                e.actual ??
                earnings.find((known) => known.date === e.date)?.actual ??
                null,
            }),
          );
        } catch {
          errors.push(
            `${rule.symbol}: scheduled earnings could not be refreshed; existing report dates were used.`,
          );
        }
      }
      const c = canonical(r);
      checked++;
      let financial:
        | {
            value: number;
            period: string;
            previous: number | null;
            currency: string;
            basis: string;
          }
        | undefined;
      const financialRule = [
        "interest-below",
        "sbc-above",
        "current-below",
        "margin-below",
      ].includes(rule.type);
      const stateKey = `fin-alert:${createHash("sha256").update(record.key).digest("hex")}`;
      if (financialRule) {
        const p = latestFinancialEvidence(r).latest;
        const v =
          rule.type === "interest-below"
            ? p?.interestCoverage
            : rule.type === "sbc-above"
              ? p?.sbcRevenue
              : rule.type === "current-below"
                ? p?.currentRatio
                : p?.margin;
        if (!p || v == null || !Number.isFinite(v)) continue;
        const state = await db
          .from("auryn_documents")
          .select("body")
          .eq("user_id", userId)
          .eq("kind", "view")
          .eq("key", stateKey)
          .maybeSingle();
        if (state.error) throw Error("Financial alert baseline unavailable.");
        const old = state.data?.body;
        const previous =
          old?.filter !== "" &&
          typeof old?.filter === "string" &&
          Number.isFinite(Number(old.filter)) &&
          old?.name === rule.type &&
          old?.symbols?.[0] === rule.symbol &&
          old?.currency === p.currency &&
          old?.basis === p.basis
            ? Number(old.filter)
            : null;
        // A backwards reporting period must not replace newer baseline evidence.
        if (old?.horizon && p.end < old.horizon) continue;
        financial = {
          value: v,
          period: p.end,
          previous,
          currency: p.currency,
          basis: p.basis,
        };
      }
      const event = evaluateAlert(
        rule,
        {
          financial,
          asOf: r.retrievedAt,
          earnings,
          snapshotId: c.id,
          price: r.quote.price,
          stale: r.quote.stale,
          monthly: c.monthly?.multiplier ?? null,
          month: c.monthly?.month ?? null,
          filings: r.filings,
        },
        record.created_at,
      );
      const saveBaseline = async () => {
        if (!financial) return;
        const saved = await db.from("auryn_documents").upsert(
          {
            user_id: userId,
            kind: "view",
            key: stateKey,
            body: {
              name: rule.type,
              symbols: [rule.symbol],
              filter: String(financial.value),
              horizon: financial.period,
              currency: financial.currency,
              basis: financial.basis,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,kind,key" },
        );
        if (saved.error) throw Error("Financial baseline could not be saved.");
      };
      if (!event) {
        await saveBaseline();
        continue;
      }
      const saved = await db
        .from("auryn_alert_events")
        .upsert(
          { ...event, user_id: userId, rule_key: record.key },
          { onConflict: "user_id,rule_key,event_key", ignoreDuplicates: true },
        )
        .select("id");
      if (saved.error) throw Error("Could not persist the alert.");
      created += saved.data?.length ?? 0;
      await saveBaseline();
    } catch {
      errors.push(`${rule.symbol}: the source or alert store was unavailable.`);
    }
  }
  return { checked, created, errors, checkedAt: new Date().toISOString() };
}
