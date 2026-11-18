import "server-only";
import { limit } from "./server";
import { accessDb } from "./access-server";
import {
  createProviderFetch,
  providerConfig,
  type ProviderConfig,
  type ProviderScope,
  type ProviderPermit,
} from "./sentisense-provider-core";
export function createProviderBackend(deps: {
  limit: (key: string, max: number) => Promise<void>;
  rpc: (
    name: string,
    params: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
  now?: () => number;
}) {
  const local = new Map<string, number>();
  const now = deps.now || Date.now;
  return {
    async reserve(
      scope: ProviderScope,
      c: ProviderConfig,
    ): Promise<ProviderPermit> {
      const remaining =
        Math.max(
          local.get(scope.account) || 0,
          local.get(scope.credential) || 0,
        ) - now();
      if (remaining > 0)
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil(remaining / 1000),
        };
      if (c.mode === "compatibility") {
        try {
          await deps.limit("sentisense:shared:account:" + scope.account, c.max);
          await deps.limit(
            "sentisense:shared:credential:" + scope.credential,
            c.max,
          );
        } catch (e) {
          if (e && typeof e === "object" && "status" in e && e.status === 429)
            return { allowed: false, retryAfterSeconds: 60 };
          throw Error("Shared request limiter unavailable.");
        }
        return { allowed: true, retryAfterSeconds: 0 };
      }
      const { data, error } = await deps.rpc("auryn_sentisense_reserve", {
        p_account: scope.account,
        p_credential: scope.credential,
        p_max: c.max,
      });
      const d = data as ProviderPermit | null;
      if (
        error ||
        !d ||
        typeof d.allowed !== "boolean" ||
        !Number.isFinite(d.retryAfterSeconds) ||
        d.retryAfterSeconds < 0 ||
        d.retryAfterSeconds > 86400
      )
        throw Error("Provider guard migration or configuration unavailable.");
      return d;
    },
    async cooldown(scope: ProviderScope, seconds: number, c: ProviderConfig) {
      const until = now() + Math.min(86400, Math.max(1, seconds)) * 1000;
      for (const key of [scope.account, scope.credential])
        local.set(key, Math.max(local.get(key) || 0, until));
      if (local.size > 256)
        for (const [k, v] of local) if (v <= now()) local.delete(k);
      if (c.mode === "required") {
        const { data, error } = await deps.rpc("auryn_sentisense_cooldown", {
          p_account: scope.account,
          p_credential: scope.credential,
          p_seconds: Math.min(86400, Math.max(1, Math.ceil(seconds))),
        });
        if (error || data !== true)
          throw Error(
            "Provider cooldown migration or configuration unavailable.",
          );
      }
    },
  };
}
const backend = createProviderBackend({
  limit,
  rpc: (name, p) => accessDb().rpc(name, p),
});
export const sentisenseFetch = createProviderFetch({
  config: () => providerConfig(process.env),
  ...backend,
});
