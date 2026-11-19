"use client";
import { fetchWithDeadline, settleWithDeadline } from "./request-deadline";
import { customerText } from "./customer-language";
import { authCookieOptions, persistenceCookie } from "./auth-persistence";
import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { completeSignOut } from "./auth-actions";
import { clearAccountCache } from "./account-cache";
import type { SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw Error(
      "Sign-in is temporarily unavailable. Please try again or contact support.",
    );
  return (client ??= createBrowserClient(url, key, {
    cookieOptions: {
      secure:
        typeof window !== "undefined" && window.location.protocol === "https:",
    },
    cookies: {
      getAll: () =>
        parseCookieHeader(document.cookie).map(({ name, value }) => ({
          name,
          value: value ?? "",
        })),
      setAll: (
        writes: {
          name: string;
          value: string;
          options: import("@supabase/ssr").CookieOptions;
        }[],
      ) => {
        const remember =
          parseCookieHeader(document.cookie).find(
            (c) => c.name === persistenceCookie,
          )?.value !== "session";
        for (const { name, value, options } of writes)
          document.cookie = serializeCookieHeader(
            name,
            value,
            authCookieOptions(name, options, remember),
          );
      },
    },
  }));
}
export function setRememberSession(remember: boolean) {
  document.cookie = serializeCookieHeader(
    persistenceCookie,
    remember ? "remember" : "session",
    {
      path: "/",
      sameSite: "lax",
      secure: window.location.protocol === "https:",
      maxAge: 31536000,
    },
  );
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let refreshInFlight: ReturnType<
  SupabaseClient["auth"]["refreshSession"]
> | null = null;
export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error } = await settleWithDeadline(
    authClient().auth.getSession(),
    10000,
  );
  if (error || !data.session)
    throw new ApiError("Your session ended. Sign in again.", 401);
  const send = (token: string) =>
    fetchWithDeadline(
      `/api/${path}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...((): Record<string, string> => {
            try {
              const p = sessionStorage.getItem("auryn-owner-preview");
              return p === "free" || p === "pro"
                ? { "x-auryn-preview-plan": p }
                : {};
            } catch {
              return {};
            }
          })(),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal,
      },
      /^(workspace|access|preferences)(?:\?|$)/.test(path) ? 20000 : 90000,
    );
  let response = await send(data.session.access_token);
  // A rejected token has not authorized a mutation. Refresh once, sharing the
  // refresh across concurrent requests, then retry with the replacement token.
  if (response.status === 401 && !signal?.aborted) {
    refreshInFlight ??= settleWithDeadline(
      authClient().auth.refreshSession(),
      10000,
    );
    const pending = refreshInFlight;
    let refreshed;
    try {
      refreshed = await pending;
    } finally {
      if (refreshInFlight === pending) refreshInFlight = null;
    }
    if (!refreshed.error && refreshed.data.session && !signal?.aborted)
      response = await send(refreshed.data.session.access_token);
  }
  const value = await settleWithDeadline(response.json(), 20000).catch(() => {
    if (response.ok)
      throw new ApiError(
        "The server response could not be read. Please try again.",
        502,
      );
    return {};
  });
  if (!response.ok)
    throw new ApiError(
      customerText(value.error || "This request could not be completed."),
      response.status,
    );
  return value;
}

/** A full location replacement also drops mounted private state and Next client route cache. */
export async function signOutAndRedirect() {
  await completeSignOut(
    () => authClient().auth.signOut(),
    clearAccountCache,
    (path) => window.location.replace(path),
  );
}
