import { account, failure, privateJson } from "@/lib/server";
import { getAccess, accessDb } from "@/lib/access-server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    const access = await getAccess(
      user.id,
      request.headers.get("x-auryn-preview-plan"),
    );
    let used = 0;
    if (access.enabled) {
      const month = new Date().toISOString().slice(0, 7) + "-01";
      const r = await accessDb()
        .from("auryn_access_usage")
        .select("item", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("bucket", "research");
      used = r.error ? -1 : (r.count ?? 0);
    }
    return privateJson({ ...access, researchUsed: used });
  } catch (e) {
    return failure(e);
  }
}
