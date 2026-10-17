"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw Error(
      "Account connection is not configured. Add the Supabase public settings to this application.",
    );
  return (client ??= createBrowserClient(url, key));
}
export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error } = await authClient().auth.getSession();
  if (error || !data.session) throw Error("Your session ended. Sign in again.");
  const response = await fetch(`/api/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  const value = await response.json();
  if (!response.ok)
    throw Error(value.error || "This request could not be completed.");
  return value;
}
