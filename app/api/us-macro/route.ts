import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { requestAccess, requireFeature } from "@/lib/access-server";
import { eodRequest } from "@/lib/eodhd";
import { normalizeUsGdp } from "@/lib/us-macro";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "news");
    if ([...new URL(request.url).searchParams].length)
      throw new HttpError(
        "This view supports the US annual GDP series only.",
        400,
      );
    await limit(`us-macro:${user.id}`, 6);
    const raw = await eodRequest(
      "macro-indicator/USA",
      { indicator: "gdp_growth_annual" },
      86400000,
    );
    let result;
    try {
      result = normalizeUsGdp(raw, new Date().toISOString().slice(0, 10));
    } catch {
      throw new HttpError(
        "Annual GDP history is unavailable or inconsistent. No substitute is shown.",
        502,
      );
    }
    return privateJson({ ...result, checkedAt: new Date().toISOString() });
  } catch (e) {
    return failure(e);
  }
}
