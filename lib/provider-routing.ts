export type MarketSource = "twelve" | "eodhd";
export function preferredMarketSources(
  dataset: "quote" | "intraday" | "daily",
  configured: { twelve: boolean; eodhd: boolean },
): MarketSource[] {
  const order: MarketSource[] =
    dataset === "daily" ? ["eodhd", "twelve"] : ["twelve", "eodhd"];
  return order.filter((p) => configured[p]);
}
/** Select one complete result. Never splice providers' bars or financial periods. */
export async function readPreferred<T>(
  sources: MarketSource[],
  read: (source: MarketSource) => Promise<T>,
): Promise<{ value: T; provider: MarketSource; fallback: boolean }> {
  let failure: unknown = new Error("No market-data provider is configured.");
  for (let i = 0; i < sources.length; i++) {
    try {
      return {
        value: await read(sources[i]),
        provider: sources[i],
        fallback: i > 0,
      };
    } catch (e) {
      failure = e;
    }
  }
  throw failure;
}
