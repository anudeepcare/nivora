import { account, failure, limit, privateJson } from "@/lib/server";
import { sentisenseTrackedStocks } from "@/lib/sentisense-api";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`research-coverage:${user.id}`, 6);
    const result = await sentisenseTrackedStocks();
    return privateJson({
      source: result.source,
      status: result.status,
      retrievedAt: result.retrievedAt,
      entitlement: result.entitlement,
      tickers:
        result.status === "available" && Array.isArray(result.data)
          ? result.data
          : [],
    });
  } catch (error) {
    return failure(error);
  }
}
