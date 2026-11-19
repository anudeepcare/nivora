import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readMarketInsider } from "@/lib/market-insider.server";
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
    if (
      [...params.keys()].some((k) => k !== "days") ||
      params.getAll("days").length > 1 ||
      !["30", "90"].includes(params.get("days") ?? "90")
    )
      throw new HttpError("Choose a 30 or 90 day lookback.", 400);
    await limit(`market-insider:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "market-insider");
    return privateJson(
      await readMarketInsider(Number(params.get("days") ?? 90)),
    );
  } catch (error) {
    return failure(error);
  }
}
