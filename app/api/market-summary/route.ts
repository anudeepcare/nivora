import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readMarketSummary } from "@/lib/market-summary.server";
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
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].length)
      throw new HttpError("Market summary takes no parameters.", 400);
    await limit(`market-summary:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "market-summary");
    return privateJson(await readMarketSummary());
  } catch (error) {
    return failure(error);
  }
}
