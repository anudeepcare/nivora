import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as crypto from "node:crypto";
import * as policy from "../lib/market-policy.ts";
function load({
  publishBulk = true,
  enabled = true,
  publish = true,
  cached = false,
  status = null,
  usageOk = true,
  preflight = true,
  clock = { value: Date.now() },
} = {}) {
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.value]));
    }
    static now() {
      return clock.value;
    }
  }
  const calls = [],
    usageCalls = [];
  const db = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === "auryn_market_publish_evidence_v1" && args.p_key === null)
        return preflight
          ? { data: { stored: false, reason: "invalid-arguments" } }
          : { error: { message: "missing function" } };
      if (name === "auryn_market_acquire")
        return {
          data: status
            ? { status }
            : cached
              ? { status: "cached", value: { cache: true } }
              : { status: "reserved", lease: "lease" },
        };
      return {
        data:
          name === "auryn_market_publish_evidence_v1"
            ? { stored: publish }
            : name === "auryn_market_publish"
              ? publishBulk
              : true,
      };
    },
  };
  const mod = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync("lib/shared-market.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  new Function(
    "require",
    "module",
    "exports",
    "process",
    "fetch",
    "Date",
    source,
  )(
    (n) =>
      n === "node:crypto"
        ? crypto
        : n === "@supabase/supabase-js"
          ? { createClient: () => db }
          : n === "./market-policy"
            ? {
                ...policy,
                eodUsage: (raw) => policy.eodUsage(raw, clock.value),
              }
            : null,
    mod,
    mod.exports,
    {
      env: {
        AURYN_SHARED_MARKET_GUARD: enabled ? "true" : "false",
        NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.test",
        SUPABASE_SERVICE_ROLE_KEY: "fake",
        EODHD_DAILY_BUDGET: "8000",
      },
    },
    async (url) => {
      const token = new URL(url).searchParams.get("api_token");
      usageCalls.push(token);
      return {
        ok: usageOk,
        json: async () => ({
          dailyRateLimit: token === "A" ? 100 : 200,
          apiRequests: token === "A" ? 10 : 30,
          apiRequestsDate: new ClockDate().toISOString().slice(0, 10),
        }),
      };
    },
    ClockDate,
  );
  return { api: mod.exports, calls, usageCalls };
}
test("usage cache is isolated by provider token and same token retains cached snapshot", async () => {
  const { api, calls, usageCalls } = load();
  for (const token of ["A", "B", "A"])
    await api.sharedEodRead(token, "eod/TEST.US", {}, 1000, async () => ({
      ok: true,
    }));
  assert.deepEqual(usageCalls, ["A", "B"]);
  const a = calls.filter((c) => c.name === "auryn_market_acquire");
  assert.deepEqual(
    a.map((c) => c.args.p_remote_used),
    [10, 30, 10],
  );
  assert.deepEqual(
    a.map((c) => c.args.p_cap),
    [80, 160, 80],
  );
});
test("evidence uses distinct cache namespace, same account/cost, strict publisher; legacy output unchanged", async () => {
  const { api, calls } = load();
  assert.equal(typeof api.sharedEodEvidenceRead, "function");
  const value = { ok: true };
  assert.equal(
    await api.sharedEodRead("A", "eod/TEST.US", {}, 1000, async () => value),
    value,
  );
  assert.equal(
    await api.sharedEodEvidenceRead(
      "A",
      "eod/TEST.US",
      {},
      1000,
      async () => value,
    ),
    value,
  );
  const a = calls.filter((c) => c.name === "auryn_market_acquire");
  assert.notEqual(a[0].args.p_key, a[1].args.p_key);
  assert.equal(a[0].args.p_provider, a[1].args.p_provider);
  assert.equal(a[0].args.p_cost, a[1].args.p_cost);
  const expected = crypto
    .createHash("sha256")
    .update(
      a[0].args.p_provider + ":" + policy.canonicalMarketKey("eod/TEST.US", {}),
    )
    .digest("hex");
  assert.equal(a[0].args.p_key, expected);
  assert.ok(calls.some((c) => c.name === "auryn_market_publish_evidence_v1"));
});
test("evidence fails closed if guard disabled or publication not stored; legacy disabled guard unchanged", async () => {
  const { api, usageCalls } = load({ enabled: false });
  let reads = 0;
  await assert.rejects(
    () =>
      api.sharedEodEvidenceRead("A", "eod/TEST.US", {}, 1000, async () => {
        reads++;
      }),
    /protection/,
  );
  assert.equal(reads, 0);
  assert.equal(usageCalls.length, 0);
  assert.equal(
    await api.sharedEodRead("A", "eod/TEST.US", {}, 1000, async () => 42),
    42,
  );
  const denied = load({ publish: false });
  await assert.rejects(
    () =>
      denied.api.sharedEodEvidenceRead(
        "A",
        "eod/TEST.US",
        {},
        1000,
        async () => 42,
      ),
    /publish/,
  );
});
test("evidence cache hit does not call acquisition callback or publisher", async () => {
  const { api, calls } = load({ cached: true });
  const r = await api.sharedEodEvidenceRead(
    "A",
    "eod/TEST.US",
    {},
    1000,
    async () => {
      throw Error("must not fetch");
    },
  );
  assert.deepEqual(r, { cache: true });
  assert.equal(
    calls.filter((c) => c.name === "auryn_market_acquire").length,
    1,
  );
  assert.equal(
    calls.filter(
      (c) =>
        c.name === "auryn_market_publish_evidence_v1" && c.args.p_key !== null,
    ).length,
    0,
  );
});

test("paused/limited states never invoke provider acquisition", async () => {
  for (const status of ["paused", "limited"]) {
    const { api } = load({ status });
    let n = 0;
    await assert.rejects(
      () =>
        api.sharedEodEvidenceRead("A", "eod/TEST.US", {}, 1000, async () => {
          n++;
        }),
      /paused|limited/,
    );
    assert.equal(n, 0);
  }
});
test("usage failure is short-lived, midnight refreshes, and token map is bounded", async () => {
  const clock = { value: Date.parse("2026-05-15T23:59:59Z") };
  const a = load({ clock, cached: true });
  await a.api.sharedEodRead("A", "x", {}, 1, async () => 0);
  clock.value += 2000;
  await a.api.sharedEodRead("A", "x", {}, 1, async () => 0);
  assert.equal(a.usageCalls.length, 2);
  const b = load({ clock, cached: true, usageOk: false });
  await b.api.sharedEodRead("A", "x", {}, 1, async () => 0);
  clock.value += 29999;
  await b.api.sharedEodRead("A", "x", {}, 1, async () => 0);
  assert.equal(b.usageCalls.length, 1);
  clock.value += 1;
  await b.api.sharedEodRead("A", "x", {}, 1, async () => 0);
  assert.equal(b.usageCalls.length, 2);
  assert.equal(b.calls[0].args.p_cap, 0);
  const c = load({ cached: true });
  for (let i = 0; i < 81; i++)
    await c.api.sharedEodRead("token" + i, "x", {}, 1, async () => 0);
  await c.api.sharedEodRead("token0", "x", {}, 1, async () => 0);
  assert.equal(c.usageCalls.length, 82);
});

test("missing evidence RPC preflight stops before provider usage or acquisition", async () => {
  const { api, calls, usageCalls } = load({ preflight: false });
  let n = 0;
  await assert.rejects(
    () =>
      api.sharedEodEvidenceRead("A", "eod/TEST.US", {}, 1000, async () => {
        n++;
      }),
    /publisher/,
  );
  assert.equal(n, 0);
  assert.equal(usageCalls.length, 0);
  assert.equal(
    calls.filter((c) => c.name === "auryn_market_acquire").length,
    0,
  );
});

test("bulk shared cache requires acknowledged publication and applies short negative TTL", async () => {
  const h = load();
  await h.api.sharedEodBoundedRead(
    "B",
    "eod-bulk-last-day/US",
    {},
    (v) => (v.available ? 86400000 : 3600000),
    async () => ({ available: false, payload: null }),
  );
  assert.equal(
    h.calls.find((c) => c.name === "auryn_market_publish" && c.args.p_value)
      .args.p_ttl,
    3600,
  );
  const failed = load({ publishBulk: false });
  await assert.rejects(
    failed.api.sharedEodBoundedRead(
      "B",
      "eod-bulk-last-day/US",
      {},
      () => 1000,
      async () => ({ payload: "[]" }),
    ),
    /acknowledged/,
  );
  const huge = load();
  await assert.rejects(
    huge.api.sharedEodBoundedRead(
      "B",
      "eod-bulk-last-day/US",
      {},
      () => 1000,
      async () => ({ payload: "x".repeat(4 * 1024 * 1024) }),
    ),
    /bound/,
  );
});
