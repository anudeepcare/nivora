import { getAccess } from "@/lib/access-server";
import { backgroundWork } from "@/lib/provider-budget";
import { timingSafeEqual } from "node:crypto";
import { failure, HttpError, privateJson } from "@/lib/server";
import { serviceDb } from "@/lib/paper";
import { checkSavedTheses } from "@/lib/thesis-monitor";
import { runThesisQueue } from "@/lib/thesis-scheduler";
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
    if (process.env.AURYN_THESIS_JOB_ENABLED !== "true")
      return privateJson({ enabled: false, processed: 0 });
    const db = serviceDb();
    const results: unknown[] = [];
    results.push({
      theses: await runThesisQueue({
        enabled: process.env.AURYN_THESIS_JOB_ENABLED === "true",
        claim: async (limit) => {
          const result = await db.rpc("auryn_claim_theses", { p_limit: limit });
          if (result.error)
            throw new HttpError("Thesis queue unavailable.", 503);
          return result.data ?? [];
        },
        eligible: async (userId) => {
          const access = await getAccess(userId);
          return !access.sampleOnly && access.features.financials;
        },
        check: async (job) => {
          const result = await backgroundWork(() =>
            checkSavedTheses(db, job.user_id, job.symbol, job.lease_token),
          );
          return (
            result.rows.length === 1 &&
            ["review", "within-rule"].includes(result.rows[0].status)
          );
        },
        finish: async (job, ok) => {
          const result = await db.rpc("auryn_finish_thesis", {
            p_user: job.user_id,
            p_symbol: job.symbol,
            p_lease: job.lease_token,
            p_ok: ok,
          });
          if (result.error) throw Error("Thesis lease could not be finished.");
        },
      }),
    });
    return privateJson({ checkedAt: new Date().toISOString(), results });
  } catch (e) {
    return failure(e);
  }
}
