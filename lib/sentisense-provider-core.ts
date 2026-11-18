import { createHash } from "node:crypto";
export function providerConfig(env: Record<string, string | undefined>) {
  const mode = env.SENTISENSE_SHARED_GUARD || "compatibility",
    raw = env.SENTISENSE_REQUESTS_PER_MINUTE || "20",
    scope = env.SENTISENSE_ACCOUNT_SCOPE || "default-provider-account";
  if (
    !["compatibility", "required"].includes(mode) ||
    !/^\d+$/.test(raw) ||
    Number(raw) < 1 ||
    Number(raw) > 2000 ||
    !/^[A-Za-z0-9._:-]{1,100}$/.test(scope)
  )
    throw Error(
      "SentiSense guard configuration is invalid. Check SENTISENSE_SHARED_GUARD and SENTISENSE_REQUESTS_PER_MINUTE.",
    );
  return {
    mode: mode as "compatibility" | "required",
    max: Number(raw),
    scope,
  };
}
export type ProviderConfig = ReturnType<typeof providerConfig>;
export function providerScope(key: string, c: ProviderConfig) {
  const hash = (s: string) => createHash("sha256").update(s).digest("hex");
  return {
    account: hash("sentisense:account:" + c.scope),
    credential: hash("sentisense:credential:" + key),
  };
}
export type ProviderScope = ReturnType<typeof providerScope>;
export function retrySeconds(raw: string | null, now = Date.now()) {
  if (!raw) return 60;
  const n = /^\d+$/.test(raw.trim())
    ? Number(raw)
    : Math.ceil((Date.parse(raw) - now) / 1000);
  return Number.isFinite(n) ? Math.min(86400, Math.max(1, Math.ceil(n))) : 60;
}
export type ProviderPermit = { allowed: boolean; retryAfterSeconds: number };
async function quotaExceeded(response: Response) {
  const reader = response.clone().body?.getReader();
  if (!reader) return false;
  let size = 0,
    body = "";
  const decoder = new TextDecoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 4096) return false;
          body += decoder.decode(part.value, { stream: true });
        }
        try {
          return JSON.parse(body)?.error === "quota_exceeded";
        } catch {
          return false;
        }
      })(),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), 500);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
export function createProviderFetch(deps: {
  config: () => ProviderConfig;
  reserve: (scope: ProviderScope, c: ProviderConfig) => Promise<ProviderPermit>;
  cooldown: (
    scope: ProviderScope,
    seconds: number,
    c: ProviderConfig,
  ) => Promise<void>;
}) {
  return async function guarded(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    fetcher: typeof fetch = fetch,
  ): Promise<Response> {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined),
    );
    const key = headers.get("X-SentiSense-API-Key");
    if (
      url.origin !== "https://app.sentisense.ai" ||
      !/^\/api\/v[12]\//.test(url.pathname) ||
      url.username ||
      url.password ||
      [...url.searchParams.keys()].some((k) =>
        /^(api[_-]?key|token|key|authorization)$/i.test(k),
      ) ||
      !key ||
      key.length > 4096
    )
      throw Error("Invalid SentiSense provider request.");
    const c = deps.config(),
      scope = providerScope(key, c);
    let permit: ProviderPermit;
    try {
      permit = await deps.reserve(scope, c);
    } catch {
      throw Error(
        "SentiSense request protection unavailable. Check server account configuration and apply the provider guard migration before enabling required mode.",
      );
    }
    if (
      typeof permit?.allowed !== "boolean" ||
      !Number.isFinite(permit.retryAfterSeconds)
    )
      throw Error("SentiSense request protection returned an invalid result.");
    if (!permit.allowed)
      return Response.json(
        {
          error: "rate_limit_exceeded",
          message: "Shared SentiSense request budget or cooldown reached.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil(permit.retryAfterSeconds)),
            ),
            "Cache-Control": "no-store",
          },
        },
      );
    const response = await fetcher(input, { ...init, redirect: "error" });
    if (response.status === 429) {
      let seconds = retrySeconds(response.headers.get("retry-after"));
      if (
        !response.headers.has("retry-after") &&
        (await quotaExceeded(response))
      )
        seconds = 3600;
      try {
        await deps.cooldown(scope, seconds, c);
      } catch {
        throw Error(
          "SentiSense cooldown could not be persisted. Check the provider guard migration and account configuration.",
        );
      }
    }
    return response;
  };
}
