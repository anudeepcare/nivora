import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
import { cleanDocument } from "@/lib/documents";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request);
    const kind = new URL(request.url).searchParams.get("kind");
    let query = db
      .from("auryn_documents")
      .select("kind,key,body,created_at,updated_at")
      .eq("user_id", user.id);
    if (kind) query = query.eq("kind", kind);
    const r = await query.order("updated_at", { ascending: false }).limit(200);
    if (r.error)
      throw new HttpError(
        "Saved research is unavailable. Apply the research workspace migration.",
        503,
      );
    return privateJson({ documents: r.data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request);
    limit(`documents:${user.id}`, 20);
    const v = await request.json(),
      kind = String(v?.kind),
      key = String(v?.key ?? "");
    if (
      !["note", "comparison", "view", "alert"].includes(kind) ||
      !key ||
      key.length > 80
    )
      throw new HttpError("Check the saved research type and key.");
    if (v.op === "delete") {
      const r = await db
        .from("auryn_documents")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", kind)
        .eq("key", key);
      if (r.error) throw new HttpError("Could not remove the record.", 503);
    } else {
      let body;
      try {
        body = cleanDocument(kind, v.body);
      } catch (e) {
        throw new HttpError(
          e instanceof Error ? e.message : "Check the record.",
        );
      }
      const r = await db.from("auryn_documents").upsert(
        {
          user_id: user.id,
          kind,
          key,
          body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,kind,key" },
      );
      if (r.error) throw new HttpError("Could not save the record.", 503);
    }
    return privateJson({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
