import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { symbolInput } from "@/lib/format";
import { normalizePositions, normalizeWatchlist } from "@/lib/workspace";
export async function GET(request: Request) {
  try {
    const { user, db } = await account(request);
    const [p, w] = await Promise.all([
      db
        .from("portfolio_positions")
        .select("id,symbol,shares,avg_cost,asset_type,currency")
        .eq("user_id", user.id),
      db
        .from("watchlist_items")
        .select("symbol,created_at")
        .eq("user_id", user.id),
    ]);
    if (p.error || w.error)
      throw new HttpError(
        "Saved investments could not be loaded. Check the account table permissions.",
        503,
      );
    return privateJson({
      email: user.email,
      positions: normalizePositions(p.data ?? []),
      watchlist: normalizeWatchlist(w.data ?? []),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user, db } = await account(request);
    limit(`workspace:${user.id}`);
    const body = await request.json();
    if (body.op === "watch" || body.op === "unwatch") {
      const symbol = symbolInput(body.symbol);
      const aliases =
        body.op === "unwatch" && ["BTC/USD", "ETH/USD"].includes(symbol)
          ? [symbol, symbol.replace("/", ""), symbol.replace("/", "-")]
          : [symbol];
      const results = await Promise.all(
        aliases.map((p_symbol) =>
          db.rpc("auryn_set_watch", {
            p_symbol,
            p_saved: body.op === "watch",
          }),
        ),
      );
      if (results.some((r) => r.error))
        throw new HttpError("Watchlist update failed. Please try again.", 503);
    } else if (body.op === "confirm-cost-currency") {
      if (
        body.currency !== "USD" ||
        !Array.isArray(body.ids) ||
        body.ids.length < 1 ||
        body.ids.length > 200 ||
        body.ids.some(
          (id: unknown) =>
            typeof id !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              id,
            ),
        )
      )
        throw new HttpError(
          "Select the positions whose recorded costs you confirm are in USD.",
        );
      const result = await db
        .from("portfolio_positions")
        .update({ currency: "USD", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .in("id", body.ids)
        .is("currency", null)
        .select("id");
      if (result.error)
        throw new HttpError("Cost currency could not be saved.", 503);
      return privateJson({ saved: true, updated: result.data?.length ?? 0 });
    } else if (body.op === "position") {
      const symbol = symbolInput(body.symbol),
        quantity = Number(body.quantity),
        cost = Number(body.cost);
      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(cost) ||
        cost < 0
      )
        throw new HttpError(
          "Enter a positive quantity and a non-negative average cost.",
        );
      const asset_type =
        body.assetType === "cash"
          ? "CASH"
          : symbol.includes("/")
            ? "CRYPTO"
            : "EQUITY";
      if (asset_type === "CASH" && (symbol !== "USD" || cost !== 1))
        throw new HttpError("Cash must be recorded as USD at a cost of 1.");
      const currency = body.currency ?? "USD";
      if (
        typeof currency !== "string" ||
        !/^[A-Z]{3}$/.test(currency) ||
        (asset_type === "CASH" && currency !== "USD")
      )
        throw new HttpError(
          "Choose the currency of your recorded average cost.",
        );
      const row = {
        symbol,
        shares: quantity,
        avg_cost: cost,
        asset_type,
        currency,
        updated_at: new Date().toISOString(),
      };
      const result = body.id
        ? await db
            .from("portfolio_positions")
            .update(row)
            .eq("id", String(body.id))
            .eq("user_id", user.id)
            .select("id")
        : await db
            .from("portfolio_positions")
            .insert({ ...row, user_id: user.id })
            .select("id");
      if (result.error || !result.data?.length)
        throw new HttpError("Position could not be saved.", 503);
    } else if (body.op === "remove-position") {
      const result = await db
        .from("portfolio_positions")
        .delete()
        .eq("id", String(body.id))
        .eq("user_id", user.id)
        .select("id");
      if (result.error || !result.data?.length)
        throw new HttpError("Position could not be removed.", 503);
    } else throw new HttpError("Unknown account operation.");
    return privateJson({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
