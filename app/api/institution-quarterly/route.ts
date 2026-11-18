import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { quarterlyQuery } from "@/lib/institution-quarterly";
import { readQuarterly } from "@/lib/institution-quarterly.server";
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
      q = quarterlyQuery(new URL(request.url).searchParams);
    } catch {
      throw new HttpError("Invalid quarterly request.", 400);
    }
    await limit(`institution-quarterly:${user.id}`, 6);
    await reserveAccess(
      user.id,
      access,
      "research",
      `institution-quarterly-${q.view}`,
    );
    return privateJson(await readQuarterly(q));
  } catch (e) {
    return failure(e);
  }
}
