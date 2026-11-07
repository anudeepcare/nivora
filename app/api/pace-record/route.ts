import { createClient } from "@supabase/supabase-js";
import { account, limit, failure, HttpError, privateJson } from "@/lib/server";
import { exactOwner, accessDb } from "@/lib/access-server";
import { research } from "@/lib/providers";
import { canonical } from "@/lib/canonical";
import { publicationInput } from "@/lib/pace-publication";
import { pacePolicyFingerprint } from "@/lib/pace-policy-fingerprint";
export async function GET() {
  try {
    if (process.env.AURYN_EXTERNAL_DATA_LICENSED !== "true")
      throw new HttpError(
        "Public market-data publication is not enabled.",
        503,
      );
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
      throw new HttpError("Publication feed is not configured.", 503);
    const db = createClient(url, key, { auth: { persistSession: false } });
    const r = await db
      .from("auryn_public_pace_records")
      .select(
        "id,published_at,symbol,signal_period,policy,pace,reference_price,quote_at,evidence_hash,policy_hash",
      )
      .order("published_at", { ascending: false })
      .limit(100);
    if (r.error) throw new HttpError("Publication feed is unavailable.", 503);
    return Response.json(
      {
        records: r.data,
        scope: "Latest 100 published observations; not a performance series.",
      },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await account(request, { market: true });
    if (!exactOwner(user.id))
      throw new HttpError("Owner access required.", 403);
    if (process.env.AURYN_EXTERNAL_DATA_LICENSED !== "true")
      throw new HttpError(
        "Public market-data publication is not enabled.",
        403,
      );
    await limit(`pace-publication:${user.id}`, 6);
    const body = await request.json();
    const symbol = String(body.symbol ?? "").toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
      throw new HttpError("Choose a stock symbol.");
    const r = await research(symbol);
    if (r.company.assetType !== "stock" || r.quote.currency !== "USD")
      throw new HttpError(
        "The public record currently covers USD-listed stocks.",
      );
    const c = canonical(r);
    if (!c.monthly)
      throw new HttpError("A completed monthly signal is unavailable.");
    let row;
    try {
      row = publicationInput(
        {
          symbol,
          period: c.monthly.month,
          pace: c.monthly.multiplier,
          price: r.quote.price,
          quoteAt: r.quote.asOf ?? "",
          stale: r.quote.stale,
          policyHash: pacePolicyFingerprint,
          evidenceHash: c.evidenceId,
        },
        new Date().toISOString(),
      );
    } catch (e) {
      throw new HttpError(
        e instanceof Error ? e.message : "Evidence is not publishable.",
      );
    }
    const result = await accessDb()
      .from("auryn_public_pace_records")
      .insert(row)
      .select("id,published_at")
      .single();
    if (result.error?.code === "23505")
      throw new HttpError(
        "This company and period are already recorded; existing records cannot be overwritten.",
        409,
      );
    if (result.error)
      throw new HttpError("Record could not be published.", 503);
    return privateJson({ saved: true, ...result.data });
  } catch (e) {
    return failure(e);
  }
}
