import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { sentiSenseTicker } from "@/lib/sentisense-api";
import { readMetricHistory } from "@/lib/entity-metric-history.server";
import { entityMetric } from "@/lib/entity-metric-history";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError("Sentiment is not enabled in this deployment.", 403);
    requireFeature(access, "news");
    requireFeature(access, "advanced");
    const symbol = sentiSenseTicker((await params).symbol);
    const query = new URL(request.url).searchParams;
    const metric = entityMetric(query.get("metric")),
      days = Number(query.get("days"));
    if (
      !symbol ||
      !metric ||
      ![30, 90].includes(days) ||
      query.getAll("metric").length !== 1 ||
      query.getAll("days").length !== 1 ||
      [...query.keys()].some((k) => !["metric", "days"].includes(k))
    )
      throw new HttpError(
        "Choose one supported stock and a supported 30 or 90 day metric.",
        400,
      );
    await limit(`entity-metric-history:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(await readMetricHistory(symbol, metric, days));
  } catch (e) {
    return failure(e);
  }
}
