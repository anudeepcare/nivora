import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { productHandle } from "@/lib/product-entities";
import { appMetric } from "@/lib/product-app-history";
import { readAppHistory } from "@/lib/product-app-history.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "App history is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    const params = new URL(request.url).searchParams,
      handle = productHandle(params.get("handle")),
      metric = appMetric(params.get("metric")),
      rawDays = params.get("days");
    if (
      !handle ||
      !metric ||
      !["30", "90"].includes(rawDays ?? "") ||
      ["handle", "metric", "days"].some((k) => params.getAll(k).length !== 1) ||
      [...params.keys()].some((k) => !["handle", "metric", "days"].includes(k))
    )
      throw new HttpError("Invalid app history request.", 400);
    await limit(`product-app-history:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "product-app-history");
    return privateJson(await readAppHistory(handle, metric, Number(rawDays)));
  } catch (e) {
    return failure(e);
  }
}
