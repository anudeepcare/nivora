import {accessEnabled,exactOwner} from "@/lib/access-server";
import { scheduledCandidates } from "@/lib/paper-policy";
import { backgroundWork } from "@/lib/provider-budget";
import { timingSafeEqual } from "node:crypto";
import { failure, HttpError, privateJson } from "@/lib/server";
import { serviceDb, executePaper } from "@/lib/paper";
import { checkAlerts } from "@/lib/monitor";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET,
      provided = request.headers.get("authorization") ?? "",
      expected = `Bearer ${secret}`;
    if (
      !secret ||
      secret.length < 32 ||
      Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    )
      throw new HttpError("Job authorization required.", 401);
    const db = serviceDb(),
      owner = process.env.AURYN_PAPER_OWNER_ID,
      results: unknown[] = [];
    // A bounded operator-owned job. Never scan or execute on arbitrary tenants.
    const alertOwner = process.env.AURYN_ALERT_JOB_USER_ID;
    if (alertOwner && (!accessEnabled() || exactOwner(alertOwner)))
      results.push({
        alerts: await backgroundWork(() => checkAlerts(db, alertOwner)),
      });
    if (
      owner &&
      (!accessEnabled() || exactOwner(owner)) &&
      process.env.AURYN_PAPER_SCHEDULE_ENABLED === "true" &&
      process.env.AURYN_PAPER_EXECUTION_ENABLED === "true"
    ) {
      const plans = await db
        .from("auryn_paper_plans")
        .select("id")
        .eq("user_id", owner)
        .eq("enabled", true)
        .order("created_at")
        .limit(20);
      if (plans.error)
        throw new HttpError("Scheduled plans could not be read.", 503);
      const runs = await db
        .from("auryn_paper_runs")
        .select("plan_id")
        .eq("user_id", owner)
        .eq("period_key", new Date().toISOString().slice(0, 7));
      if (runs.error)
        throw new HttpError("Scheduled run history unavailable.", 503);
      const done = new Set((runs.data ?? []).map((r) => r.plan_id));
      const candidates = (plans.data ?? [])
        .filter((p) => !done.has(p.id))
        .map((p) => p.id);
      const offset = candidates.length
        ? Math.floor(Date.now() / 60000) % candidates.length
        : 0;
      results.push(
        ...(await scheduledCandidates(
          [...candidates.slice(offset), ...candidates.slice(0, offset)],
          (id) => backgroundWork(() => executePaper(owner, id)),
        )),
      );
    }
    if (process.env.AURYN_SUPPORT_EMAIL_ENABLED === "true") {
      const { retrySupport } = await import("@/lib/support-delivery");
      results.push({support:await retrySupport().catch(()=>({pending:true}))});
    }
    return privateJson({ checkedAt: new Date().toISOString(), results });
  } catch (e) {
    return failure(e);
  }
}
