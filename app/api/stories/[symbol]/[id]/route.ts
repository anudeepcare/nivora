import { publicIntelligence } from "@/lib/intelligence-dto";
import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { researchSymbol } from "@/lib/providers";
import { sentisenseStoryRead } from "@/lib/sentisense-api";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string; id: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`stories:${user.id}`, 12);
    const raw = await params,
      symbol = researchSymbol(raw.symbol);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(raw.id))
      throw new HttpError("Choose a valid story.", 400);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.news
    )
      throw new HttpError("Company news is not included in your access.", 403);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(
      publicIntelligence(await sentisenseStoryRead(symbol, raw.id)),
    );
  } catch (error) {
    return failure(error);
  }
}
