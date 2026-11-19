import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { loadOptionChain } from "@/lib/options-source";
export const maxDuration = 60;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError("Options access is unavailable.", 403);
    requireFeature(access, "options");
    await limit(`options:${user.id}`, 6);
    const { symbol } = await params;
    const ticker = symbol.toUpperCase().replace(/\.US$/, "");
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker))
      throw new HttpError(
        "Options are supported for eligible US-listed stocks and ETFs.",
      );
    const expiry = new URL(request.url).searchParams.get("expiry");
    await reserveAccess(user.id, access, "research", ticker);
    return privateJson(await loadOptionChain(ticker, expiry, request.signal));
  } catch (e) {
    return failure(e);
  }
}
