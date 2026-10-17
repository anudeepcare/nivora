import { account, failure, HttpError, privateJson, limit } from "@/lib/server";
export async function GET(request: Request) {
  try {
    const { user } = await account(request);
    const roles = user.app_metadata?.roles;
    const allowed =
      user.app_metadata?.role === "admin" ||
      (Array.isArray(roles) && roles.includes("admin")) ||
      (process.env.AURYN_ADMIN_USER_IDS || "")
        .split(",")
        .filter(Boolean)
        .includes(user.id);
    if (!allowed)
      throw new HttpError(
        "Administrator access is required for the paper account.",
        403,
      );
    limit(`paper-status:${user.id}`, 4);
    const key = process.env.ALPACA_PAPER_API_KEY,
      secret = process.env.ALPACA_PAPER_API_SECRET;
    if (!key || !secret)
      throw new HttpError("Alpaca paper credentials are not configured.", 503);
    const fetchPaper = async (path: string) => {
      const r = await fetch(`https://paper-api.alpaca.markets/v2/${path}`, {
        headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      if (!r.ok)
        throw new HttpError("The paper account could not be verified.", 503);
      return r.json();
    };
    const [a, p] = await Promise.all([
      fetchPaper("account"),
      fetchPaper("positions"),
    ]);
    return privateJson({
      mode: "paper",
      equity: Number(a.equity),
      buyingPower: Number(a.buying_power),
      positions: p.map((x: any) => ({
        symbol: x.symbol,
        quantity: Number(x.qty),
        marketValue: Number(x.market_value),
        pnl: Number(x.unrealized_pl),
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
