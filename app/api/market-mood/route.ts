import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { moodKinds, type MoodKind } from "@/lib/market-mood";
import { readMarketMood } from "@/lib/market-mood.server";
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
    const kind = params.get("kind");
    if (
      [...params.keys()].some((k) => k !== "kind") ||
      params.getAll("kind").length !== 1 ||
      !moodKinds.includes(kind as MoodKind)
    )
      throw new HttpError("Choose one supported market view.", 400);
    await limit(`market-mood:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", `market-mood:${kind}`);
    return privateJson(await readMarketMood(kind as MoodKind));
  } catch (error) {
    return failure(error);
  }
}
