import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { requestAccess } from "@/lib/access-server";
import { researchSymbol } from "@/lib/providers";
import { canReadAnalystTargets } from "@/lib/independent-analyst-targets";
import { usableAnalystTargets } from "@/lib/sentisense-targets";
import { getSentiSenseTargets } from "@/lib/sentisense-provider";
export const maxDuration = 30;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const symbol = researchSymbol((await params).symbol);
    const access = await requestAccess(request, user.id);
    if (!canReadAnalystTargets(access))
      throw new HttpError(
        "Analyst research is not included in this access level.",
        403,
      );
    await limit(`analyst-targets:${user.id}`, 12);
    const enabled =
      process.env.AURYN_SENTISENSE_MODE === "pro" &&
      ["preview", "production"].includes(process.env.VERCEL_ENV ?? "");
    if (!enabled || symbol.includes("/"))
      return privateJson({ symbol, enabled: false, targets: null });
    const value = await getSentiSenseTargets(symbol, {
      ...access,
      authenticated: true,
    });
    return privateJson({
      symbol,
      enabled: true,
      targets: usableAnalystTargets(
        value ?? undefined,
        symbol,
        "USD",
        Date.now(),
      )
        ? value
        : null,
    });
  } catch (error) {
    return failure(error);
  }
}
