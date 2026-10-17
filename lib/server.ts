import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function account(request: Request) {
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
export function limit(key: string, max = 30, windowMs = 60_000) {
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
