import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { etfAggregateRequest } from "@/lib/etf-aggregate-evidence";
import { readEtfAggregate } from "@/lib/etf-aggregate-evidence.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "ETF evidence is not enabled in this deployment.",
        403,
      );
    const params = new URL(request.url).searchParams,
      query = etfAggregateRequest(params.get("symbol"), params.get("mode"));
    if (
      !query ||
      ["symbol", "mode"].some((k) => params.getAll(k).length !== 1) ||
      [...params.keys()].some((k) => !["symbol", "mode"].includes(k))
    )
      throw new HttpError("Invalid ETF evidence request.", 400);
    requireFeature(access, "advanced");
    await limit(`etf-aggregate-evidence:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", query.symbol);
    return privateJson(await readEtfAggregate(query.symbol, query.mode));
  } catch (e) {
    return failure(e);
  }
}
