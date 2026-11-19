import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { insightRequest } from "@/lib/stock-insights";
import { readStockInsights } from "@/lib/stock-insights.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError("Insights are not enabled in this deployment.", 403);
    requireFeature(access, "advanced");
    const params = new URL(request.url).searchParams;
    const query = insightRequest(
      params.get("symbol"),
      params.get("mode") ?? "current",
    );
    if (
      !query ||
      [...params.keys()].some((k) => !["symbol", "mode"].includes(k)) ||
      ["symbol", "mode"].some((k) => params.getAll(k).length > 1)
    )
      throw new HttpError("Invalid Insights request.", 400);
    await limit(`stock-insights:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", query.symbol);
    return privateJson(await readStockInsights(query.symbol, query.mode));
  } catch (error) {
    return failure(error);
  }
}
