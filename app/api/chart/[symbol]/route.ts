import { requestAccess } from "@/lib/access-server";
import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  marketHistory,
  researchSymbol,
  type ChartRange,
} from "@/lib/providers";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`chart:${user.id}`);
    const range = new URL(request.url).searchParams.get("range") || "1Y";
    if (!["1D", "1W", "1M", "6M", "1Y", "5Y"].includes(range))
      throw new HttpError("Unsupported chart range.");
    const access = await requestAccess(request, user.id);
    const result = await marketHistory(
      researchSymbol((await params).symbol),
      range as ChartRange,
    );
    const unrestricted =
      !access.enabled ||
      (access.owner && !access.preview) ||
      access.features.longHistory;
    return privateJson({
      ...result,
      candles: unrestricted
        ? result.candles
        : result.candles.slice(access.features.technicals ? -756 : -252),
      range,
    });
  } catch (e) {
    return failure(e);
  }
}
