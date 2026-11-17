import { account, limit, failure, privateJson, HttpError } from "@/lib/server";
import { requestAccess, requireFeature } from "@/lib/access-server";
import { checkSavedTheses } from "@/lib/thesis-monitor";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError("Market data is not enabled.", 403);
    requireFeature(access, "financials");
    await limit(`thesis:${user.id}`, 6);
    const body = await request.json();
    const symbol =
      typeof body.symbol === "string" ? body.symbol.toUpperCase() : undefined;
    if (symbol && !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
      throw new HttpError("Choose a stock symbol.");
    return privateJson(await checkSavedTheses(db, user.id, symbol));
  } catch (e) {
    return failure(e);
  }
}
