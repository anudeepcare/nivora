import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { sentisenseInstitutionalActivists } from "@/lib/sentisense-api";
import { publicIntelligence } from "@/lib/intelligence-dto";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`institutional-activists:${user.id}`, 6);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.advanced
    )
      throw new HttpError(
        "Institutional discovery is not included in your access.",
        403,
      );
    await reserveAccess(user.id, access, "research", "institutional-activists");
    const result = await sentisenseInstitutionalActivists();
    const safe = publicIntelligence(result);
    const rows = Array.isArray(safe.data) ? safe.data : [];
    return privateJson({
      ...safe,
      totalCount: rows.length,
      data: safe.data === null ? null : rows.slice(0, 50),
    });
  } catch (error) {
    return failure(error);
  }
}
