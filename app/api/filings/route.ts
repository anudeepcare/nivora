import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { eodEnabled, eodFilings } from "@/lib/eodhd";
import { fundamentals } from "@/lib/providers";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    limit(`filings:${user.id}`, 10);
    const symbol = symbolInput(
      new URL(request.url).searchParams.get("symbol") ?? "",
    );
    if (symbol.includes("/"))
      throw new HttpError("Company filings do not apply to crypto.");
    const result = eodEnabled()
      ? await eodFilings(symbol)
      : await fundamentals(symbol);
    return privateJson({ filings: result.filings, issues: result.issues });
  } catch (e) {
    return failure(e);
  }
}
