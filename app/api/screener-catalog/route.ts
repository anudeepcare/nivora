import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readCatalog } from "@/lib/screener-catalog.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    requireFeature(access, "advanced");
    const p = new URL(request.url).searchParams,
      kind = p.get("kind");
    if (
      [...p.keys()].some((k) => k !== "kind") ||
      p.getAll("kind").length !== 1 ||
      (kind !== "fields" && kind !== "screens")
    )
      throw new HttpError("Choose fields or screens.", 400);
    await limit(`screener-catalog:${user.id}`, 6);
    await reserveAccess(
      user.id,
      access,
      "research",
      `screener-catalog:${kind}`,
    );
    return privateJson(await readCatalog(kind));
  } catch (e) {
    return failure(e);
  }
}
