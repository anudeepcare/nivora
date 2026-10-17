import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "@supabase/supabase-js";
import { HttpError, limit } from "./server";
const context = new AsyncLocalStorage<boolean>();
export const backgroundWork = <T>(fn: () => Promise<T>) =>
  context.run(true, fn);
export async function reserveProvider() {
  const background = context.getStore() === true,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (key && url) {
    const db = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      { data, error } = await db.rpc("auryn_reserve_provider", {
        p_background: background,
      });
    if (error)
      throw new HttpError(
        "Shared market-data budget is unavailable. Check its migration before retrying.",
        503,
      );
    if (!data)
      throw new HttpError(
        "Market-data allowance is reserved for this minute. Try again shortly.",
        429,
      );
    return;
  }
  if (process.env.AURYN_REQUIRE_DISTRIBUTED_BUDGET === "true")
    throw new HttpError(
      "A distributed market-data budget is required for this deployment.",
      503,
    );
  if (background) limit("provider-background", 42);
  limit("provider-total", 55);
}
