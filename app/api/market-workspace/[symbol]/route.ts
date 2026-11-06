import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { captureMarket, marketHistory } from "@/lib/market-workspace-server";
import { requestAccess, requireFeature } from "@/lib/access-server";
import { allowMarketUser } from "@/lib/shared-market";
import { cleanMarketViews } from "@/lib/documents";
export const maxDuration = 60;
const ticker = (s: string) => {
  const v = s.toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(v))
    throw new HttpError("Choose an eligible US stock or ETF.");
  return v;
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user, db } = await account(request);
    const symbol = ticker((await params).symbol);
    const views = await db
      .from("auryn_documents")
      .select("body,updated_at")
      .eq("user_id", user.id)
      .eq("kind", "view")
      .eq("key", "exposure-presets")
      .maybeSingle();
    if (views.error)
      throw new HttpError("Saved account views are unavailable.", 503);
    let snapshots: Awaited<ReturnType<typeof marketHistory>> = [],
      historyError = "";
    try {
      snapshots = await marketHistory(db, user.id, symbol);
    } catch (e) {
      historyError =
        e instanceof HttpError
          ? e.message
          : "Account market history unavailable.";
    }
    return privateJson({
      snapshots,
      historyError,
      views: views.data,
      scope: "account",
      cadence: "Recorded source checkpoints, not backfilled history",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { user, db } = await account(request);
    const symbol = ticker((await params).symbol);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 20000)
      throw new HttpError("The market workspace request is too large.", 413);
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      throw new HttpError("A valid market workspace request is required.");
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new HttpError("A valid market workspace request is required.");
    if (input.op === "views") {
      limit("market-views:" + user.id, 10);
      let presets;
      try {
        presets = cleanMarketViews(input.presets);
      } catch (e) {
        throw new HttpError(
          e instanceof Error ? e.message : "Check saved views.",
        );
      }
      const row = {
        user_id: user.id,
        kind: "view",
        key: "exposure-presets",
        body: {
          name: "Options exposure views",
          symbols: [],
          filter: "",
          horizon: "",
          marketViews: presets,
        },
        updated_at: new Date().toISOString(),
      };
      const expected = input.expectedUpdatedAt;
      if (
        expected !== null &&
        (typeof expected !== "string" || !Number.isFinite(Date.parse(expected)))
      )
        throw new HttpError("Reload account views before saving.");
      if (expected !== null)
        row.updated_at = new Date(
          Math.max(Date.now(), Date.parse(expected) + 1),
        ).toISOString();
      if (Buffer.byteLength(JSON.stringify(row.body)) > 12000)
        throw new HttpError("Saved views exceed account storage limits.");
      const result =
        expected === null
          ? await db.from("auryn_documents").insert(row).select("updated_at")
          : await db
              .from("auryn_documents")
              .update(row)
              .eq("user_id", user.id)
              .eq("kind", "view")
              .eq("key", "exposure-presets")
              .eq("updated_at", expected)
              .select("updated_at");
      if (result.error || !result.data?.length)
        throw new HttpError(
          "Account views changed on another device. Reload before saving your changes.",
          409,
        );
      return privateJson({ saved: true, updatedAt: result.data[0].updated_at });
    }
    if (input.op !== "capture")
      throw new HttpError("Choose capture or saved views.");
    limit("market-capture:" + user.id, 3);
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "options");
    if (!(await allowMarketUser(user.id)))
      throw new HttpError(
        "Your market-data allowance is reached. Saved history remains available.",
        429,
      );
    const expiry =
      input.expiry === undefined || input.expiry === null ? null : input.expiry;
    if (
      expiry !== null &&
      (typeof expiry !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
        !Number.isFinite(Date.parse(expiry)) ||
        new Date(expiry).toISOString().slice(0, 10) !== expiry)
    )
      throw new HttpError("Choose a valid expiration.");
    return privateJson({
      saved: true,
      snapshot: await captureMarket(db, user.id, symbol, expiry),
    });
  } catch (e) {
    return failure(e);
  }
}
