import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readBoundedMarketJson } from "@/lib/market-response";
import { searchRequest } from "@/lib/publication-search";
import { readPublicationSearch } from "@/lib/publication-search.server";
export async function POST(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Publication search is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "news");
    let body: unknown;
    try {
      body = await readBoundedMarketJson(new Response(request.body), 2048);
    } catch {
      throw new HttpError("Enter a short public-topic search.", 400);
    }
    const input = searchRequest(body);
    if (!input)
      throw new HttpError(
        "Choose Stories or Source links, 7 or 14 days, and a query of 2–240 characters.",
        400,
      );
    await limit(`publication-search:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "publication-search");
    return privateJson(await readPublicationSearch(input));
  } catch (e) {
    return failure(e);
  }
}
