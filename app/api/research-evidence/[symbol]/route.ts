import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import {
  evidenceSymbol,
  type EvidenceKind,
} from "@/lib/insider-analyst-evidence";
import { readInsiderAnalystEvidence } from "@/lib/insider-analyst-evidence.server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market evidence is not enabled in this deployment.",
        403,
      );
    const symbol = evidenceSymbol((await params).symbol),
      kind = new URL(request.url).searchParams.get("kind");
    if (!symbol || !["clusters", "calls"].includes(kind ?? ""))
      throw new HttpError("Choose supported stock evidence.", 400);
    requireFeature(access, kind === "calls" ? "analysts" : "business");
    await limit(`research-evidence:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", symbol);
    return privateJson(
      await readInsiderAnalystEvidence(symbol, kind as EvidenceKind),
    );
  } catch (e) {
    return failure(e);
  }
}
