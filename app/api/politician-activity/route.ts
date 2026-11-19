import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { activityQuery } from "@/lib/politician-activity";
import { readActivity } from "@/lib/politician-activity.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    let q;
    try {
      q = activityQuery(new URL(request.url).searchParams);
    } catch {
      throw new HttpError("Invalid activity query.", 400);
    }
    await limit(`politician-activity:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "politician-activity");
    return privateJson(await readActivity(q));
  } catch (e) {
    return failure(e);
  }
}
