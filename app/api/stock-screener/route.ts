import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { screenInput } from "@/lib/stock-screener";
import { runStockScreen } from "@/lib/stock-screener.server";
export async function POST(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    await limit(`stock-screener:${user.id}`, 6);
    const text = await request.text();
    if (text.length > 2000)
      throw new HttpError("Screen request is too large.", 400);
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new HttpError("Invalid screen request.", 400);
    }
    const input = screenInput(raw);
    if (!input)
      throw new HttpError("Choose a supported screen and numeric value.", 400);
    if (input.field.startsWith("ANALYST_")) requireFeature(access, "analysts");
    if (["RETURN_1Y", "VOLATILITY_30D"].includes(input.field))
      requireFeature(access, "technicals");
    await reserveAccess(user.id, access, "research", "stock-screener");
    const result = await runStockScreen(input);
    return privateJson({
      ...result,
      withheld: [
        !access.features.analysts ? "Analyst data" : null,
        !access.features.technicals ? "Technical data" : null,
      ].filter(Boolean),
      results: result.results.map((row) => ({
        ...row,
        analystCount: access.features.analysts ? row.analystCount : null,
        analystTargetUpsidePct: access.features.analysts
          ? row.analystTargetUpsidePct
          : null,
        return1Y: access.features.technicals ? row.return1Y : null,
        volatility30D: access.features.technicals ? row.volatility30D : null,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}
