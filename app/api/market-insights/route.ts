import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readMarketInsights } from "@/lib/market-insights.server";
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
      (kind !== "market" && kind !== "latest")
    )
      throw new HttpError("Choose market or latest.", 400);
    await limit(`market-insights:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", `market-insights:${kind}`);
    return privateJson(await readMarketInsights(kind));
  } catch (e) {
    return failure(e);
  }
}
