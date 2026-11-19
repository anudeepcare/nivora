import type { CookieOptions } from "@supabase/ssr";
export const persistenceCookie = "auryn-remember-session";
/** Browser-session cookie choice, not token validity or server session revocation. */
export function authCookieOptions(
  name: string,
  options: CookieOptions,
  remember: boolean,
): CookieOptions {
  if (
    remember ||
    !/^sb-.+-auth-token(?:\.\d+)?$/.test(name) ||
    options.maxAge === 0
  )
    return options;
  const next = { ...options };
  delete next.maxAge;
  delete next.expires;
  return next;
}
