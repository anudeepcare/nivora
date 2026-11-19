import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { requestAccess, requireFeature } from "@/lib/access-server";
import { eodRequest } from "@/lib/eodhd";
import { eodTicker } from "@/lib/eodhd-normalize";
import { providerSymbol } from "@/lib/provider-symbol";
import {
  normalizeDividendDates,
  normalizeEconomicEvents,
  normalizeTreasuryCurve,
} from "@/lib/eod-context";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "news");
    await limit(`market-context:${user.id}`, 12);
    const params = new URL(request.url).searchParams,
      kind = params.get("kind");
    if (!["dividends", "economy", "treasury"].includes(kind ?? ""))
      throw new HttpError("Choose a supported context dataset.", 400);
    const now = new Date(),
      from = now.toISOString().slice(0, 10),
      to = new Date(now.getTime() + (kind === "economy" ? 7 : 30) * 86400000)
        .toISOString()
        .slice(0, 10);
    let result;
    if (kind === "dividends") {
      const symbol = providerSymbol(params.get("symbol"));
      if (symbol.includes("/"))
        throw new HttpError("Dividend dates require a supported equity.", 422);
      const ticker = eodTicker(symbol);
      const raw = await eodRequest(
        "calendar/dividends",
        {
          "filter[symbol]": ticker,
          "filter[date_from]": from,
          "filter[date_to]": to,
          "page[limit]": "100",
          "page[offset]": "0",
        },
        21600000,
      );
      result = normalizeDividendDates(raw, ticker, from, to);
    } else if (kind === "economy") {
      const raw = await eodRequest(
        "economic-events",
        { country: "US", from, to, limit: "100", offset: "0" },
        1800000,
      );
      result = normalizeEconomicEvents(raw, from, to);
    } else {
      const raw = await eodRequest(
        "ust/yield-rates",
        { "filter[year]": String(now.getUTCFullYear()) },
        21600000,
      );
      result = normalizeTreasuryCurve(raw, from);
    }
    return privateJson({
      ...result,
      from,
      to,
      checkedAt: new Date().toISOString(),
      cacheMaxAgeSeconds: kind === "economy" ? 1800 : 21600,
      source: "EODHD",
    });
  } catch (e) {
    return failure(e);
  }
}
