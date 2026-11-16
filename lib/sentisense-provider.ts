import "server-only";
import { createHash, randomInt } from "node:crypto";
import {
  normalizeSentiSenseTargets,
  strictUtcTimestamp,
  usableAnalystTargets,
  type AnalystTargets,
} from "./sentisense-targets.ts";
import type { Research } from "./types";

type Environment = Record<string, string | undefined>;
type OwnerAccess = { owner: boolean; authenticated?: boolean };
type Dependencies = {
  transport?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  reserve?: (key: string, max: number, windowMs: number) => Promise<void>;
  guard?: DenialGuard;
  cache?: TargetCache;
};
type TargetCache = {
  read: (
    key: string,
    denialKey: string,
  ) => Promise<{ until: number; value: AnalystTargets } | null>;
  write: (key: string, value: AnalystTargets, until: number) => Promise<void>;
};
/** Only normalized successful observations are shared, never credentials or failures. */
const sharedTargetCache: TargetCache = {
  async read(key, denialKey) {
    const { accessDb } = await import("./access-server");
    const { data, error } = await accessDb().rpc("auryn_preview_targets_read", {
      p_key: key,
      p_denial_key: denialKey,
    });
    if (error) throw Error("Preview cache unavailable");
    if (!data) return null;
    return { until: Date.parse(data.expiresAt), value: data.value };
  },
  async write(key, value, until) {
    const { accessDb } = await import("./access-server");
    const { error } = await accessDb().rpc("auryn_preview_targets_write", {
      p_key: key,
      p_value: value,
      p_expires_at: new Date(until).toISOString(),
    });
    if (error) throw Error("Preview cache unavailable");
  },
};
type DenialStore = {
  claim: (
    key: string,
    ticket: number,
    expiresAt: number,
    at: number,
  ) => Promise<boolean>;
  release: (key: string, ticket: number) => Promise<void>;
  extend?: (key: string, ticket: number, until: number) => Promise<void>;
};
type DenialGuard = (
  hash: string,
  expiresAt: number,
  at: number,
) => Promise<
  (() => Promise<void>) & { blockUntil?: (until: number) => Promise<void> }
>;
/** Arm before transport: a denial or uncertain outcome leaves the latch in place. */
export function createSentiSenseDenialGuard(store: DenialStore): DenialGuard {
  return async (hash, expiresAt, at) => {
    const key = createHash("sha256")
      .update(`sentisense:denial:${hash}`)
      .digest("hex");
    const ticket = randomInt(1, 2_147_483_647);
    if (!(await store.claim(key, ticket, expiresAt, at)))
      throw Error("Optional source paused");
    const release: (() => Promise<void>) & {
      blockUntil?: (until: number) => Promise<void>;
    } = () => store.release(key, ticket);
    if (store.extend)
      release.blockUntil = (until) => store.extend!(key, ticket, until);
    return release;
  };
}
// Reuse the existing service-role-only table. No migration or credential storage.
const sharedGuard = createSentiSenseDenialGuard({
  async claim(key, ticket, expiresAt, at) {
    const { accessDb } = await import("./access-server");
    const db = accessDb();
    const expired = await db
      .from("auryn_request_limits")
      .delete()
      .eq("key", key)
      .lte("expires_at", new Date(at).toISOString());
    if (expired.error) throw Error("Optional source protection unavailable");
    const inserted = await db.from("auryn_request_limits").insert({
      key,
      count: ticket,
      expires_at: new Date(expiresAt).toISOString(),
    });
    if (inserted.error?.code === "23505") return false;
    if (inserted.error) throw Error("Optional source protection unavailable");
    return true;
  },
  async extend(key, ticket, until) {
    const { accessDb } = await import("./access-server");
    const result = await accessDb()
      .from("auryn_request_limits")
      .update({ expires_at: new Date(until).toISOString() })
      .eq("key", key)
      .eq("count", ticket);
    if (result.error) throw Error("Optional source protection unavailable");
  },
  async release(key, ticket) {
    const { accessDb } = await import("./access-server");
    const result = await accessDb()
      .from("auryn_request_limits")
      .delete()
      .eq("key", key)
      .eq("count", ticket);
    if (result.error) throw Error("Optional source protection unavailable");
  },
});
const localLatches = new Map<string, { ticket: number; expiresAt: number }>();
const localGuard = createSentiSenseDenialGuard({
  async claim(key, ticket, expiresAt, at) {
    if ((localLatches.get(key)?.expiresAt ?? 0) > at) return false;
    localLatches.set(key, { ticket, expiresAt });
    return true;
  },
  async release(key, ticket) {
    if (localLatches.get(key)?.ticket === ticket) localLatches.delete(key);
  },
});
const day = 86_400_000;
/** Hosted previews use the shared DB budget; local testing needs a separate opt-in. */
export function sentiSensePreviewEnabled(
  access: OwnerAccess,
  env: Environment,
  now: number,
): boolean {
  const expiry = strictUtcTimestamp(env.SENTISENSE_KEY_EXPIRES_AT);
  const preview =
    env.VERCEL_ENV === "preview" &&
    (env.NODE_ENV === "production" || env.AURYN_SHARED_RATE_LIMIT === "true");
  const local =
    !env.VERCEL_ENV &&
    env.NODE_ENV === "development" &&
    env.AURYN_SENTISENSE_LOCAL_PREVIEW === "true";
  return (
    access.owner === true &&
    env.AURYN_SENTISENSE_PREVIEW_ENABLED === "true" &&
    env.VERCEL_ENV !== "production" &&
    (preview || local) &&
    !!env.SENTISENSE_API_KEY?.trim() &&
    Number.isFinite(now) &&
    expiry !== null &&
    expiry > now &&
    expiry - now <= 3 * day
  );
}

/** Paid mode is explicit and retains the caller's existing authenticated access gate. */
export function sentiSenseProEnabled(
  access: OwnerAccess,
  env: Environment,
  at: number,
): boolean {
  return (
    env.AURYN_SENTISENSE_MODE === "pro" &&
    access.authenticated === true &&
    (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production") &&
    !!env.SENTISENSE_API_KEY?.trim() &&
    Number.isFinite(at)
  );
}
function sentiSenseEnabled(
  access: OwnerAccess,
  env: Environment,
  at: number,
): boolean {
  if (env.AURYN_SENTISENSE_MODE) return sentiSenseProEnabled(access, env, at);
  return sentiSensePreviewEnabled(access, env, at);
}

type KeyState = {
  tail: Promise<unknown>;
  lastStarted: number;
  deniedUntil: number;
  cached: Map<string, { until: number; value: AnalystTargets | null }>;
  pending: Map<string, Promise<AnalystTargets | null>>;
};
/** No retry loop, URL override, framework data cache or credentials in returned data. */
export function createSentiSenseClient(dependencies: Dependencies = {}) {
  const transport = dependencies.transport ?? fetch;
  const now = dependencies.now ?? Date.now;
  const sleep =
    dependencies.sleep ??
    ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const reserve =
    dependencies.reserve ??
    (async (key, max, windowMs) => {
      const { limit } = await import("./server");
      await limit(key, max, windowMs);
    });
  const keys = new Map<string, KeyState>();

  async function getTargets(
    symbol: string,
    access: OwnerAccess,
    env: Environment,
    options: { budgetMs?: number } = {},
  ): Promise<AnalystTargets | null> {
    if (
      !sentiSenseEnabled(access, env, now()) ||
      !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)
    )
      return null;
    const paid = env.AURYN_SENTISENSE_MODE === "pro";
    const ttl = paid ? 3_600_000 : day;
    const keyExpiry = () =>
      paid ? Infinity : strictUtcTimestamp(env.SENTISENSE_KEY_EXPIRES_AT)!;
    const key = env.SENTISENSE_API_KEY!;
    const hash = createHash("sha256")
      .update(paid ? `pro:${key}` : key)
      .digest("hex");
    let state = keys.get(hash);
    if (!state) {
      // Fail closed on unexpected configuration churn rather than evict active queues.
      if (keys.size >= 32) return null;
      state = {
        tail: Promise.resolve(),
        lastStarted: -Infinity,
        deniedUntil: 0,
        cached: new Map(),
        pending: new Map(),
      };
      keys.set(hash, state);
    }
    const current = state;
    if (current.deniedUntil > now()) return null;
    const targetCache =
      dependencies.cache ?? (env.VERCEL_ENV ? sharedTargetCache : undefined);
    const cached = current.cached.get(symbol);
    if (
      !targetCache &&
      cached &&
      cached.until > now() &&
      cached.value &&
      usableAnalystTargets(cached.value, symbol, "USD", now())
    )
      return cached.value;
    const pending = current.pending.get(symbol);
    if (pending) return pending;
    if (current.pending.size >= 256) return null;

    const budgetMs = Number.isFinite(options.budgetMs)
      ? Math.min(20_000, Math.max(1, options.budgetMs!))
      : 3000;
    const deadline = paid ? now() + budgetMs : Infinity;
    const controller = new AbortController();
    const timer = paid
      ? setTimeout(() => controller.abort(), budgetMs)
      : undefined;
    const available = () =>
      !controller.signal.aborted &&
      now() < deadline &&
      sentiSenseEnabled(access, env, now());
    const cacheKey = `sentisense:preview:v1:${hash}:${symbol}`;
    const denialKey = createHash("sha256")
      .update(`sentisense:denial:${hash}`)
      .digest("hex");

    let temporaryServerFailure = false;
    const request = (path: string): Promise<unknown> => {
      const operation = current.tail.then(async () => {
        if (!available() || current.deniedUntil > now())
          throw Error("Preview unavailable");
        const wait = current.lastStarted + (paid ? 250 : 7200) - now();
        if (now() + Math.max(wait, 0) >= deadline)
          throw Error("Optional source budget exhausted");
        if (wait > 0) await sleep(wait);
        if (!available() || current.deniedUntil > now())
          throw Error("Preview unavailable");
        // Independent namespaces, with one reservation for EVERY upstream request.
        await reserve(
          `sentisense:${hash}:burst`,
          paid ? 4 : 1,
          paid ? 1000 : 7100,
        );
        if (!available()) throw Error("Optional source budget exhausted");
        if (paid) await reserve(`sentisense:${hash}:minute`, 240, 60_000);
        else await reserve(`sentisense:${hash}:day`, 24, day);
        if (!available()) throw Error("Preview expired");
        const guard =
          dependencies.guard ?? (env.VERCEL_ENV ? sharedGuard : localGuard);
        const release = await guard(
          hash,
          paid ? now() + 15 * 60_000 : keyExpiry(),
          now(),
        );
        if (!available()) {
          await release();
          throw Error("Preview expired");
        }
        current.lastStarted = now();
        const response = await transport(
          `https://app.sentisense.ai/api/v1/${path}`,
          {
            headers: {
              "X-SentiSense-API-Key": key,
              Accept: "application/json",
            },
            redirect: "error",
            cache: "no-store",
            signal: paid ? controller.signal : AbortSignal.timeout(15_000),
          },
        );
        if ([401, 403, 429].includes(response.status)) {
          current.deniedUntil = paid ? now() + 15 * 60_000 : keyExpiry();
          if (paid && response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            const seconds =
              retryAfter && /^\d+$/.test(retryAfter)
                ? Number(retryAfter)
                : null;
            const retryAt =
              seconds !== null
                ? now() + seconds * 1000
                : Date.parse(retryAfter ?? "");
            if (Number.isFinite(retryAt) && retryAt > current.deniedUntil) {
              current.deniedUntil = retryAt;
              await release.blockUntil?.(retryAt);
            }
          }
          throw Error("Optional target source unavailable");
        }
        // A known non-denial may release only its own nonce. Transport failures,
        // process exits and denial responses leave the durable latch armed.
        if (!response.ok) {
          await release();
          temporaryServerFailure = response.status >= 500;
          throw Error("Optional target source unavailable");
        }
        const text = await response.text();
        await release();
        if (text.length > 200_000)
          throw Error("Optional target response too large");
        return JSON.parse(text) as unknown;
      });
      current.tail = operation.catch(() => undefined);
      return operation;
    };
    const work = (async () => {
      let value: AnalystTargets | null = null;
      if (targetCache) {
        try {
          const saved = await targetCache.read(cacheKey, denialKey);
          if (
            saved &&
            Number.isFinite(saved.until) &&
            saved.until > now() &&
            saved.until <= keyExpiry() &&
            saved.until <= now() + ttl &&
            available() &&
            current.deniedUntil <= now() &&
            usableAnalystTargets(saved.value, symbol, "USD", now())
          ) {
            current.cached.set(symbol, saved);
            return saved.value;
          }
        } catch {
          // Missing protection infrastructure must not trigger upstream traffic
          // or allow warm memory to bypass a shared denial.
          return null;
        }
      }
      if (cached && cached.until > now()) return null;
      try {
        const ticker = encodeURIComponent(symbol);
        const profile = await request(`stocks/${ticker}/profile`);
        const consensus = await request(`analyst/${ticker}/consensus`);
        if (available())
          value = normalizeSentiSenseTargets(consensus, profile, symbol, now());
      } catch {
        // Optional source failures, denial details and secrets never enter research.
      }
      if (value && targetCache && available()) {
        try {
          await targetCache.write(
            cacheKey,
            value,
            Math.min(now() + ttl, keyExpiry()),
          );
        } catch {
          /* Preserve a successfully fetched observation if caching fails. */
        }
      }
      if (!available()) return null;
      for (const [symbol, entry] of current.cached)
        if (entry.until <= now()) current.cached.delete(symbol);
      if (current.cached.size < 256 || current.cached.has(symbol))
        current.cached.set(symbol, {
          // A confirmed 5xx is not evidence that the ticker has no targets.
          // Allow a later user request to recover after a bounded cooldown.
          // Denials/uncertain outcomes keep their existing durable guard and
          // every later request still passes the same expiry and quota gates.
          until: Math.min(
            now() +
              (temporaryServerFailure || (paid && !value) ? 5 * 60_000 : ttl),
            keyExpiry(),
          ),
          value,
        });
      return value;
    })();
    const bounded = !paid
      ? work
      : new Promise<AnalystTargets | null>((resolve, reject) => {
          const abort = () => resolve(null);
          controller.signal.addEventListener("abort", abort, { once: true });
          if (controller.signal.aborted) abort();
          work
            .then(resolve, reject)
            .finally(() =>
              controller.signal.removeEventListener("abort", abort),
            );
        });
    current.pending.set(symbol, bounded);
    try {
      return await bounded;
    } finally {
      if (timer) clearTimeout(timer);
      controller.abort();
      current.pending.delete(symbol);
    }
  }

  return {
    getTargets,
    async enrich(
      r: Research,
      access: OwnerAccess,
      env: Environment = process.env,
    ): Promise<Research> {
      // Paid output cannot inherit a previously attached owner-trial observation.
      const base =
        env.AURYN_SENTISENSE_MODE === "pro" &&
        r.analystTargets?.source === "SentiSense"
          ? { ...r, analystTargets: undefined }
          : r;
      if (
        r.company.assetType !== "stock" ||
        r.company.currency !== "USD" ||
        r.quote.currency !== "USD"
      )
        return base;
      const targets = await getTargets(r.company.symbol, access, env);
      return targets ? { ...base, analystTargets: targets } : base;
    },
  };
}
const client = createSentiSenseClient();
export const enrichSentiSenseTargets = client.enrich;

/** Dedicated authenticated endpoint: does not hold the base research response. */
export const getSentiSenseTargets = (
  symbol: string,
  access: OwnerAccess,
  env: Environment = process.env,
) => client.getTargets(symbol, access, env, { budgetMs: 20_000 });
