import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";

// Run the real EODHD/shared-cache/normalizer graph. Only external HTTP is
// replaced. The transport models Next 15's documented stale-while-revalidate
// contract when the request opts into its data cache.
function fixture(t, { guarded = true, legacy = false } = {}) {
  t.mock.timers.enable({
    apis: ["Date"],
    now: Date.parse("2026-11-13T14:00:00Z"),
  });
  const env = {
    EODHD_API_KEY: "fixture-eod",
    EODHD_API_TOKEN: undefined,
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "fixture-service",
    AURYN_SHARED_MARKET_GUARD: guarded ? "true" : undefined,
  };
  const previous = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const state = {
    target: 120,
    targetAttempts: 0,
    httpAttempts: 0,
    shared: null,
    limited: false,
    failed: false,
    options: [],
  };
  const framework = new Map();
  t.mock.method(globalThis, "fetch", async (input, options) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/auryn_market_acquire")) {
      const args = JSON.parse(options.body);
      assert.equal(args.p_cost, 10);
      assert.equal(args.p_cap, 8000);
      if (state.shared?.expires > Date.now())
        return Response.json({ status: "cached", value: state.shared.value });
      return Response.json({
        status: state.limited ? "limited" : "reserved",
        lease: "00000000-0000-4000-8000-000000000011",
      });
    }
    if (url.pathname.endsWith("/auryn_market_publish")) {
      const args = JSON.parse(options.body);
      state.shared = {
        value: args.p_value,
        expires: Date.now() + args.p_ttl * 1000,
      };
      return Response.json(true);
    }
    assert.equal(url.hostname, "eodhd.com");
    if (url.pathname === "/api/user")
      return Response.json({
        dailyRateLimit: 10000,
        apiRequests: 10,
        apiRequestsDate: "2026-11-13",
      });
    assert.match(url.pathname, /\/fundamentals\/TEST\.US$/);
    state.httpAttempts++;
    if (legacy && url.pathname.includes("/v1.1/"))
      return new Response("", { status: 403 });
    state.targetAttempts++;
    state.options.push(options);
    if (state.failed) return new Response("", { status: 503 });
    const payload = {
      General: {
        Code: "TEST",
        Exchange: "NASDAQ",
        CurrencyCode: "USD",
        UpdatedAt: "2026-11-12",
      },
      AnalystRatings: { TargetPrice: state.target },
    };
    const previous = framework.get(url.pathname);
    if (options.next?.revalidate) {
      framework.set(url.pathname, payload);
      if (previous) return Response.json(previous);
    }
    return Response.json(payload);
  });
  return {
    state,
    api: sourceModule("lib/eodhd.ts"),
    nextWorker: () => sourceModule("lib/eodhd.ts"),
  };
}

for (const legacy of [false, true]) {
  test(`guarded ${legacy ? "legacy" : "v1.1"} fundamentals do not republish a stale framework target after expiry`, async (t) => {
    const { state, api } = fixture(t, { legacy });
    assert.equal(
      (await api.eodFundamentals("TEST")).evidence.consensus.target,
      120,
    );
    state.target = 130;
    t.mock.timers.tick(21600001);
    const refreshed = await api.eodFundamentals("TEST");
    assert.equal(refreshed.evidence.consensus.target, 130);
    assert.equal(state.shared.value.AnalystRatings.TargetPrice, 130);
    assert.equal(
      refreshed.evidence.updatedAt,
      "2026-11-12",
      "refresh cannot manufacture a target revision date",
    );
    assert.equal(state.targetAttempts, 2);
    assert.equal(state.httpAttempts, legacy ? 4 : 2);
  });
}

test("the freshness fix retains local deduplication and shared cache hits across workers", async (t) => {
  const { state, api, nextWorker } = fixture(t);
  const first = await Promise.all([
    api.eodFundamentals("TEST"),
    api.eodFundamentals("TEST"),
  ]);
  assert.equal(first[0].evidence.consensus.target, 120);
  assert.equal(first[1].evidence.consensus.target, 120);
  state.target = 130;
  const cached = await nextWorker().eodFundamentals("TEST");
  assert.equal(cached.evidence.consensus.target, 120);
  assert.equal(
    state.targetAttempts,
    1,
    "fresh shared data does not consume another provider request",
  );
});

test("an expired target cannot bypass the shared daily budget to refresh", async (t) => {
  const { state, api } = fixture(t);
  await api.eodFundamentals("TEST");
  t.mock.timers.tick(21600001);
  state.limited = true;
  await assert.rejects(api.eodFundamentals("TEST"), /shared daily budget/);
  assert.equal(state.targetAttempts, 1);
});

test("a failed refresh is not republished as a newly fresh old target and remains retryable", async (t) => {
  const { state, api } = fixture(t);
  await api.eodFundamentals("TEST");
  t.mock.timers.tick(21600001);
  state.failed = true;
  await assert.rejects(api.eodFundamentals("TEST"), /could not return/);
  assert.equal(state.shared.value, null);
  state.failed = false;
  state.target = 130;
  assert.equal(
    (await api.eodFundamentals("TEST")).evidence.consensus.target,
    130,
  );
});

test("unguarded deployments retain their existing framework cache policy", async (t) => {
  const { state, api } = fixture(t, { guarded: false });
  await api.eodFundamentals("TEST");
  assert.equal(state.options[0].next.revalidate, 21600);
  assert.equal(state.options[0].cache, undefined);
});
