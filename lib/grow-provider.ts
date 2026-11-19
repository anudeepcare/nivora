import { eodCompanyData } from "./eodhd";
import { type GrowDataset, type GrowData } from "./grow-data";
/** EODHD errors remain visible; no silent fallback to an unrequested vendor. */
export async function growData(
  symbol: string,
  dataset: GrowDataset,
): Promise<GrowData> {
  return eodCompanyData(symbol, dataset);
}
