import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { sentiSenseTicker } from "@/lib/sentisense-api";
import {
  breakdownMetric,
  breakdownDimension,
} from "@/lib/entity-metric-breakdown";
import { readMetricBreakdown } from "@/lib/entity-metric-breakdown.server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Metric breakdown is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "news");
    requireFeature(access, "advanced");
    const q = new URL(request.url).searchParams,
      symbol = sentiSenseTicker((await params).symbol),
      metric = q.get("metric"),
      dimension = q.get("dimension"),
      mode = q.get("mode"),
      days = Number(q.get("days"));
    if (
      !symbol ||
      !breakdownMetric(metric) ||
      !breakdownDimension(dimension) ||
      !["distribution", "slices"].includes(mode ?? "") ||
      ![30, 90].includes(days) ||
      ["metric", "dimension", "mode", "days"].some(
        (k) => q.getAll(k).length !== 1,
      ) ||
      [...q.keys()].some(
        (k) => !["metric", "dimension", "mode", "days"].includes(k),
      )
    )
      throw new HttpError(
        "Choose a supported metric, dimension and window.",
        400,
      );
    await limit(`entity-metric-breakdown:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(
      await readMetricBreakdown(
        symbol,
        metric,
        dimension,
        mode as "distribution" | "slices",
        days,
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
