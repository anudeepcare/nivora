import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { eodRequest } from "@/lib/eodhd";
import { congressDisclosures } from "@/lib/congress-disclosures";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`congress:${user.id}`, 3);
    const symbol = new URL(request.url).searchParams.get("symbol") ?? "";
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
      throw new HttpError("Choose a stock symbol.");
    const now = new Date().toISOString(),
      today = now.slice(0, 10),
      from = new Date(Date.parse(today) - 180 * 86400000)
        .toISOString()
        .slice(0, 10);
    const raw = await eodRequest(
      "congressional-trades",
      {
        symbol,
        disclosure_date_from: from,
        disclosure_date_to: today,
        transaction_date_to: today,
        "page[limit]": "100",
      },
      21600000,
    );
    return privateJson({
      rows: congressDisclosures(raw, symbol, today),
      asOf: now,
      windowDays: 180,
      truncated: Number(raw?.meta?.total) > 100,
    });
  } catch (error) {
    return failure(error);
  }
}
