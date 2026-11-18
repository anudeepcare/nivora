import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { institutionQuery } from "@/lib/institution-directory";
import { readInstitutionPage } from "@/lib/institution-directory.server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "advanced");
    let query;
    try {
      query = institutionQuery(new URL(request.url).searchParams);
    } catch (e) {
      throw new HttpError(
        e instanceof Error ? e.message : "Invalid institution request.",
        400,
      );
    }
    await limit(`institution-directory:${user.id}`, 6);
    await reserveAccess(
      user.id,
      access,
      "research",
      query.cik ? `institution-${query.cik}` : "institution-finder",
    );
    return privateJson(await readInstitutionPage(query));
  } catch (e) {
    return failure(e);
  }
}
