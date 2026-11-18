import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import {
  requestAccess,
  requireFeature,
  reserveAccess,
} from "@/lib/access-server";
import { earningsWindow } from "@/lib/global-earnings";
import { readGlobalEarnings } from "@/lib/global-earnings.server";
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
    requireFeature(access, "analysts");
    const params = new URL(request.url).searchParams;
    if (
      [...params.keys()].some((k) => k !== "days" && k !== "day") ||
      params.getAll("days").length > 1 ||
      params.getAll("day").length > 1 ||
      !["7", "14", "30"].includes(params.get("days") ?? "14")
    )
      throw new HttpError("Choose a 7, 14 or 30 day calendar.", 400);
    const window = earningsWindow(Number(params.get("days") ?? 14));
    if (!window)
      throw new HttpError("Calendar date window is unavailable.", 400);
    if (params.has("day") && params.get("day") !== window.from)
      throw new HttpError(
        "Calendar day changed. Reopen the calendar to load the current window.",
        400,
      );
    await limit(`global-earnings:${user.id}`, 6);
    await reserveAccess(user.id, access, "research", "global-earnings");
    return privateJson(await readGlobalEarnings(window));
  } catch (error) {
    return failure(error);
  }
}
