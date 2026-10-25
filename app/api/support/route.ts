import { createHash } from "node:crypto";
import { accessDb, exactOwner } from "@/lib/access-server";
import { account, failure, HttpError, privateJson } from "@/lib/server";
import { supportInput } from "@/lib/support-input";
import { deliverSupport, retrySupport } from "@/lib/support-delivery";
export const maxDuration = 60;
async function owner(request: Request) {
  const { user } = await account(request);
  if (!exactOwner(user.id)) throw new HttpError("Owner access required.", 403);
}
export async function POST(request: Request) {
  try {
    const url = new URL(request.url),
      origin = request.headers.get("origin");
    if (!origin || origin !== url.origin)
      throw new HttpError("Open the contact form on this site.", 403);
    if (Number(request.headers.get("content-length") ?? 0) > 20000)
      throw new HttpError("Message too large.", 413);
    const raw = await request.text();
    if (raw.length > 20000) throw new HttpError("Message too large.", 413);
    let body;
    try {
      body = supportInput(JSON.parse(raw));
    } catch (e) {
      throw new HttpError(
        e instanceof Error ? e.message : "Check the form.",
        400,
      );
    }
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret)
      throw new HttpError(
        "Contact service is not configured yet. Please try again later.",
        503,
      );
    // Vercel supplies the trusted ingress address; do not retain the raw IP.
    const address = process.env.VERCEL
      ? (request.headers.get("x-vercel-forwarded-for") ?? "unknown")
      : "local";
    const sender = createHash("sha256")
      .update(secret + address.split(",")[0])
      .digest("hex");
    const hash = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");
    const saved = await accessDb().rpc("auryn_submit_support", {
      p_body: body,
      p_sender: sender,
      p_hash: hash,
    });
    if (saved.error) {
      if (saved.error.message.includes("limit reached"))
        throw new HttpError("Please wait before sending another message.", 429);
      throw new HttpError(
        "Your message could not be saved. Please try again.",
        503,
      );
    }
    const delivery = await deliverSupport(body.id).catch(() => ({
      notified: false,
      receipt: false,
    }));
    return privateJson({
      saved: true,
      reference: body.id,
      receiptSent: delivery.receipt,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(request: Request) {
  try {
    await owner(request);
    const r = await accessDb()
      .from("auryn_support_requests")
      .select(
        "id,email,category,message,page,status,created_at,owner_notified_at,receipt_sent_at,attempts",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (r.error)
      throw new HttpError(
        "Support inbox unavailable. Apply the support migration.",
        503,
      );
    return privateJson({ requests: r.data });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    await owner(request);
    const b = await request.json();
    if (b.action === "retry")
      return privateJson({ results: await retrySupport(true) });
    if (
      !["new", "in_progress", "resolved"].includes(b.status) ||
      typeof b.id !== "string"
    )
      throw new HttpError("Choose a valid status.");
    const r = await accessDb()
      .from("auryn_support_requests")
      .update({ status: b.status })
      .eq("id", b.id)
      .select("id")
      .single();
    if (r.error) throw new HttpError("Status could not be saved.", 503);
    return privateJson({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
