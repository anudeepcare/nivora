import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./server";
import { createCreditBudget } from "./credit-budget";
const take = createCreditBudget();
const context = new AsyncLocalStorage<boolean>();
export const backgroundWork = <T>(fn: () => Promise<T>) =>
  context.run(true, fn);
export async function reserveProvider(cost = 1) {
  if (!Number.isInteger(cost) || cost < 1 || cost > 55)
    throw new HttpError(
      "This dataset exceeds the configured Grow budget.",
      429,
    );
  const background = context.getStore() === true,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (key && url) {
    const db = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      minute = Math.floor(Date.now() / 60000),
      reservations = await Promise.all(
        Array.from({ length: cost }, () =>
          db.rpc("auryn_reserve_provider", { p_background: background }),
        ),
      );
    // Use the installed one-credit RPC for compatibility. Partial reservations
    // are conservative: no upstream request is made unless every unit succeeds.
    if (reservations.some((r) => r.error))
      throw new HttpError(
        "Shared market-data budget is unavailable. Check its migration before retrying.",
        503,
      );
    if (
      reservations.some((r) => !r.data) ||
      Math.floor(Date.now() / 60000) !== minute
    )
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
  if (!take(cost, background))
    throw new HttpError(
      "Market-data allowance is reserved for this minute. Try again shortly.",
      429,
    );
}
