import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function load(extra = {}) {
  if (!fs.existsSync("lib/sentisense-provider.ts")) return {};
  const code = ts.transpileModule(
    fs.readFileSync("lib/sentisense-provider.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) =>
      name in extra
        ? extra[name]
        : name === "server-only"
          ? {}
          : name === "./sentisense-targets.ts"
            ? require("../lib/sentisense-targets.ts")
            : require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const emptyCache = { read: async () => null, write: async () => {} };
const now = Date.parse("2026-11-14T00:00:00Z");
const configuration = () => ({
  AURYN_SENTISENSE_PREVIEW_ENABLED: "true",
  VERCEL_ENV: "preview",
  NODE_ENV: "production",
  SENTISENSE_API_KEY: "test-secret-not-real",
  SENTISENSE_KEY_EXPIRES_AT: "2026-11-16T00:00:00Z",
});
const research = (symbol = "IREN") => ({
  company: { symbol, currency: "USD", assetType: "stock" },
  quote: { price: 21, currency: "USD" },
  retrievedAt: new Date(now).toISOString(),
  facts: [],
  history: [],
  filings: [],
  issues: [],
  evidence: {
    source: "EODHD",
    updatedAt: "2026-11-13",
    consensus: { target: 40, strongBuy: 5 },
  },
});
function setup(options = {}) {
  const api = load();
  assert.equal(typeof api.createSentiSenseClient, "function");
  let time = now;
  const calls = [],
    reservations = [],
    sleeps = [];
  const rows = new Map();
  const client = api.createSentiSenseClient({
    cache: options.cache ?? {
      read: async (key) => rows.get(key) ?? null,
      write: async (key, value, until) => {
        rows.set(key, { value, until });
      },
    },
    guard: api.createSentiSenseDenialGuard(denialStore()),
    now: () => time,
    sleep: async (ms) => {
      sleeps.push(ms);
      time += ms;
      options.onSleep?.(ms);
    },
    reserve: async (key, max, windowMs) => {
      reservations.push({ key, max, windowMs });
      if (options.deny?.(max, windowMs))
        throw Error("test-secret-not-real reserve detail");
    },
    transport: async (url, init) => {
      calls.push({ url, init, at: time });
      if (options.throw) throw Error("test-secret-not-real upstream detail");
      if (options.status)
        return new Response("private provider body", {
          status: options.status,
        });
      const symbol = decodeURIComponent(
        new URL(url).pathname.split("/").at(-2),
      );
      return Response.json(
        new URL(url).pathname.endsWith("/profile")
          ? {
              ticker: symbol,
              currency: "usd",
              country: "United States",
              primaryExchange: "XNAS",
            }
          : {
              isPreview: true,
              data: {
                ticker: options.wrongSymbol ? "BRK.B" : symbol,
                targetLow: 23,
                targetMean: 56.6874,
                targetHigh: 139,
                numberOfAnalysts: 19,
                updatedAt: "2026-11-13T23:37:41Z",
                updatedAtEpoch: 1794613061,
                currentPrice: 18.17,
                strongBuy: 0,
                buy: 0,
                hold: 0,
                sell: 0,
                strongSell: 0,
              },
            },
      );
    },
  });
  return {
    api,
    client,
    calls,
    reservations,
    sleeps,
    advance: (ms) => (time += ms),
  };
}

test("private preview gate never contacts provider for production, nonowners, missing key, unbounded or expired keys", async () => {
  const f = setup(),
    r = research();
  for (const override of [
    { AURYN_SENTISENSE_PREVIEW_ENABLED: undefined },
    { VERCEL_ENV: "production" },
    { VERCEL_ENV: undefined },
    { SENTISENSE_API_KEY: undefined },
    { SENTISENSE_KEY_EXPIRES_AT: undefined },
    { SENTISENSE_KEY_EXPIRES_AT: "2026-11-13T23:59:59Z" },
    { SENTISENSE_KEY_EXPIRES_AT: "2027-01-01T00:00:00Z" },
    { SENTISENSE_KEY_EXPIRES_AT: "2026-11-31T00:00:00Z" },
    { NODE_ENV: "development" },
  ]) {
    assert.equal(
      await f.client.enrich(
        r,
        { owner: true },
        { ...configuration(), ...override },
      ),
      r,
    );
  }
  assert.equal(await f.client.enrich(r, { owner: false }, configuration()), r);
  assert.equal(f.calls.length, 0);
  assert.equal(f.reservations.length, 0);
  assert.equal(
    await f.client
      .enrich(
        { ...r, company: { ...r.company, assetType: "crypto" } },
        { owner: true },
        configuration(),
      )
      .then((x) => x.analystTargets),
    undefined,
  );
});

test("successful targets survive cold clients without spending another upstream allowance", async () => {
  const rows = new Map();
  const cache = {
    read: async (key) => rows.get(key) ?? null,
    write: async (key, value, until) => rows.set(key, { value, until }),
  };
  const first = setup({ cache });
  const a = await first.client.getTargets(
    "IREN",
    { owner: true },
    configuration(),
  );
  assert.ok(a);
  assert.equal(first.calls.length, 2);
  const cold = setup({ cache, deny: () => true });
  cold.advance(8000);
  const b = await cold.client.getTargets(
    "IREN",
    { owner: true },
    configuration(),
  );
  assert.deepEqual(b, a);
  assert.equal(cold.calls.length, 0);
  assert.equal(cold.reservations.length, 0);
  assert.equal(rows.size, 1);
  assert.ok([...rows.keys()].every((k) => !k.includes("test-secret-not-real")));
  assert.ok([...rows.values()][0].until <= now + 86400000 + 7200);
});

test("shared targets never cross preview ownership, key identity, expiry or freshness gates", async () => {
  const rows = new Map();
  let reads = 0;
  const cache = {
    read: async (key) => {
      reads++;
      return rows.get(key) ?? null;
    },
    write: async (key, value, until) => rows.set(key, { value, until }),
  };
  const first = setup({ cache });
  await first.client.getTargets("IREN", { owner: true }, configuration());
  const before = reads;
  const cold = setup({ cache, deny: () => true });
  assert.equal(
    await cold.client.getTargets("IREN", { owner: false }, configuration()),
    null,
  );
  assert.equal(
    await cold.client.getTargets(
      "IREN",
      { owner: true },
      { ...configuration(), VERCEL_ENV: "production" },
    ),
    null,
  );
  assert.equal(reads, before);
  assert.equal(
    await cold.client.getTargets(
      "IREN",
      { owner: true },
      { ...configuration(), SENTISENSE_API_KEY: "other-key" },
    ),
    null,
  );
  const row = [...rows.values()][0];
  row.until = now + 3600000;
  row.value.updatedAt = "2020-01-01T00:00:00Z";
  assert.equal(
    await setup({ cache, deny: () => true }).client.getTargets(
      "IREN",
      { owner: true },
      configuration(),
    ),
    null,
  );
  row.value.updatedAt = "2026-11-13T23:37:41Z";
  row.until = now - 1;
  assert.equal(
    await setup({ cache, deny: () => true }).client.getTargets(
      "IREN",
      { owner: true },
      configuration(),
    ),
    null,
  );
  const expired = setup({ cache });
  expired.advance(3 * 86400000);
  const n = reads;
  assert.equal(
    await expired.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  assert.equal(reads, n);
});

test("shared cache failures and missing ranges are never persisted as successful targets", async () => {
  let writes = 0;
  const cache = {
    read: async () => {
      throw Error("missing migration");
    },
    write: async () => {
      writes++;
      throw Error("write unavailable");
    },
  };
  const failure = setup({ cache, status: 503 });
  assert.equal(
    await failure.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  assert.equal(writes, 0);
  const valid = setup({ cache });
  assert.equal(
    await valid.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  assert.equal(writes, 0);
  assert.equal(valid.calls.length, 0);
});

test("an explicitly opted-in local development preview can enrich without changing original research", async () => {
  const f = setup(),
    r = research();
  const env = {
    ...configuration(),
    VERCEL_ENV: undefined,
    NODE_ENV: "development",
    AURYN_SENTISENSE_LOCAL_PREVIEW: "true",
  };
  const result = await f.client.enrich(r, { owner: true }, env);
  assert.equal(result.analystTargets.target, 56.6874);
  assert.equal(result.evidence, r.evidence);
  assert.equal(result.quote, r.quote);
  assert.equal(result.history, r.history);
  assert.equal(result.facts, r.facts);
  assert.equal(r.analystTargets, undefined);
});

test("cold enrichment reserves both upstream requests and serializes them at least 7.2 seconds apart", async () => {
  const f = setup(),
    result = await f.client.enrich(
      research(),
      { owner: true },
      configuration(),
    );
  assert.equal(result.analystTargets.low, 23);
  assert.equal(f.calls.length, 2);
  assert.equal(f.reservations.length, 4);
  assert.ok(f.calls[1].at - f.calls[0].at >= 7200);
  assert.deepEqual(
    f.reservations.map((x) => [x.max, x.windowMs]),
    [
      [1, 7100],
      [24, 86400000],
      [1, 7100],
      [24, 86400000],
    ],
  );
  assert.ok(
    f.reservations.every(
      (x) =>
        !x.key.includes("test-secret") &&
        /^sentisense:[a-f0-9]{64}:(burst|day)$/.test(x.key),
    ),
  );
  for (const { url, init } of f.calls) {
    assert.equal(new URL(url).origin, "https://app.sentisense.ai");
    assert.equal(new URL(url).search, "");
    assert.equal(init.headers["X-SentiSense-API-Key"], "test-secret-not-real");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
  }
  assert.deepEqual(
    f.calls.map((x) => new URL(x.url).pathname),
    ["/api/v1/stocks/IREN/profile", "/api/v1/analyst/IREN/consensus"],
  );
});

test("same-key requests coalesce and cache for 24h while distinct symbols share a queue and request budget", async () => {
  const f = setup(),
    env = configuration(),
    r = research();
  const [a, b] = await Promise.all([
    f.client.enrich(r, { owner: true }, env),
    f.client.enrich(r, { owner: true }, env),
  ]);
  assert.deepEqual(a.analystTargets, b.analystTargets);
  assert.equal(f.calls.length, 2);
  f.advance(23 * 3600000);
  assert.ok((await f.client.enrich(r, { owner: true }, env)).analystTargets);
  assert.equal(f.calls.length, 2);
  await Promise.all([
    f.client.enrich(research("NOW"), { owner: true }, env),
    f.client.enrich(research("NFLX"), { owner: true }, env),
  ]);
  assert.equal(f.calls.length, 6);
  for (let i = 1; i < f.calls.length; i++)
    assert.ok(f.calls[i].at - f.calls[i - 1].at >= 7200);
  f.advance(2 * 3600000);
  await f.client.enrich(r, { owner: true }, env);
  assert.equal(f.calls.length, 8);
});

test("every request fails closed if the shared reservation is denied, including the second request", async () => {
  for (const max of [1, 24]) {
    const f = setup({ deny: (n) => n === max }),
      r = research();
    assert.equal(await f.client.enrich(r, { owner: true }, configuration()), r);
    assert.equal(f.calls.length, 0);
  }
  let budgets = 0;
  const f = setup({ deny: (n) => n === 24 && ++budgets === 2 }),
    r = research();
  assert.equal(await f.client.enrich(r, { owner: true }, configuration()), r);
  assert.equal(f.calls.length, 1);
});

test("provider denials are not retried and their bodies and credentials never enter research", async () => {
  for (const status of [401, 403, 429]) {
    const f = setup({ status }),
      r = research(),
      env = configuration();
    assert.equal(await f.client.enrich(r, { owner: true }, env), r);
    assert.equal(f.calls.length, 1);
    assert.equal(
      await f.client
        .enrich(research("NOW"), { owner: true }, env)
        .then((x) => x.analystTargets),
      undefined,
    );
    assert.equal(f.calls.length, 1);
    assert.ok(!JSON.stringify(r).includes("test-secret"));
  }
  const f = setup({ throw: true }),
    r = research();
  assert.equal(await f.client.enrich(r, { owner: true }, configuration()), r);
  assert.equal(f.calls.length, 1);
});

test("expiry is rechecked after queue waits and before cached data can be served", async () => {
  const f = setup(),
    r = research(),
    env = {
      ...configuration(),
      SENTISENSE_KEY_EXPIRES_AT: "2026-11-14T00:00:05Z",
    };
  assert.equal(await f.client.enrich(r, { owner: true }, env), r);
  assert.equal(f.calls.length, 1);
  const g = setup();
  await g.client.enrich(r, { owner: true }, configuration());
  g.advance(49 * 3600000);
  assert.equal(await g.client.enrich(r, { owner: true }, configuration()), r);
  assert.equal(g.calls.length, 2);
});

test("a provider share-class mismatch preserves all original EOD data", async () => {
  const f = setup({ wrongSymbol: true }),
    r = research("BRK.A");
  assert.equal(await f.client.enrich(r, { owner: true }, configuration()), r);
  assert.equal(r.evidence.consensus.target, 40);
  assert.equal(r.evidence.consensus.strongBuy, 5);
});

test("24 upstream calls exhaust the shared daily allowance even across fresh client instances", async () => {
  const api = load();
  let time = now,
    calls = 0;
  const ledger = new Map();
  const reserve = async (key, max, windowMs) => {
    const old = ledger.get(key);
    if (old && old.until > time) {
      if (old.count >= max) throw Error("denied");
      old.count++;
    } else ledger.set(key, { count: 1, until: time + windowMs });
  };
  const dependencies = {
    cache: emptyCache,
    guard: api.createSentiSenseDenialGuard(denialStore()),
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
    reserve,
    transport: async (url) => {
      calls++;
      const symbol = new URL(url).pathname.split("/").at(-2);
      return Response.json(
        url.endsWith("/profile")
          ? { ticker: symbol, currency: "usd", primaryExchange: "XNYS" }
          : {
              ticker: symbol,
              targetLow: 10,
              targetMean: 15,
              targetHigh: 20,
              numberOfAnalysts: 2,
              updatedAt: "2026-11-13T23:37:41Z",
            },
      );
    },
  };
  const client = api.createSentiSenseClient(dependencies),
    env = configuration();
  for (let i = 0; i < 12; i++)
    assert.ok(
      (await client.enrich(research(`TEST${i}`), { owner: true }, env))
        .analystTargets,
    );
  assert.equal(calls, 24);
  time += 7200;
  const fresh = api.createSentiSenseClient(dependencies),
    r = research("EXTRA");
  assert.equal(await fresh.enrich(r, { owner: true }, env), r);
  assert.equal(calls, 24);
});

test("simultaneous cold clients sharing a key cannot burst through the shared reservation", async () => {
  const api = load();
  let calls = 0,
    time = now;
  const ledger = new Map();
  const dependencies = {
    cache: emptyCache,
    guard: api.createSentiSenseDenialGuard(denialStore()),
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
    reserve: async (key, max, windowMs) => {
      const old = ledger.get(key);
      if (old && old.until > time) {
        if (old.count >= max) throw Error("denied");
        old.count++;
      } else ledger.set(key, { count: 1, until: time + windowMs });
    },
    transport: async () => {
      calls++;
      return new Response("denial", { status: 403 });
    },
  };
  const a = api.createSentiSenseClient(dependencies),
    b = api.createSentiSenseClient(dependencies),
    r = research(),
    env = configuration();
  const values = await Promise.all([
    a.enrich(r, { owner: true }, env),
    b.enrich(r, { owner: true }, env),
  ]);
  assert.equal(calls, 1);
  assert.ok(values.every((x) => x === r));
});

function denialStore() {
  const values = new Map();
  return {
    values,
    async claim(key, ticket, expiresAt, at) {
      const prior = values.get(key);
      if (prior && prior.expiresAt > at) return false;
      values.set(key, { ticket, expiresAt });
      return true;
    },
    async release(key, ticket) {
      if (values.get(key)?.ticket === ticket) values.delete(key);
    },
    async extend(key, ticket, until) {
      if (values.get(key)?.ticket === ticket) values.get(key).expiresAt = until;
    },
  };
}
test("durable denial latch blocks cold clients after burst and daily windows until temporary key expiry", async () => {
  const api = load();
  assert.equal(typeof api.createSentiSenseDenialGuard, "function");
  for (const status of [401, 403, 429]) {
    const store = denialStore();
    let time = now,
      calls = 0;
    const dependency = () => ({
      cache: emptyCache,
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      reserve: async () => {},
      guard: api.createSentiSenseDenialGuard(store),
      transport: async () => {
        calls++;
        return new Response("denied", { status });
      },
    });
    const env = configuration(),
      r = research();
    assert.equal(
      await api
        .createSentiSenseClient(dependency())
        .enrich(r, { owner: true }, env),
      r,
    );
    time += 25 * 3600000;
    assert.equal(
      await api
        .createSentiSenseClient(dependency())
        .enrich(research("NOW"), { owner: true }, env)
        .then((x) => x.analystTargets),
      undefined,
    );
    assert.equal(calls, 1);
    assert.equal(store.values.size, 1);
    assert.ok([...store.values.keys()].every((x) => /^[a-f0-9]{64}$/.test(x)));
  }
});
test("guard claim errors fail closed and uncertain transport outcomes leave a durable latch", async () => {
  const api = load();
  assert.equal(typeof api.createSentiSenseDenialGuard, "function");
  let calls = 0;
  const denied = api.createSentiSenseClient({
    cache: emptyCache,
    reserve: async () => {},
    now: () => now,
    guard: api.createSentiSenseDenialGuard({
      claim: async () => {
        throw Error("database unavailable");
      },
      release: async () => {},
    }),
    transport: async () => {
      calls++;
      return Response.json({});
    },
  });
  const r = research(),
    env = configuration();
  assert.equal(await denied.enrich(r, { owner: true }, env), r);
  assert.equal(calls, 0);
  const store = denialStore();
  let time = now;
  const dependencies = {
    cache: emptyCache,
    reserve: async () => {},
    now: () => time,
    guard: api.createSentiSenseDenialGuard(store),
    transport: async () => {
      calls++;
      throw Error("response outcome unknown");
    },
  };
  await api
    .createSentiSenseClient(dependencies)
    .enrich(r, { owner: true }, env);
  time += 8000;
  await api
    .createSentiSenseClient(dependencies)
    .enrich(r, { owner: true }, env);
  assert.equal(calls, 1);
});

test("the default hosted guard uses atomic shared table claims across cold clients", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role bypassrls;",
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261107140000_auryn_shared_request_limits.sql",
        "utf8",
      ),
    );
    const accessDb = () => ({
      from(table) {
        assert.equal(table, "auryn_request_limits");
        return {
          insert: async (row) => {
            assert.match(row.key, /^[a-f0-9]{64}$/);
            try {
              await db.query(
                "insert into auryn_request_limits(key,count,expires_at) values($1,$2,$3)",
                [row.key, row.count, row.expires_at],
              );
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          delete() {
            const values = [],
              conditions = [];
            const chain = {
              eq(column, value) {
                assert.ok(["key", "count"].includes(column));
                values.push(value);
                conditions.push(`${column}=$${values.length}`);
                return chain;
              },
              lte(column, value) {
                assert.equal(column, "expires_at");
                values.push(value);
                conditions.push(`${column}<=$${values.length}`);
                return chain;
              },
              then(resolve, reject) {
                return db
                  .query(
                    `delete from auryn_request_limits where ${conditions.join(" and ")}`,
                    values,
                  )
                  .then(
                    () => ({ error: null }),
                    (error) => ({ error }),
                  )
                  .then(resolve, reject);
              },
            };
            return chain;
          },
        };
      },
    });
    const api = load({ "./access-server": { accessDb } });
    let calls = 0,
      time = now;
    const deps = {
      cache: emptyCache,
      now: () => time,
      reserve: async () => {},
      transport: async () => {
        calls++;
        return new Response("denied", { status: 429 });
      },
    };
    const env = configuration();
    await Promise.all([
      api.createSentiSenseClient(deps).enrich(research(), { owner: true }, env),
      api
        .createSentiSenseClient(deps)
        .enrich(research("NOW"), { owner: true }, env),
    ]);
    assert.equal(calls, 1);
    time += 25 * 3600000;
    await load({ "./access-server": { accessDb } })
      .createSentiSenseClient(deps)
      .enrich(research("APP"), { owner: true }, env);
    assert.equal(calls, 1);
    const rows = (
      await db.query("select key,count,expires_at from auryn_request_limits")
    ).rows;
    assert.equal(rows.length, 1);
    assert.equal(
      new Date(rows[0].expires_at).toISOString(),
      "2026-11-16T00:00:00.000Z",
    );
  } finally {
    await db.close();
  }
});

test("a delayed release cannot remove a newer denial latch", async () => {
  const api = load(),
    store = denialStore(),
    guard = api.createSentiSenseDenialGuard(store);
  const releaseOld = await guard("identity", 10, 0);
  const releaseNew = await guard("identity", 20, 11);
  await releaseOld();
  assert.equal(store.values.size, 1);
  await releaseNew();
  assert.equal(store.values.size, 0);
});

test("key expiry during a slow guard acquisition prevents transport", async () => {
  const api = load();
  let time = now,
    calls = 0,
    releases = 0;
  const client = api.createSentiSenseClient({
    cache: emptyCache,
    now: () => time,
    reserve: async () => {},
    guard: async () => {
      time += 6000;
      return async () => {
        releases++;
      };
    },
    transport: async () => {
      calls++;
      return Response.json({});
    },
  });
  const r = research();
  assert.equal(
    await client.enrich(
      r,
      { owner: true },
      { ...configuration(), SENTISENSE_KEY_EXPIRES_AT: "2026-11-14T00:00:05Z" },
    ),
    r,
  );
  assert.equal(calls, 0);
  assert.equal(releases, 1);
});

test("a known temporary server error does not hide recovered analyst targets for a full day", async () => {
  const options = { status: 503 };
  const f = setup(options),
    r = research(),
    env = configuration();
  assert.equal(await f.client.enrich(r, { owner: true }, env), r);
  assert.equal(f.calls.length, 1);
  options.status = 0;
  f.advance(4 * 60_000);
  assert.equal(await f.client.enrich(r, { owner: true }, env), r);
  assert.equal(f.calls.length, 1, "do not hot-loop on temporary failures");
  f.advance(61_000);
  const recovered = await f.client.enrich(r, { owner: true }, env);
  assert.deepEqual(
    [
      recovered.analystTargets?.low,
      recovered.analystTargets?.target,
      recovered.analystTargets?.high,
    ],
    [23, 56.6874, 139],
  );
  assert.equal(f.calls.length, 3);
  assert.equal(
    f.reservations.filter((x) => x.max === 24).length,
    3,
    "recovery still consumes the existing daily budget",
  );
});

test("a local negative result cannot hide a later valid shared observation", async () => {
  const rows = new Map();
  const cache = {
    read: async (key) => rows.get(key) ?? null,
    write: async (key, value, until) => rows.set(key, { value, until }),
  };
  const failed = setup({ cache, status: 503 });
  assert.equal(
    await failed.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  const successful = setup({ cache });
  const observed = await successful.client.getTargets(
    "IREN",
    { owner: true },
    configuration(),
  );
  failed.advance(8000);
  assert.deepEqual(
    await failed.client.getTargets("IREN", { owner: true }, configuration()),
    observed,
  );
  assert.equal(
    failed.calls.length,
    1,
    "reuse observation, never retry failed transport",
  );
});

test("warm targets cannot bypass a shared denial or unavailable cache", async () => {
  const rows = new Map();
  let blocked = false;
  let unavailable = false;
  const cache = {
    read: async (key) => {
      if (unavailable) throw Error("unavailable");
      return blocked ? null : (rows.get(key) ?? null);
    },
    write: async (key, value, until) => rows.set(key, { value, until }),
  };
  const f = setup({ cache });
  assert.ok(
    await f.client.getTargets("IREN", { owner: true }, configuration()),
  );
  blocked = true;
  assert.equal(
    await f.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  blocked = false;
  unavailable = true;
  assert.equal(
    await f.client.getTargets("IREN", { owner: true }, configuration()),
    null,
  );
  assert.equal(
    f.calls.length,
    2,
    "no network retry from a warm but blocked observation",
  );
});

test("explicit Pro mode supports authenticated preview and production without trial expiry", async () => {
  for (const environment of ["preview", "production"]) {
    const f = setup();
    const env = {
      ...configuration(),
      VERCEL_ENV: environment,
      AURYN_SENTISENSE_MODE: "pro",
      SENTISENSE_KEY_EXPIRES_AT: "2020-01-01T00:00:00Z",
      AURYN_SENTISENSE_PREVIEW_ENABLED: "false",
    };
    assert.equal(
      await f.client.getTargets("IREN", { owner: false }, env),
      null,
    );
    assert.equal(f.calls.length, 0);
    const result = await f.client.getTargets(
      "IREN",
      { owner: false, authenticated: true },
      env,
    );
    assert.equal(result?.target, 56.6874);
    assert.equal(f.calls.length, 2);
    assert.ok(
      !f.reservations.some((r) => r.max === 24),
      "paid mode has no trial daily cap",
    );
    assert.ok(
      f.reservations.some((r) => r.max === 240 && r.windowMs === 60000),
    );
    assert.ok(f.calls[1].at - f.calls[0].at >= 250);
  }
});
test("unknown Pro mode and nonhosted paid access fail closed", async () => {
  for (const override of [
    { AURYN_SENTISENSE_MODE: "unknown" },
    { AURYN_SENTISENSE_MODE: "pro", VERCEL_ENV: undefined },
    { AURYN_SENTISENSE_MODE: "pro", SENTISENSE_API_KEY: "" },
  ]) {
    const f = setup();
    assert.equal(
      await f.client.getTargets(
        "IREN",
        { owner: true, authenticated: true },
        { ...configuration(), ...override },
      ),
      null,
    );
    assert.equal(f.calls.length, 0);
  }
});
test("Pro targets never share trial cache identity and expire within an hour", async () => {
  const rows = new Map();
  const cache = {
    read: async (k) => rows.get(k) ?? null,
    write: async (k, value, until) => rows.set(k, { value, until }),
  };
  const trial = setup({ cache });
  await trial.client.getTargets("IREN", { owner: true }, configuration());
  const paid = setup({ cache });
  await paid.client.getTargets(
    "IREN",
    { owner: false, authenticated: true },
    { ...configuration(), AURYN_SENTISENSE_MODE: "pro" },
  );
  assert.equal(paid.calls.length, 2);
  assert.equal(rows.size, 2);
  assert.ok([...rows.values()].some((r) => r.until <= now + 3600000 + 1000));
});

test("Pro rate denial honors a longer Retry-After through shared latch extension", async () => {
  const api = load();
  let time = now,
    calls = 0,
    extended = 0;
  const store = denialStore();
  store.extend = async (key, ticket, until) => {
    const row = store.values.get(key);
    assert.equal(row.ticket, ticket);
    row.expiresAt = until;
    extended = until;
  };
  const deps = {
    cache: emptyCache,
    now: () => time,
    reserve: async () => {},
    guard: api.createSentiSenseDenialGuard(store),
    transport: async () => {
      calls++;
      return new Response("", {
        status: 429,
        headers: { "Retry-After": "3600" },
      });
    },
  };
  const env = { ...configuration(), AURYN_SENTISENSE_MODE: "pro" },
    access = { owner: false, authenticated: true };
  await api.createSentiSenseClient(deps).getTargets("IREN", access, env);
  assert.equal(extended, now + 3600000);
  time += 30 * 60000;
  await api.createSentiSenseClient(deps).getTargets("APP", access, env);
  assert.equal(calls, 1, "cold instance respects extended shared latch");
  time += 31 * 60000;
  await api.createSentiSenseClient(deps).getTargets("APP", access, env);
  assert.equal(calls, 2);
});
test("Pro denials leave a bounded shared cooldown instead of trial key-expiry lock", async () => {
  const api = load();
  const store = denialStore();
  let time = now,
    calls = 0;
  const deps = {
    cache: emptyCache,
    now: () => time,
    reserve: async () => {},
    guard: api.createSentiSenseDenialGuard(store),
    transport: async () => {
      calls++;
      return new Response("", { status: 403 });
    },
  };
  const env = {
      ...configuration(),
      AURYN_SENTISENSE_MODE: "pro",
      SENTISENSE_KEY_EXPIRES_AT: "2020-01-01T00:00:00Z",
    },
    access = { owner: false, authenticated: true };
  await api.createSentiSenseClient(deps).getTargets("IREN", access, env);
  time += 14 * 60000;
  await api.createSentiSenseClient(deps).getTargets("APP", access, env);
  assert.equal(calls, 1);
  time += 2 * 60000;
  await api.createSentiSenseClient(deps).getTargets("APP", access, env);
  assert.equal(calls, 2);
});

test("failed Pro enrichment cannot leak an attached owner-trial target", async () => {
  const source = setup();
  const trial = await source.client.enrich(
    research(),
    { owner: true },
    configuration(),
  );
  const paid = setup({ deny: () => true });
  const result = await paid.client.enrich(
    trial,
    { owner: false, authenticated: true },
    { ...configuration(), AURYN_SENTISENSE_MODE: "pro" },
  );
  assert.equal(result.analystTargets, undefined);
  assert.equal(result.evidence, trial.evidence);
  assert.ok(trial.analystTargets, "do not mutate caller input");
});

test("Pro paid isolation strips inherited trial targets even on unsupported assets", async () => {
  const f = setup();
  const trial = await f.client.enrich(
    research(),
    { owner: true },
    configuration(),
  );
  trial.company.currency = "EUR";
  assert.equal(
    (
      await f.client.enrich(
        trial,
        { owner: false, authenticated: true },
        { ...configuration(), AURYN_SENTISENSE_MODE: "pro" },
      )
    ).analystTargets,
    undefined,
  );
});
test("Pro optional deadline includes slow queue work and starts no deferred network", async () => {
  const api = load();
  let time = now,
    calls = 0,
    reserves = 0;
  const client = api.createSentiSenseClient({
    cache: emptyCache,
    now: () => time,
    reserve: async () => {
      reserves++;
      time += 3100;
    },
    guard: async () => async () => {},
    transport: async () => {
      calls++;
      return Response.json({});
    },
  });
  const env = { ...configuration(), AURYN_SENTISENSE_MODE: "pro" };
  assert.equal(
    await client.getTargets("IREN", { owner: false, authenticated: true }, env),
    null,
  );
  assert.equal(calls, 0);
  assert.equal(reserves, 1);
});
test("Pro optional deadline aborts in-flight transport and does not start consensus", async () => {
  const api = load();
  let calls = 0,
    aborted = false;
  const client = api.createSentiSenseClient({
    cache: emptyCache,
    now: () => now,
    reserve: async () => {},
    guard: async () => async () => {},
    transport: async (_url, { signal }) => {
      calls++;
      return new Promise((_resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(Error("aborted"));
          },
          { once: true },
        ),
      );
    },
  });
  const start = Date.now();
  assert.equal(
    await client.getTargets(
      "IREN",
      { owner: false, authenticated: true },
      { ...configuration(), AURYN_SENTISENSE_MODE: "pro" },
    ),
    null,
  );
  assert.ok(Date.now() - start < 4000);
  assert.equal(calls, 1);
  assert.equal(aborted, true);
});

test("coalesced Pro callers share the bounded deadline when cache read stalls", async () => {
  const api = load();
  let complete,
    calls = 0;
  const cache = {
    read: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
    write: async () => {},
  };
  const client = api.createSentiSenseClient({
    cache,
    now: () => now,
    reserve: async () => {},
    transport: async () => {
      calls++;
      return Response.json({});
    },
  });
  const access = { owner: false, authenticated: true },
    env = { ...configuration(), AURYN_SENTISENSE_MODE: "pro" };
  const start = Date.now();
  const a = client.getTargets("IREN", access, env),
    b = client.getTargets("IREN", access, env);
  assert.deepEqual(await Promise.all([a, b]), [null, null]);
  assert.ok(Date.now() - start < 4000);
  complete(null);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(calls, 0, "late cache completion cannot start upstream");
});

test("uncertain Pro transport pauses cold instances for one minute, not fifteen", async () => {
  const api = load(), store = denialStore();
  let time = now, calls = 0;
  const deps = { cache:emptyCache, now:()=>time, reserve:async()=>{}, guard:api.createSentiSenseDenialGuard(store), transport:async()=>{calls++;throw Error("network timeout");} };
  const env = {...configuration(), AURYN_SENTISENSE_MODE:"pro"};
  const access = {owner:false,authenticated:true};
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  time += 30_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  assert.equal(calls,1);
  time += 31_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  assert.equal(calls,2);
});

test("failed Pro response body read receives the transient cooldown, not a denial lock", async () => {
  const api = load(), store = denialStore();
  let time = now, calls = 0;
  const deps = { cache:emptyCache, now:()=>time, reserve:async()=>{}, guard:api.createSentiSenseDenialGuard(store), transport:async()=>{
    calls++;
    return { status:200,ok:true,text:async()=>{throw Error("body interrupted");} };
  } };
  const env = {...configuration(), AURYN_SENTISENSE_MODE:"pro"};
  const access = {owner:false,authenticated:true};
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  time += 30_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  assert.equal(calls,1);
  time += 31_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env);
  assert.equal(calls,2);
});

test("Pro deadline after headers aborts the body and shortens only its transient latch", async () => {
  const api = load(), store = denialStore();
  let time = now, calls = 0, bodyAborted = false;
  const deps = { cache:emptyCache, now:()=>time, reserve:async()=>{}, guard:api.createSentiSenseDenialGuard(store), transport:async(_url,{signal})=>{
    calls++;
    return {status:200,ok:true,text:()=>new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>{bodyAborted=true;reject(Error("body aborted"));},{once:true}))};
  } };
  const env = {...configuration(), AURYN_SENTISENSE_MODE:"pro"};
  const access = {owner:false,authenticated:true};
  await api.createSentiSenseClient(deps).getTargets("APP",access,env,{budgetMs:20});
  await new Promise(setImmediate);
  assert.equal(bodyAborted,true);
  time += 30_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env,{budgetMs:20});
  assert.equal(calls,1);
  time += 31_000;
  await api.createSentiSenseClient(deps).getTargets("APP",access,env,{budgetMs:20});
  assert.equal(calls,2);
});
