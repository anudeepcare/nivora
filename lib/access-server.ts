import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./server";
import {
  resolveAccess,
  cleanAccessConfig,
  type Access,
  type Feature,
} from "./access-policy";
export const accessEnabled = () => process.env.AURYN_ACCESS_ENABLED === "true";
export const exactOwner = (id: string) =>
  !!process.env.AURYN_OWNER_USER_ID && id === process.env.AURYN_OWNER_USER_ID;
export function accessDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(
      "Access controls require server-side account configuration.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function getAccess(
  id: string,
  preview?: string | null,
): Promise<Access> {
  const owner = exactOwner(id),
    enabled = accessEnabled();
  if (!enabled)
    return resolveAccess({
      enabled: false,
      owner,
      licensed: false,
      now: new Date().toISOString(),
    });
  if (!process.env.AURYN_OWNER_USER_ID)
    throw new HttpError("The workspace owner must finish access setup.", 503);
  const db = accessDb();
  const [c, g, s] = await Promise.all([
    db
      .from("auryn_access_config")
      .select("body,enforced,owner_id")
      .eq("id", true)
      .single(),
    db
      .from("auryn_beta_grants")
      .select("expires_at,revoked_at")
      .eq("user_id", id)
      .maybeSingle(),
    db
      .from("auryn_subscriptions")
      .select("status,paid_until")
      .eq("user_id", id)
      .maybeSingle(),
  ]);
  if (c.error || g.error || s.error) {
    if (owner)
      return resolveAccess({
        enabled,
        owner,
        licensed: true,
        now: new Date().toISOString(),
        preview,
      });
    throw new HttpError(
      "Access settings are unavailable. Please try again later.",
      503,
    );
  }
  if (
    !owner &&
    (!c.data.enforced || c.data.owner_id !== process.env.AURYN_OWNER_USER_ID)
  )
    throw new HttpError(
      "The owner must save access settings before beta testing.",
      503,
    );
  return resolveAccess({
    enabled,
    owner,
    licensed: process.env.AURYN_EXTERNAL_DATA_LICENSED === "true",
    now: new Date().toISOString(),
    preview: owner ? preview : null,
    config: cleanAccessConfig(c.data.body),
    grant: g.data
      ? { expiresAt: g.data.expires_at, revoked: !!g.data.revoked_at }
      : null,
    subscription: s.data
      ? { status: s.data.status, paidUntil: s.data.paid_until }
      : null,
  });
}
const requestChecks = new WeakMap<Request, Promise<Access>>();
export function requestAccess(request: Request, id: string) {
  let check = requestChecks.get(request);
  if (!check) {
    check = getAccess(id, request.headers.get("x-auryn-preview-plan"));
    requestChecks.set(request, check);
  }
  return check;
}
export function requireFeature(a: Access, feature: Feature) {
  if (!a.features[feature])
    throw new HttpError(
      "This feature is not included in your current access. Open Plan & access in Settings.",
      403,
    );
}
export async function reserveAccess(
  id: string,
  a: Access,
  bucket: "research" | "ai",
  item: string,
) {
  if (!a.enabled || (a.owner && !a.preview)) return;
  const r = await accessDb().rpc("auryn_access_reserve", {
    p_user: id,
    p_bucket: bucket,
    p_item: item,
    p_limit: a.limits[bucket],
  });
  if (r.error)
    throw new HttpError(
      "Your allowance could not be checked. Please try again.",
      503,
    );
  if (!r.data?.allowed)
    throw new HttpError(
      `Your monthly ${bucket === "research" ? "company research" : "AI"} allowance is reached. Reopen a company already counted this month or review your plan.`,
      429,
    );
}
export async function guardAccess(request: Request, id: string) {
  if (!accessEnabled()) return;
  const url = new URL(request.url),
    path = url.pathname;
  // Every vendor-bearing route must pass here; merely hiding a client tab is insufficient.
  const market =
    /^\/api\/(quotes|research|research-context|chart|search|home-feed|company-data|enrichment|logos|price-stream|news|filings|sector-performance|analyst|observations|alerts|paper-plans)(?:\/|$)/.test(
      path,
    );
  if (!market) return;
  const a = await requestAccess(request, id);
  if (!a.admitted)
    throw new HttpError(
      "AURYN is in private testing. Your account has no beta invitation yet.",
      403,
    );
  if (a.sampleOnly)
    throw new HttpError(
      "This beta account uses sample data. External market data is not enabled.",
      403,
    );
  const feature: Feature | null = /\/analyst\//.test(path)
    ? "ai"
    : /\/research-context\//.test(path)
      ? "advanced"
      : /\/(company-data|filings)(?:\/|$)/.test(path)
        ? "financials"
        : /\/(enrichment|news)(?:\/|$)/.test(path)
          ? "news"
          : /\/(sector-performance)(?:\/|$)/.test(path)
            ? "portfolio"
            : /\/(observations|alerts|paper-plans)(?:\/|$)/.test(path)
              ? "advanced"
              : null;
  if (feature) requireFeature(a, feature);
  if (/^\/api\/chart\//.test(path) && url.searchParams.get("range") === "5Y")
    requireFeature(a, "longHistory");
}
