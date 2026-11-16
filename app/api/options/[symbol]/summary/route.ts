import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { sentiSenseOptionsSummary } from "@/lib/sentisense-supporting";
import { isSentiSenseMarket } from "@/lib/market-source-mode";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`options-summary:${user.id}`, 6);
    if (!isSentiSenseMarket() || process.env.AURYN_OPTIONS_ENABLED !== "true")
      throw new HttpError("Options analytics are not enabled.", 503);
    return privateJson(await sentiSenseOptionsSummary((await params).symbol));
  } catch (error) {
    return failure(error);
  }
}
