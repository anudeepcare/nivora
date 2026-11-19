import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { politicianQuery } from "@/lib/politician-members";
import { readPoliticians } from "@/lib/politician-members.server";
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
      q = politicianQuery(new URL(request.url).searchParams);
    } catch {
      throw new HttpError("Invalid member query.", 400);
    }
    await limit(`politician-members:${user.id}`, 6);
    if (q.slug)
      await reserveAccess(
        user.id,
        access,
        "research",
        `politician-${q.bioguideId}`,
      );
    return privateJson(await readPoliticians(q));
  } catch (e) {
    return failure(e);
  }
}
