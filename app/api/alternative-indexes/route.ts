import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { indexIds } from "@/lib/alternative-indexes";
import { readAlternativeIndex } from "@/lib/alternative-indexes.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    requireFeature(access, "advanced");
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const mode = params.get("mode") ?? "detail";
    if (
      [...params.keys()].some((k) => k !== "id" && k !== "mode") ||
      params.getAll("id").length > 1 ||
      params.getAll("mode").length > 1 ||
      !["detail", "history"].includes(mode) ||
      (!id && mode !== "detail") ||
      (id !== null && !indexIds.includes(id))
    )
      throw new HttpError("Choose a supported tracker.", 400);
    await limit(`alternative-indexes:${user.id}`, 6);
    await reserveAccess(
      user.id,
      access,
      "research",
      `index:${id ?? "catalog"}:${mode}`,
    );
    return privateJson(
      await readAlternativeIndex(id, mode as "detail" | "history"),
    );
  } catch (error) {
    return failure(error);
  }
}
