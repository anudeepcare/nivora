import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { eodRequest } from "@/lib/eodhd";
import {
  marketCapHistory,
  type MarketCapSeries,
} from "@/lib/market-cap-history";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`market-cap:${user.id}`, 6);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.financials
    )
      throw new HttpError(
        "Financial history is not included in your access.",
        403,
      );
    const raw = (await params).symbol.toUpperCase();
    const symbol = raw.endsWith(".US") ? raw.slice(0, -3) : raw;
    if (
      !/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z])?$/.test(symbol) ||
      /\.(?:L|F|V|T)$/.test(symbol)
    )
      throw new HttpError(
        "Market capitalization history supports US-listed equities only.",
        400,
      );
    await reserveAccess(user.id, access, "research", symbol);
    const now = new Date(),
      to = now.toISOString().slice(0, 10),
      from = new Date(now.getTime() - 366 * 86400000)
        .toISOString()
        .slice(0, 10);
    const data = await eodRequest(
      `historical-market-cap/${encodeURIComponent(symbol.replace(/\.([A-Z])$/, "-$1"))}.US`,
      { from, to },
      86400000,
    );
    const rows = marketCapHistory(data, from, to);
    if (rows === null)
      throw new HttpError(
        "Market capitalization history returned an invalid response.",
        502,
      );
    const result: MarketCapSeries = {
      symbol,
      from,
      to,
      rows,
      currency: "USD",
      frequency: "weekly",
      source: "EODHD",
      retrievedAt: now.toISOString(),
    };
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
