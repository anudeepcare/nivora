import { account, failure, limit, privateJson, HttpError } from "@/lib/server";
import { requestAccess, reserveAccess } from "@/lib/access-server";
import { sentisenseOptionsOverview } from "@/lib/sentisense-api";
export async function GET(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    await limit(`options-overview:${user.id}`, 6);
    const access = await requestAccess(request, user.id);
    if (
      access.enabled &&
      !(access.owner && !access.preview) &&
      !access.features.options
    )
      throw new HttpError(
        "Options research is not included in your access.",
        403,
      );
    await reserveAccess(user.id, access, "research", "options-market");
    const result = await sentisenseOptionsOverview();
    const data = result.data as {
      asOf?: string;
      coverageCount?: number;
      rows?: unknown[];
      etfRows?: unknown[];
    } | null;
    // Explicit allowlist: never transmit proprietary scores or sentiment to this UI.
    const rows = (input: unknown) =>
      Array.isArray(input)
        ? input
            .filter(
              (r): r is Record<string, unknown> => !!r && typeof r === "object",
            )
            .map((r) => ({
              ticker: r.ticker,
              name: r.name,
              asOf: r.asOf,
              atmIv: r.atmIv,
              pcVol: r.pcVol,
            }))
            .sort((a, b) => String(a.ticker).localeCompare(String(b.ticker)))
        : [];
    return privateJson({
      ...result,
      data: data
        ? {
            asOf: data.asOf,
            coverageCount: data.coverageCount,
            rows: rows(data.rows),
            etfRows: rows(data.etfRows),
          }
        : null,
    });
  } catch (error) {
    return failure(error);
  }
}
