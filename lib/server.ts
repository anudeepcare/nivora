import { createClient } from "@supabase/supabase-js";
import { allowMarketUser, MarketGuardError } from "./shared-market";
import { NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function account(request: Request, options: { market: boolean }) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError("Sign in to continue.", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new HttpError("Account service is not configured.", 503);
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError("Session could not be verified. Sign in again.", 401);
  if (
    process.env.NODE_ENV === "production" ||
    process.env.AURYN_ACCESS_ENABLED !== "false"
  ) {
    const { guardAccess } = await import("./access-server");
    await guardAccess(request, data.user.id);
  }
  if (options.market) {
    try {
      if (!(await allowMarketUser(data.user.id)))
        throw new HttpError(
          "Your daily research allowance is reached. Saved observations remain available.",
          429,
        );
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(
        e instanceof MarketGuardError
          ? e.message
          : "Market allowance unavailable.",
        503,
      );
    }
  }
  return { user: data.user, db };
}
export function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "The service is temporarily unavailable. Please try again.",
    },
    {
      status: error instanceof HttpError ? error.status : 503,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
export const privateJson = (value: unknown) =>
  NextResponse.json(value, {
    headers: { "Cache-Control": "private, no-store" },
  });
const limits = new Map<string, { count: number; until: number }>();
export async function limit(key: string, max = 30, windowMs = 60_000) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.AURYN_SHARED_RATE_LIMIT === "true"
  ) {
    const { createHash } = await import("node:crypto");
    const { accessDb } = await import("./access-server");
    const { data, error } = await accessDb().rpc("auryn_request_allow", {
      p_key: createHash("sha256").update(key).digest("hex"),
      p_max: max,
      p_window_ms: windowMs,
    });
    if (error)
      throw new HttpError(
        "Request protection is unavailable. Please try again later.",
        503,
      );
    if (data !== true)
      throw new HttpError("Please wait a moment before refreshing again.", 429);
    return;
  }
  const now = Date.now(),
    old = limits.get(key);
  if (old && old.until > now) {
    if (old.count >= max)
      throw new HttpError("Please wait a moment before refreshing again.", 429);
    old.count++;
  } else limits.set(key, { count: 1, until: now + windowMs });
  if (limits.size > 2000)
    for (const [k, v] of limits) if (v.until <= now) limits.delete(k);
}
