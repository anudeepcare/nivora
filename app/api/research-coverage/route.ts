import { account, failure, limit, privateJson } from "@/lib/server";
import {
  sentisenseTrackedStocks,
  sentisenseKpiCoverage,
} from "@/lib/sentisense-api";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`research-coverage:${user.id}`, 6);
    const kpis = new URL(request.url).searchParams.get("kind") === "kpis";
    const result = kpis
      ? await sentisenseKpiCoverage()
      : await sentisenseTrackedStocks();
    const coverage = result.data as { tickers?: { ticker: string }[] } | null;
    return privateJson({
      source: result.source,
      status: result.status,
      retrievedAt: result.retrievedAt,
      entitlement: result.entitlement,
      tickers:
        result.status === "available"
          ? kpis
            ? (coverage?.tickers ?? []).map((row) => row.ticker)
            : Array.isArray(result.data)
              ? result.data
              : []
          : [],
    });
  } catch (error) {
    return failure(error);
  }
}
