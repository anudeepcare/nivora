import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { earningsAnalysisQuery } from "@/lib/earnings-analysis";
import { readEarningsAnalysis } from "@/lib/earnings-analysis.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true }),
      access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    requireFeature(access, "analysts");
    requireFeature(access, "news");
    let query;
    try {
      query = earningsAnalysisQuery(new URL(request.url).searchParams);
    } catch {
      throw new HttpError("Choose a supported earnings view.", 400);
    }
    await limit(`earnings-analysis:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", `earnings-${query.view}`);
    return privateJson(await readEarningsAnalysis(query));
  } catch (error) {
    return failure(error);
  }
}
