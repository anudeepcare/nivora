import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { alpacaOptions } from "@/lib/alpaca-options";
import { eodRequest } from "@/lib/eodhd";
import { normalizeOptions } from "@/lib/options-analysis";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`options:${user.id}`, 6);
    const { symbol } = await params;
    const ticker = symbol.toUpperCase().replace(/\.US$/, "");
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker))
      throw new HttpError(
        "Options are supported for eligible US-listed stocks and ETFs.",
      );
    if (process.env.AURYN_OPTIONS_ENABLED !== "true")
      return privateJson({
        status: "unavailable",
        message:
          "Options data is not enabled. The owner can enable it after confirming dataset access and display permissions.",
        contracts: [],
        complete: false,
      });
    const url = new URL(request.url),
      expiry = url.searchParams.get("expiry");
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry))
      throw new HttpError("Choose a valid expiry.");
    if (process.env.AURYN_OPTIONS_PROVIDER !== "eodhd") {
      try {
        return privateJson(await alpacaOptions(ticker, expiry));
      } catch (error) {
        throw new HttpError(
          error instanceof Error ? error.message : "Options unavailable.",
          503,
        );
      }
    }
    const rows: unknown[] = [];
    let complete = false,
      total: number | null = null;
    // Bound dataset cost; never follow arbitrary provider links or fetch without an authenticated user.
    for (let page = 0; page < 4; page++) {
      const data = await eodRequest(
        "mp/unicornbay/options/contracts",
        {
          "filter[underlying_symbol]": ticker,
          "filter[exp_date_from]": new Date().toISOString().slice(0, 10),
          ...(expiry
            ? { "filter[exp_date_to]": expiry, "filter[exp_date_from]": expiry }
            : {}),
          "page[limit]": "1000",
          "page[offset]": String(page * 1000),
        },
        900000,
      );
      if (!Array.isArray(data.data))
        throw new HttpError(
          "The options source returned an unsupported response.",
          503,
        );
      rows.push(...data.data);
      total = Number.isFinite(Number(data.meta?.total))
        ? Number(data.meta.total)
        : null;
      complete =
        total !== null
          ? rows.length >= total
          : !data.links?.next && data.data.length < 1000;
      if (complete) break;
    }
    return privateJson({
      status: "available",
      contracts: normalizeOptions(rows),
      complete,
      total,
      fetchedAt: new Date().toISOString(),
      frequency: "End-of-day snapshot; not a live executable quote.",
    });
  } catch (e) {
    return failure(e);
  }
}
