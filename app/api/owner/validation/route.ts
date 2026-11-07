import { randomUUID } from "node:crypto";
import { account, limit, privateJson, failure, HttpError } from "@/lib/server";
import { exactOwner } from "@/lib/access-server";
import { cleanValidationSession } from "@/lib/user-validation";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request, { market: false });
    if (!exactOwner(user.id))
      throw new HttpError("Owner access required.", 403);
    const r = await db
      .from("auryn_documents")
      .select("key,body,created_at")
      .eq("user_id", user.id)
      .eq("kind", "view")
      .like("key", "internal:ux-session:%")
      .order("created_at", { ascending: false })
      .limit(200);
    if (r.error) throw new HttpError("Session records unavailable.", 503);
    return privateJson({
      sessions: r.data,
      scope:
        "Latest 200 owner-recorded observations; not independently verified users.",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request, { market: false });
    if (!exactOwner(user.id))
      throw new HttpError("Owner access required.", 403);
    await limit(`validation:${user.id}`, 20);
    let body;
    try {
      body = cleanValidationSession(
        await request.json(),
        new Date().toISOString(),
      );
    } catch (e) {
      throw new HttpError(
        e instanceof Error ? e.message : "Check the session.",
      );
    }
    const r = await db.from("auryn_documents").insert({
      user_id: user.id,
      kind: "view",
      key: `internal:ux-session:${randomUUID()}`,
      body,
    });
    if (r.error) throw new HttpError("Session could not be saved.", 503);
    return privateJson({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
