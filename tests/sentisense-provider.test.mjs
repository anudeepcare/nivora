import test from "node:test";
import assert from "node:assert/strict";
import {
  providerConfig,
  providerScope,
  retrySeconds,
  createProviderFetch,
} from "../lib/sentisense-provider-core.ts";
const url = "https://app.sentisense.ai/api/v1/stocks/ABC/profile",
  init = { headers: { "X-SentiSense-API-Key": "secret-test-key" } };
test("default aggregate account scope survives key rotation; config is explicit and conservative", () => {
  const c = providerConfig({});
  assert.equal(c.max, 20);
  assert.equal(c.mode, "compatibility");
  assert.equal(
    providerScope("key1", c).account,
    providerScope("key2", c).account,
  );
  assert.notEqual(
    providerScope("key1", c).credential,
    providerScope("key2", c).credential,
  );
  assert.equal(
    JSON.stringify(providerScope("secret-test-key", c)).includes(
      "secret-test-key",
    ),
    false,
  );
  for (const x of ["0", "NaN", "2001", "30.5"])
    assert.throws(() => providerConfig({ SENTISENSE_REQUESTS_PER_MINUTE: x }));
  assert.throws(() => providerConfig({ SENTISENSE_SHARED_GUARD: "false" }));
});
test("all adapter calls contend for one injected distributed permit and never send before permission", async () => {
  let used = 0,
    sent = 0;
  const guarded = createProviderFetch({
    config: () => providerConfig({ SENTISENSE_SHARED_GUARD: "required" }),
    reserve: async () => ({ allowed: ++used <= 3, retryAfterSeconds: 60 }),
    cooldown: async () => {},
  });
  const out = await Promise.all(
    Array.from({ length: 10 }, () =>
      guarded(url, init, async () => {
        sent++;
        return new Response("ok");
      }),
    ),
  );
  assert.equal(sent, 3);
  assert.equal(out.filter((r) => r.status === 429).length, 7);
});
test("required guard failures fail closed without leaking storage or key errors", async () => {
  let n = 0;
  const guarded = createProviderFetch({
    config: () => providerConfig({ SENTISENSE_SHARED_GUARD: "required" }),
    reserve: async () => {
      throw Error("secret-test-key db");
    },
    cooldown: async () => {},
  });
  await assert.rejects(
    () =>
      guarded(url, init, async () => {
        n++;
        return new Response();
      }),
    (e) =>
      !e.message.includes("secret-test-key") && /migration/.test(e.message),
  );
  assert.equal(n, 0);
});
test("429 persists cooldown and preserves original response; other adapters blocked", async () => {
  let until = 0,
    n = 0;
  const guarded = createProviderFetch({
    config: () => providerConfig({ SENTISENSE_SHARED_GUARD: "required" }),
    reserve: async () => ({ allowed: until === 0, retryAfterSeconds: until }),
    cooldown: async (_scope, seconds) => {
      until = seconds;
    },
  });
  const r = await guarded(url, init, async () => {
    n++;
    return Response.json(
      { error: "rate_limit_exceeded" },
      { status: 429, headers: { "retry-after": "12" } },
    );
  });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, "rate_limit_exceeded");
  assert.equal(until, 12);
  await guarded(url.replace("ABC", "DEF"), init, async () => {
    n++;
    return new Response();
  });
  assert.equal(n, 1);
});
test("quota exceeded without Retry-After gets conservative cooldown; retry parsing bounded", async () => {
  let seconds;
  const guarded = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => ({ allowed: true, retryAfterSeconds: 0 }),
    cooldown: async (_s, v) => {
      seconds = v;
    },
  });
  await guarded(url, init, async () =>
    Response.json({ error: "quota_exceeded" }, { status: 429 }),
  );
  assert.equal(seconds, 3600);
  assert.equal(retrySeconds("999999", 0), 86400);
  assert.equal(retrySeconds("bad", 0), 60);
  assert.equal(retrySeconds("0", 0), 1);
});
test("wrapper rejects wrong origin/credential placement before any permit and forces redirect error", async () => {
  let n = 0;
  const guarded = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => {
      n++;
      return { allowed: true, retryAfterSeconds: 0 };
    },
    cooldown: async () => {},
  });
  await assert.rejects(() => guarded("https://evil.test/", init, fetch));
  await assert.rejects(() => guarded(url + "?api_key=x", init, fetch));
  assert.equal(n, 0);
  await guarded(url, init, async (_u, o) => {
    assert.equal(o.redirect, "error");
    return new Response();
  });
});
