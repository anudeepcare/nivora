import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
import {
  paperOwner,
  serviceDb,
  executePaper,
  reconcilePaper,
} from "@/lib/paper";
import { cleanPaperPlan } from "@/lib/paper-policy";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request);
    paperOwner(user);
    const [plans, runs] = await Promise.all([
      db
        .from("auryn_paper_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      db
        .from("auryn_paper_runs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (plans.error || runs.error)
      throw new HttpError(
        "Apply the paper-workspace migration to load plans.",
        503,
      );
    return privateJson({
      plans: plans.data,
      runs: runs.data,
      executionEnabled: process.env.AURYN_PAPER_EXECUTION_ENABLED === "true",
      scheduleEnabled: process.env.AURYN_PAPER_SCHEDULE_ENABLED === "true",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await account(request);
    paperOwner(user);
    limit(`paper-write:${user.id}`, 10);
    const b = await request.json(),
      db = serviceDb();
    if (b.op === "save") {
      let body;
      try {
        body = cleanPaperPlan(b.body ?? {});
      } catch (e) {
        throw new HttpError(e instanceof Error ? e.message : "Invalid plan");
      }
      const out = await db
        .from("auryn_paper_plans")
        .insert({ user_id: user.id, body, enabled: false })
        .select("id")
        .single();
      if (out.error) throw new HttpError("Plan could not be saved.", 503);
      return privateJson({
        id: out.data.id,
        message:
          "Saved paused. Review the exact shares, limit price and caps before arming.",
      });
    }
    if (b.op === "pause-all") {
      const out = await db
        .from("auryn_paper_plans")
        .update({ enabled: false })
        .eq("user_id", user.id);
      if (out.error) throw new HttpError("Pause failed.", 503);
      return privateJson({
        message:
          "All plans paused. Already-submitted orders remain visible for individual cancellation.",
      });
    }
    if (!/^[0-9a-f-]{36}$/.test(String(b.id)))
      throw new HttpError("A valid plan or run is required.");
    if (b.op === "toggle") {
      const out = await db
        .from("auryn_paper_plans")
        .update({
          enabled: b.enabled === true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", b.id)
        .eq("user_id", user.id);
      if (out.error) throw new HttpError("Plan update failed.", 503);
      return privateJson({
        message: b.enabled
          ? "Plan armed. It may execute once per calendar month when all checks pass."
          : "Plan paused.",
      });
    }
    if (b.op === "run") return privateJson(await executePaper(user.id, b.id));
    if (b.op === "reconcile" || b.op === "cancel")
      return privateJson(
        await reconcilePaper(user.id, b.id, b.op === "cancel"),
      );
    throw new HttpError("Unknown paper action.");
  } catch (e) {
    return failure(e);
  }
}
