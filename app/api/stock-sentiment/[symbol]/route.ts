import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { sentiSenseTicker } from "@/lib/sentisense-api";
import { readStockSentiment } from "@/lib/stock-sentiment.server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError("Sentiment is not enabled in this deployment.", 403);
    requireFeature(access, "news");
    requireFeature(access, "advanced");
    const symbol = sentiSenseTicker((await params).symbol);
    if (!symbol || new URL(request.url).search)
      throw new HttpError(
        "Choose one supported stock without query parameters.",
        400,
      );
    await limit(`stock-sentiment:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(await readStockSentiment(symbol));
  } catch (e) {
    return failure(e);
  }
}
