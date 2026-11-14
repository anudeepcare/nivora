import { requestAccess, reserveAccess } from "@/lib/access-server";
import { projectResearch } from "@/lib/access-policy";
import { canonical } from "@/lib/canonical";
import { account, failure, limit, privateJson } from "@/lib/server";
import { research, researchSymbol } from "@/lib/providers";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`research:${user.id}`, 12);
    const symbol = researchSymbol((await params).symbol);
    const access = await requestAccess(request, user.id);
    await reserveAccess(user.id, access, "research", symbol);
    let data = await research(symbol);
    if (
      access.owner &&
      process.env.AURYN_SENTISENSE_PREVIEW_ENABLED === "true"
    ) {
      try {
        const { enrichSentiSenseTargets } = await import(
          "@/lib/sentisense-provider"
        );
        data = await enrichSentiSenseTargets(data, access);
      } catch {
        // An optional preview source must never take existing research offline.
      }
    }
    return privateJson(
      projectResearch({ ...data, snapshot: canonical(data) }, access),
    );
  } catch (e) {
    return failure(e);
  }
}
