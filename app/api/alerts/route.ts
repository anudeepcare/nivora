import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
import { checkAlerts } from "@/lib/monitor";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request);
    const r = await db
      .from("auryn_alert_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (r.error)
      throw new HttpError(
        "Alert history is unavailable. Apply the workspace migration.",
        503,
      );
    return privateJson({ events: r.data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request);
    limit(`alerts:${user.id}`, 2, 60000);
    const body = await request.json();
    if (body.op === "check") return privateJson(await checkAlerts(db, user.id));
    if (body.op === "read") {
      const r = await db
        .from("auryn_alert_events")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("id", String(body.id));
      if (r.error) throw new HttpError("Could not mark this alert read.", 503);
      return privateJson({ saved: true });
    }
    throw new HttpError("Unsupported alert action.");
  } catch (e) {
    return failure(e);
  }
}
