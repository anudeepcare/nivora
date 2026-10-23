import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { accessDb, exactOwner } from "@/lib/access-server";
import { cleanAccessConfig } from "@/lib/access-policy";
async function owner(request: Request) {
  const { user } = await account(request);
  if (!exactOwner(user.id))
    throw new HttpError("Workspace owner access required.", 403);
  return user;
}
export async function GET(request: Request) {
  try {
    await owner(request);
    const db = accessDb();
    const [c, g, a, u] = await Promise.all([
      db.from("auryn_access_config").select("body").eq("id", true).single(),
      db
        .from("auryn_beta_grants")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100),
      db
        .from("auryn_access_audit")
        .select("actor,action,target,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("auryn_access_usage")
        .select("bucket", { count: "exact", head: true })
        .eq("month", new Date().toISOString().slice(0, 7) + "-01"),
    ]);
    if (c.error || g.error || a.error || u.error)
      throw new HttpError(
        "Apply the beta-access migration before opening owner controls.",
        503,
      );
    return privateJson({
      config: cleanAccessConfig(c.data.body),
      grants: g.data,
      audit: a.data,
      usage: u.count ?? 0,
      billingReady: false,
      enabled: process.env.AURYN_ACCESS_ENABLED === "true",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await owner(request);
    limit(`owner-access:${user.id}`, 12);
    const db = accessDb(),
      b = await request.json();
    let body: unknown,
      target: string | null = null;
    if (b.action === "settings")
      body = {
        ...cleanAccessConfig(b.config),
        __enabled: process.env.AURYN_ACCESS_ENABLED === "true",
      };
    else if (b.action === "grant") {
      if (
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !/^\S+@\S+\.\S+$/.test(b.email)
      )
        throw new HttpError("Enter the exact email of an existing account.");
      const end = Date.parse(b.expiresAt);
      if (
        !Number.isFinite(end) ||
        end <= Date.now() ||
        end > Date.now() + 366 * 86400000
      )
        throw new HttpError("Choose an expiry within the next year.");
      const r = await db.rpc("auryn_access_find_user", {
        p_email: b.email.trim(),
      });
      if (r.error) throw new HttpError("Account lookup unavailable.", 503);
      if (!r.data?.[0])
        throw new HttpError("That person must create an AURYN account first.");
      target = r.data[0].id;
      if (target === user.id)
        throw new HttpError("Your owner account already has full access.");
      body = {
        email: r.data[0].email,
        expiresAt: new Date(end).toISOString(),
        cohort: String(b.cohort || "friends").slice(0, 40),
        reason: String(b.reason || "").slice(0, 240),
      };
    } else if (b.action === "revoke") {
      if (
        typeof b.userId !== "string" ||
        !/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(b.userId)
      )
        throw new HttpError("Select a valid account.");
      target = b.userId;
      body = {};
    } else if (b.action === "revoke-cohort") {
      if (
        typeof b.cohort !== "string" ||
        !b.cohort.trim() ||
        b.cohort.length > 40
      )
        throw new HttpError("Select a beta group.");
      body = { cohort: b.cohort };
    } else throw new HttpError("Unknown owner action.");
    const r = await db.rpc("auryn_access_manage", {
      p_actor: user.id,
      p_action: b.action,
      p_target: target,
      p_body: body,
    });
    if (r.error)
      throw new HttpError(
        "Access could not be updated. No payment subscription was changed.",
        503,
      );
    return privateJson({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
