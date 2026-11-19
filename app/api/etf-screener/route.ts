import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { readBoundedMarketJson } from "@/lib/market-response";
import { etfScreenInput } from "@/lib/etf-screener";
import { runEtfScreen } from "@/lib/etf-screener.server";
export async function POST(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    requireFeature(access, "advanced");
    await limit(`etf-screener:${user.id}`, 6);
    let raw: unknown;
    try {
      raw = await readBoundedMarketJson(new Response(request.body), 2000);
    } catch {
      throw new HttpError("Screen request is invalid or too large.", 400);
    }
    const input = etfScreenInput(raw);
    if (!input)
      throw new HttpError(
        "Choose a supported ETF field and numeric threshold.",
        400,
      );
    await reserveAccess(user.id, access, "research", "etf-screener");
    return privateJson(await runEtfScreen(input));
  } catch (e) {
    return failure(e);
  }
}
