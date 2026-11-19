import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { trackerIds } from "@/lib/market-trackers";
import { readMarketTracker } from "@/lib/market-trackers.server";
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
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (
      [...params.keys()].some((k) => k !== "id") ||
      params.getAll("id").length > 1 ||
      (id !== null && !trackerIds.includes(id))
    )
      throw new HttpError("Choose a supported tracker.", 400);
    await limit(`market-trackers:${user.id}`, 6);
    await reserveAccess(
      user.id,
      access,
      "research",
      `tracker:${id ?? "catalog"}`,
    );
    return privateJson(await readMarketTracker(id));
  } catch (error) {
    return failure(error);
  }
}
