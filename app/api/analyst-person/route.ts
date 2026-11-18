import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { analystSlug } from "@/lib/analyst-person";
import { readAnalystPerson } from "@/lib/analyst-person.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "analysts");
    const params = new URL(request.url).searchParams;
    const slug = analystSlug(params.get("slug"));
    const mode = params.get("mode") ?? "profile";
    const offsetText = params.get("offset") ?? "0";
    const offset = Number(offsetText);
    if (
      !slug ||
      !["profile", "calls"].includes(mode) ||
      !/^\d{1,5}$/.test(offsetText) ||
      offset > 10000 ||
      offset % 25 !== 0 ||
      (mode === "profile" && offset !== 0) ||
      [...params.keys()].some((k) => !["slug", "mode", "offset"].includes(k)) ||
      ["slug", "mode", "offset"].some((k) => params.getAll(k).length > 1)
    )
      throw new HttpError("Invalid analyst request.", 400);
    await limit(`analyst-person:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", `analyst:${slug}`);
    return privateJson(
      await readAnalystPerson(slug, mode as "profile" | "calls", offset),
    );
  } catch (error) {
    return failure(error);
  }
}
