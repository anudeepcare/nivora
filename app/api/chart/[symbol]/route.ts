import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { marketHistory, type ChartRange } from "@/lib/providers";
import { symbolInput } from "@/lib/format";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request);
    limit(`chart:${user.id}`);
    const range = new URL(request.url).searchParams.get("range") || "1Y";
    if (!["1D", "1W", "1M", "6M", "1Y", "5Y"].includes(range))
      throw new HttpError("Unsupported chart range.");
    return privateJson({
      ...(await marketHistory(
        symbolInput((await params).symbol),
        range as ChartRange,
      )),
      range,
    });
  } catch (e) {
    return failure(e);
  }
}
