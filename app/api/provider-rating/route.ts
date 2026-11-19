import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { ratingSymbol } from "@/lib/provider-rating";
import { readProviderRating } from "@/lib/provider-rating.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Rating evidence is not enabled in this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    const params = new URL(request.url).searchParams;
    const symbol = ratingSymbol(params.get("symbol"));
    if (
      !symbol ||
      params.getAll("symbol").length !== 1 ||
      [...params.keys()].some((k) => k !== "symbol")
    )
      throw new HttpError("Invalid Rating request.", 400);
    await limit(`provider-rating:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(await readProviderRating(symbol));
  } catch (e) {
    return failure(e);
  }
}
