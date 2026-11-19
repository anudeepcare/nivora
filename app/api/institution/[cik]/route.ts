import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { sentisenseInstitution } from "@/lib/sentisense-api";
import { publicIntelligence } from "@/lib/intelligence-dto";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cik: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`institution:${user.id}`, 6);
    const { cik } = await params;
    if (!/^\d{1,10}$/.test(cik))
      throw new HttpError("Choose a reported institution.", 400);
    const mode = new URL(request.url).searchParams.get("view") ?? "profile";
    if (!["profile", "history"].includes(mode))
      throw new HttpError("Choose holdings or history.", 400);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.advanced
    )
      throw new HttpError(
        "Institutional research is not included in your access.",
        403,
      );
    await reserveAccess(user.id, access, "research", `institution-${cik}`);
    const result = publicIntelligence(
      await sentisenseInstitution(cik, mode === "history"),
    );
    if (
      result.data &&
      typeof result.data === "object" &&
      !Array.isArray(result.data)
    ) {
      const d = result.data as Record<string, unknown>;
      if (Array.isArray(d.holdings)) d.holdings = d.holdings.slice(0, 50);
      if (Array.isArray(d.quarters)) d.quarters = d.quarters.slice(0, 8);
    }
    return privateJson(result);
  } catch (e) {
    return failure(e);
  }
}
