import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess } from "@/lib/access-server";
import { eodRequest } from "@/lib/eodhd";
import {
  calendarWindow,
  normalizeEodCalendar,
  type CalendarKind,
  type CorporateCalendar,
} from "@/lib/eod-calendar";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`corporate-calendar:${user.id}`, 6);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.news
    )
      throw new HttpError(
        "Corporate events are not included in your access.",
        403,
      );
    const p = new URL(request.url).searchParams,
      kind = p.get("kind") ?? "ipos",
      days = Number(p.get("days") ?? 7);
    if (!["ipos", "splits"].includes(kind) || (days !== 7 && days !== 30))
      throw new HttpError(
        "Choose IPOs or splits and a 7-day or 30-day window.",
        400,
      );
    const { from, to } = calendarWindow(days),
      data = await eodRequest(`calendar/${kind}`, { from, to }, 900000),
      rows = normalizeEodCalendar(kind as CalendarKind, data, from, to);
    const result: CorporateCalendar = {
      kind: kind as CalendarKind,
      from,
      to,
      source: "EODHD",
      retrievedAt: new Date().toISOString(),
      entitlement: "unverified",
      rows: rows.slice(0, 100),
      total: rows.length,
      truncated: rows.length > 100,
    };
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
