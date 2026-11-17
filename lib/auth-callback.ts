/** Exchanges a one-time PKCE code. No arbitrary return URL or raw provider errors. */
export async function completeAuthCallback(
  input: string,
  exchange: (
    code: string,
  ) => Promise<{ error: unknown; data?: { redirectType?: string | null } }>,
): Promise<string> {
  const url = new URL(input);
  const failure =
    url.searchParams.get("next") === "/reset-password"
      ? "/reset-password?auth_error=callback"
      : "/login?auth_error=callback";
  if (url.searchParams.has("error"))
    return failure.startsWith("/reset-password")
      ? failure
      : "/login?auth_error=cancelled";
  const code = url.searchParams.get("code");
  if (!code || code.length > 4096) return failure;
  try {
    const { error, data } = await exchange(code);
    if (error) return failure;
    return data?.redirectType === "recovery" ||
      url.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/overview";
  } catch {
    return failure;
  }
}

/** Used with Supabase email templates; works without a same-browser PKCE verifier. */
export async function completeEmailConfirmation(
  input: string,
  verify: (value: {
    token_hash: string;
    type: "email" | "recovery";
  }) => Promise<{ error: unknown }>,
): Promise<string> {
  const params = new URL(input).searchParams;
  const type = params.get("type"),
    token_hash = params.get("token_hash");
  const failure =
    type === "recovery"
      ? "/reset-password?auth_error=callback"
      : "/login?auth_error=callback";
  if (
    !token_hash ||
    token_hash.length > 4096 ||
    (type !== "email" && type !== "recovery")
  )
    return failure;
  try {
    const { error } = await verify({ token_hash, type });
    return error
      ? failure
      : type === "recovery"
        ? "/reset-password"
        : "/overview";
  } catch {
    return failure;
  }
}
