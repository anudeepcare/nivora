import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { research } from "@/lib/providers";
import { canonical } from "@/lib/canonical";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request);
    let q = db
      .from("auryn_observations")
      .select("symbol,snapshot_id,observed_at,payload")
      .eq("user_id", user.id);
    const symbol = new URL(request.url).searchParams.get("symbol");
    if (symbol) q = q.eq("symbol", symbolInput(symbol));
    const r = await q.order("observed_at", { ascending: false }).limit(100);
    if (r.error)
      throw new HttpError(
        "Saved snapshots are unavailable. Apply the workspace migration.",
        503,
      );
    return privateJson({ observations: r.data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request);
    limit(`snapshot:${user.id}`, 6);
    const body = await request.json(),
      r = await research(symbolInput(body.symbol)),
      c = canonical(r);
    const saved = await db.from("auryn_observations").upsert(
      {
        user_id: user.id,
        symbol: r.company.symbol,
        snapshot_id: c.id,
        payload: { ...c, quote: r.quote, filings: r.filings },
      },
      { onConflict: "user_id,symbol,snapshot_id", ignoreDuplicates: true },
    );
    if (saved.error)
      throw new HttpError("The snapshot could not be saved.", 503);
    return privateJson({ saved: true, snapshot: c });
  } catch (e) {
    return failure(e);
  }
}
