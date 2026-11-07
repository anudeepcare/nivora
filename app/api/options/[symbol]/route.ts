import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { loadOptionChain } from "@/lib/options-source";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`options:${user.id}`, 6);
    const { symbol } = await params;
    const ticker = symbol.toUpperCase().replace(/\.US$/, "");
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker))
      throw new HttpError(
        "Options are supported for eligible US-listed stocks and ETFs.",
      );
    const expiry = new URL(request.url).searchParams.get("expiry");
    return privateJson(await loadOptionChain(ticker, expiry));
  } catch (e) {
    return failure(e);
  }
}
