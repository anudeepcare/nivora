import { account, failure, privateJson, limit, HttpError } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { growDatasets, type GrowDataset } from "@/lib/grow-data";
import { growData } from "@/lib/grow-provider";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`company-data:${user.id}`, 12);
    const p = new URL(request.url).searchParams,
      symbol = symbolInput(p.get("symbol") || ""),
      dataset = p.get("dataset") || "profile";
    if (symbol.includes("/") || !Object.hasOwn(growDatasets, dataset))
      throw new HttpError("Select a supported company dataset.");
    return privateJson(await growData(symbol, dataset as GrowDataset));
  } catch (e) {
    return failure(e);
  }
}
