import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { sentiSenseTicker } from "@/lib/sentisense-api";
import { publicationSource } from "@/lib/publication-feeds";
import { readPublications } from "@/lib/publication-feeds.server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Publication feeds are not enabled in this deployment.",
        403,
      );
    requireFeature(access, "news");
    const query = new URL(request.url).searchParams;
    const source = publicationSource(query.get("source"));
    const symbol = sentiSenseTicker((await params).symbol);
    if (
      !source ||
      !symbol ||
      query.getAll("source").length !== 1 ||
      [...query.keys()].some((k) => k !== "source")
    )
      throw new HttpError(
        "Choose a supported stock and publication source.",
        400,
      );
    await limit(`publications:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(await readPublications(symbol, source));
  } catch (e) {
    return failure(e);
  }
}
