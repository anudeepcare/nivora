import { account, failure, privateJson, HttpError, limit } from "@/lib/server";
import { loadOptionsFlow } from "@/lib/options-flow-source";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`options-flow:${user.id}`, 6);
    const { symbol } = await params;
    const ticker = symbol.toUpperCase().replace(/\.US$/, "");
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker))
      throw new HttpError("Choose an eligible US-listed stock or ETF.");
    return privateJson(
      await loadOptionsFlow(
        ticker,
        new URL(request.url).searchParams.get("expiry"),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
