import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { sentisenseInstitutionalFlows } from "@/lib/sentisense-api";
import { institutionalFlowsView } from "@/lib/institutional-flows-view";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`institutional-flows:${user.id}`, 6);
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
    await reserveAccess(user.id, access, "research", "institutional-market");
    const result = await sentisenseInstitutionalFlows();
    return privateJson({
      ...result,
      data: institutionalFlowsView(result.data),
    });
  } catch (error) {
    return failure(error);
  }
}
