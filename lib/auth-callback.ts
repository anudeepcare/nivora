/** Exchanges a one-time PKCE code. No arbitrary return URL or raw provider errors. */
export async function completeAuthCallback(
  input: string,
  exchange: (code: string) => Promise<{ error: unknown }>,
): Promise<string> {
  const url = new URL(input);
  if (url.searchParams.has("error")) return "/login?auth_error=cancelled";
  const code = url.searchParams.get("code");
  if (!code || code.length > 4096) return "/login?auth_error=callback";
  try {
    const { error } = await exchange(code);
    if (error) return "/login?auth_error=callback";
    return url.searchParams.get("next") === "/reset-password" ? "/reset-password" : "/overview";
  } catch { return "/login?auth_error=callback"; }
}

/** Used with Supabase email templates; works without a same-browser PKCE verifier. */
export async function completeEmailConfirmation(
  input: string,
  verify: (value: {token_hash: string;type: "email" | "recovery"}) => Promise<{error:unknown}>,
): Promise<string> {
  const params = new URL(input).searchParams;
  const type = params.get("type"), token_hash = params.get("token_hash");
  if (!token_hash || token_hash.length > 4096 || (type !== "email" && type !== "recovery")) return "/login?auth_error=callback";
  try {
    const {error} = await verify({token_hash,type});
    return error ? "/login?auth_error=callback" : type === "recovery" ? "/reset-password" : "/overview";
  } catch {return "/login?auth_error=callback";}
}
