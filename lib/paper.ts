import { createClient, type User } from "@supabase/supabase-js";
import { HttpError } from "./server";
import {
  afterPaperClaim,
  cleanPaperPlan,
  paperChecks,
  terminalPaperStatus,
  canManagePaper,
} from "./paper-policy";
import { quote } from "./providers";
export function isAdmin(user: User) {
  return (
    user.app_metadata?.role === "admin" ||
    (Array.isArray(user.app_metadata?.roles) &&
      user.app_metadata.roles.includes("admin")) ||
    (process.env.AURYN_ADMIN_USER_IDS || "").split(",").includes(user.id)
  );
}
export function paperOwner(user: User) {
  if (
    !canManagePaper(user, {
      ownerId: process.env.AURYN_PAPER_OWNER_ID,
      adminIds: process.env.AURYN_ADMIN_USER_IDS,
    })
  )
    throw new HttpError(
      "Only the configured paper-account owner can manage execution.",
      403,
    );
}
export function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(
      "Server-side workspace credentials must be configured before durable jobs or paper execution.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function broker(path: string, method = "GET", body?: unknown) {
  const key = process.env.ALPACA_PAPER_API_KEY,
    secret = process.env.ALPACA_PAPER_API_SECRET;
  if (!key || !secret)
    throw new HttpError("Paper broker credentials are not configured.", 503);
  const response = await fetch(`https://paper-api.alpaca.markets/v2/${path}`, {
    method,
    headers: {
      "APCA-API-KEY-ID": key,
      "APCA-API-SECRET-KEY": secret,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (response.status === 404 && method === "GET") return null;
  if (!response.ok)
    throw new HttpError(
      `Paper broker returned status ${response.status}; reconcile before retrying.`,
      503,
    );
  return response.status === 204 ? {} : response.json();
}
export async function reconcilePaper(
  userId: string,
  runId: string,
  cancel = false,
) {
  const db = serviceDb(),
    { data: run, error } = await db
      .from("auryn_paper_runs")
      .select("*")
      .eq("id", runId)
      .eq("user_id", userId)
      .single();
  if (error || !run) throw new HttpError("Paper run not found.", 404);
  let order = await broker(
    `orders:by_client_order_id?client_order_id=${encodeURIComponent(run.client_order_id)}`,
  );
  if (!order)
    return {
      status: "uncertain",
      detail:
        "No broker record was found. The reservation remains locked; do not resubmit. Check the broker and resolve with the administrator.",
    };
  if (cancel && !terminalPaperStatus(order.status)) {
    await broker(`orders/${encodeURIComponent(order.id)}`, "DELETE");
    order = await broker(`orders/${encodeURIComponent(order.id)}`);
  }
  if (!order)
    throw new HttpError("The broker order could not be reconciled.", 503);
  const values = {
    status: String(order.status),
    broker_order_id: String(order.id),
    filled_qty: Number(order.filled_qty) || 0,
    filled_avg_price: order.filled_avg_price
      ? Number(order.filled_avg_price)
      : null,
    detail: "Broker order reconciled.",
    updated_at: new Date().toISOString(),
  };
  const saved = await db
    .from("auryn_paper_runs")
    .update(values)
    .eq("id", runId)
    .eq("user_id", userId);
  if (saved.error)
    throw new HttpError(
      "Order observed but its audit record could not be saved. The execution lock remains.",
      503,
    );
  if (terminalPaperStatus(order.status)) {
    const removed = await db
      .from("auryn_paper_lock")
      .delete()
      .eq("run_id", runId);
    if (removed.error)
      throw new HttpError(
        "Order is terminal but its lock could not be released.",
        503,
      );
  }
  return values;
}
export async function executePaper(userId: string, planId: string) {
  if (process.env.AURYN_PAPER_EXECUTION_ENABLED !== "true")
    throw new HttpError("Paper execution is disabled in this deployment.", 403);
  if (userId !== process.env.AURYN_PAPER_OWNER_ID)
    throw new HttpError("Paper owner configuration does not match.", 403);
  const db = serviceDb(),
    { data: row, error } = await db
      .from("auryn_paper_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();
  if (error || !row) throw new HttpError("Plan not found.", 404);
  const p = cleanPaperPlan({ ...row.body, enabled: row.enabled });
  const verifyAccount = async () => {
    const [a, clock, asset, positions, orders, q] = await Promise.all([
      broker("account"),
      broker("clock"),
      broker(`assets/${encodeURIComponent(p.symbol)}`),
      broker("positions"),
      broker("orders?status=open&limit=500"),
      quote(p.symbol),
    ]);
    const held = Array.isArray(positions)
      ? positions.find((x: any) => x.symbol === p.symbol)
      : null;
    return paperChecks(p, {
      marketOpen: clock?.is_open === true,
      tradable:
        asset?.tradable === true &&
        asset.status === "active" &&
        asset.class === "us_equity",
      accountActive:
        a?.status === "ACTIVE" && !a.trading_blocked && !a.account_blocked,
      cash: Number(a?.cash),
      equity: Number(a?.equity),
      heldQuantity: Number(held?.qty ?? 0),
      heldValue: Number(held?.market_value ?? 0),
      price: q.quote.price ?? NaN,
      quoteAt: q.quote.asOf ?? "",
      now: new Date().toISOString(),
      openOrders: Array.isArray(orders) ? orders.length : 1,
    });
  };
  const check = await verifyAccount();
  if (!check.allowed) throw new HttpError(check.errors.join(" "), 409);
  return afterPaperClaim(
    async () => {
      const period = new Date().toISOString().slice(0, 7),
        claim = await db.rpc("auryn_claim_paper", {
          p_plan: planId,
          p_user: userId,
          p_period: period,
        });
      if (claim.error || !claim.data)
        throw new HttpError(
          "This monthly plan already ran, is paused, or another run needs reconciliation.",
          409,
        );
      return claim.data;
    },
    verifyAccount,
    async (run) => {
      try {
        // The immutable reservation and account-wide lock are acquired before the only submission attempt.
        const order = await broker("orders", "POST", {
          symbol: p.symbol,
          qty: String(p.quantity),
          side: p.side,
          type: "limit",
          time_in_force: "day",
          limit_price: p.limitPrice.toFixed(2),
          client_order_id: run.client_order_id,
          extended_hours: false,
        });
        if (!order?.id) throw Error("Broker response incomplete");
        return await reconcilePaper(userId, run.id);
      } catch {
        await db
          .from("auryn_paper_runs")
          .update({
            status: "uncertain",
            detail:
              "Submission may have reached the broker. Reconcile this exact client order ID; automatic resubmission is disabled.",
          })
          .eq("id", run.id)
          .eq("user_id", userId);
        return {
          status: "uncertain",
          runId: run.id,
          detail:
            "Submission status is uncertain. Reconcile before any further execution.",
        };
      }
    },
    async (run, errors) => {
      const detail = errors.join(" "),
        saved = await db
          .from("auryn_paper_runs")
          .update({
            status: "blocked",
            detail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", run.id)
          .eq("user_id", userId);
      if (saved.error)
        throw new HttpError(
          "Validation failed; the audit lock remains until an administrator reviews it.",
          503,
        );
      const released = await db
        .from("auryn_paper_lock")
        .delete()
        .eq("run_id", run.id);
      if (released.error)
        throw new HttpError(
          "Validation failed; execution lock could not be released.",
          503,
        );
      return { status: "blocked", runId: run.id, detail };
    },
  );
}
