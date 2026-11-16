import { isSentiSenseMarket } from "./market-source-mode";
import { sentiSenseRequest } from "./sentisense-api";
import { normalizeSentiSenseGrow } from "./sentisense-grow";
import { HttpError } from "./server";
import { eodEnabled, eodCompanyData } from "./eodhd";
import { twelve } from "./providers";
import {
  growDatasets,
  normalizeGrow,
  type GrowDataset,
  type GrowData,
} from "./grow-data";
const cache = new Map<string, { expires: number; value: Promise<GrowData> }>();
export async function growData(
  symbol: string,
  dataset: GrowDataset,
): Promise<GrowData> {
  if (isSentiSenseMarket()) {
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
      throw new HttpError("Choose a supported stock or ETF.");
    if (dataset !== "profile" && dataset !== "earnings")
      throw new HttpError(
        `${dataset === "announcements" ? "Company press releases" : dataset === "splits" ? "Stock split history" : "Dividend history"} are not supplied by the current data connection.`,
        503,
      );
    const now = new Date(),
      asOf = now.toISOString(),
      from = new Date(now.getTime() - 365 * 86400000)
        .toISOString()
        .slice(0, 10),
      to = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
    const raw =
      dataset === "profile"
        ? await sentiSenseRequest(
            `stocks/${encodeURIComponent(symbol)}/profile`,
            {},
            3600,
          )
        : await sentiSenseRequest(
            "calendar/earnings",
            { ticker: symbol, from, to },
            300,
          );
    return normalizeSentiSenseGrow(symbol, dataset, raw, asOf, from, to);
  }
  if (eodEnabled()) {
    try {
      return await eodCompanyData(symbol, dataset);
    } catch (error) {
      if (!process.env.TWELVE_DATA_API_KEY) throw error;
    }
  }
  const key = dataset + ":" + symbol,
    old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value;
  const spec = growDatasets[dataset];
  const params: Record<string, string> = { symbol };
  if (dataset === "earnings") params.outputsize = "12";
  if (dataset === "announcements") params.outputsize = "10";
  if (dataset === "dividends" || dataset === "splits") params.range = "5y";
  const value = twelve(spec.endpoint, params, spec.credits)
    .then((data) =>
      normalizeGrow(symbol, dataset, data, new Date().toISOString()),
    )
    .catch((e) => {
      cache.delete(key);
      throw e;
    });
  cache.set(key, { expires: Date.now() + spec.ttl, value });
  if (cache.size > 250) cache.delete(cache.keys().next().value!);
  return value;
}
