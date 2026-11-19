import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { analystActivityQuery } from "@/lib/analyst-market-activity";
import { readAnalystActivity } from "@/lib/analyst-market-activity.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "analysts");
    let q;
    try {
      q = analystActivityQuery(new URL(request.url).searchParams);
    } catch {
      throw new HttpError("Invalid analyst activity request.", 400);
    }
    await limit(`analyst-market-activity:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "analyst-market-activity");
    return privateJson(await readAnalystActivity(q));
  } catch (e) {
    return failure(e);
  }
}
