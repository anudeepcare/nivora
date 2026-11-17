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
