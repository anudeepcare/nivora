"use client";
import { createBrowserClient } from "@supabase/ssr";
import { completeSignOut } from "./auth-actions";
import { clearAccountCache } from "./account-cache";
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
      ...((():Record<string,string>=>{try{const p=sessionStorage.getItem("auryn-owner-preview");return p==="free"||p==="pro"?{"x-auryn-preview-plan":p}:{};}catch{return {};}})()),
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

/** A full location replacement also drops mounted private state and Next client route cache. */
export async function signOutAndRedirect() {
  await completeSignOut(
    () => authClient().auth.signOut(),
    clearAccountCache,
    path => window.location.replace(path),
  );
}
