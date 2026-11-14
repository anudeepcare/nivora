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
type OwnerAccess = { owner: boolean };
type Dependencies = {
  transport?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  reserve?: (key: string, max: number, windowMs: number) => Promise<void>;
  guard?: DenialGuard;
};
type DenialStore = {
  claim: (
    key: string,
    ticket: number,
    expiresAt: number,
    at: number,
  ) => Promise<boolean>;
  release: (key: string, ticket: number) => Promise<void>;
};
type DenialGuard = (
  hash: string,
  expiresAt: number,
  at: number,
) => Promise<() => Promise<void>>;
/** Arm before transport: a denial or uncertain outcome leaves the latch in place. */
export function createSentiSenseDenialGuard(store: DenialStore): DenialGuard {
  return async (hash, expiresAt, at) => {
    const key = createHash("sha256")
      .update(`sentisense:denial:${hash}`)
      .digest("hex");
    const ticket = randomInt(1, 2_147_483_647);
    if (!(await store.claim(key, ticket, expiresAt, at)))
      throw Error("Optional source paused");
    return () => store.release(key, ticket);
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
  ): Promise<AnalystTargets | null> {
    if (
      !sentiSensePreviewEnabled(access, env, now()) ||
      !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)
    )
      return null;
    const key = env.SENTISENSE_API_KEY!;
    const hash = createHash("sha256").update(key).digest("hex");
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
    const cached = current.cached.get(symbol);
    if (cached && cached.until > now()) {
      return cached.value &&
        usableAnalystTargets(cached.value, symbol, "USD", now())
        ? cached.value
        : null;
    }
    const pending = current.pending.get(symbol);
    if (pending) return pending;

    const request = (path: string): Promise<unknown> => {
      const operation = current.tail.then(async () => {
        if (
          !sentiSensePreviewEnabled(access, env, now()) ||
          current.deniedUntil > now()
        )
          throw Error("Preview unavailable");
        const wait = current.lastStarted + 7200 - now();
        if (wait > 0) await sleep(wait);
        if (
          !sentiSensePreviewEnabled(access, env, now()) ||
          current.deniedUntil > now()
        )
          throw Error("Preview unavailable");
        // Independent namespaces, with one reservation for EVERY upstream request.
        await reserve(`sentisense:${hash}:burst`, 1, 7100);
        await reserve(`sentisense:${hash}:day`, 24, day);
        if (!sentiSensePreviewEnabled(access, env, now()))
          throw Error("Preview expired");
        const guard =
          dependencies.guard ??
          (env.VERCEL_ENV === "preview" ? sharedGuard : localGuard);
        const release = await guard(
          hash,
          strictUtcTimestamp(env.SENTISENSE_KEY_EXPIRES_AT)!,
          now(),
        );
        if (!sentiSensePreviewEnabled(access, env, now())) {
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
            signal: AbortSignal.timeout(15_000),
          },
        );
        if ([401, 403, 429].includes(response.status)) {
          current.deniedUntil = strictUtcTimestamp(
            env.SENTISENSE_KEY_EXPIRES_AT,
          )!;
          throw Error("Optional target source unavailable");
        }
        // A known non-denial may release only its own nonce. Transport failures,
        // process exits and denial responses leave the durable latch armed.
        if (!response.ok) {
          await release();
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
      try {
        const ticker = encodeURIComponent(symbol);
        const profile = await request(`stocks/${ticker}/profile`);
        const consensus = await request(`analyst/${ticker}/consensus`);
        if (sentiSensePreviewEnabled(access, env, now()))
          value = normalizeSentiSenseTargets(consensus, profile, symbol, now());
      } catch {
        // Optional source failures, denial details and secrets never enter research.
      }
      for (const [symbol, entry] of current.cached)
        if (entry.until <= now()) current.cached.delete(symbol);
      if (current.cached.size < 256 || current.cached.has(symbol))
        current.cached.set(symbol, { until: now() + day, value });
      return value;
    })();
    current.pending.set(symbol, work);
    try {
      return await work;
    } finally {
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
      if (
        r.company.assetType !== "stock" ||
        r.company.currency !== "USD" ||
        r.quote.currency !== "USD"
      )
        return r;
      const targets = await getTargets(r.company.symbol, access, env);
      return targets ? { ...r, analystTargets: targets } : r;
    },
  };
}
const client = createSentiSenseClient();
export const enrichSentiSenseTargets = client.enrich;
