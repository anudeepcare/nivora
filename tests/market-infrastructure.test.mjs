import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createHash } from "node:crypto";
import * as checkpoints from "../lib/market-checkpoints.ts";
import * as exposure from "../lib/exposure-board.ts";

const signingKey = "test-key-".repeat(8);
function load(file, bindings) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", "process", code)(
    (name) => {
      assert.ok(name in bindings, `Unexpected dependency ${name}`);
      return bindings[name];
    },
    module,
    module.exports,
    { env: { AURYN_MARKET_SNAPSHOT_SIGNING_KEY: signingKey } },
  );
  return module.exports;
}
class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const day = (time) => new Date(time).toISOString().slice(0, 10);
function store() {
  const state = {
    baseline: null,
    events: new Map(),
    observations: [],
    writes: [],
    failEvent: false,
    race: null,
  };
  const db = {
    from(table) {
      const q = {
        mode: "select",
        filters: [],
        row: null,
        single: false,
        select() {
          return this;
        },
        eq(k, v) {
          this.filters.push([k, v]);
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        maybeSingle() {
          this.single = true;
          return this;
        },
        insert(row) {
          this.mode = "insert";
          this.row = row;
          return this;
        },
        update(row) {
          this.mode = "update";
          this.row = row;
          return this;
        },
        upsert(row) {
          this.mode = "upsert";
          this.row = row;
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve()
            .then(() => {
              if (table === "auryn_observations") {
                if (this.mode === "upsert") {
                  state.observations.push(this.row);
                  return { data: [this.row], error: null };
                }
                return { data: state.observations, error: null };
              }
              if (table === "auryn_alert_events") {
                if (state.failEvent) {
                  state.failEvent = false;
                  return {
                    data: null,
                    error: { message: "temporary failure" },
                  };
                }
                const id = this.row.event_key;
                if (state.events.has(id)) return { data: [], error: null };
                state.events.set(id, this.row);
                return { data: [{ id }], error: null };
              }
              assert.equal(table, "auryn_documents");
              if (this.mode === "select")
                return {
                  data: state.baseline ? structuredClone(state.baseline) : null,
                  error: null,
                };
              if (this.mode === "update" && state.race) {
                state.race();
                state.race = null;
              }
              if (this.mode === "insert" && state.baseline)
                return { data: null, error: { code: "23505" } };
              if (
                this.mode === "update" &&
                !this.filters.every(([k, v]) => state.baseline?.[k] === v)
              )
                return { data: [], error: null };
              state.baseline = structuredClone(this.row);
              state.writes.push(this.row);
              return {
                data: [{ updated_at: this.row.updated_at }],
                error: null,
              };
            })
            .then(resolve, reject);
        },
      };
      return q;
    },
  };
  return { state, db };
}
function snapshot({
  id = "new",
  price = 101,
  time = Date.now() - 1000,
  observed = day(time),
  expiry = day(Date.now() + 30 * 86400000),
} = {}) {
  return {
    id,
    symbol: "APP",
    savedAt: new Date(time).toISOString(),
    sourceAsOf: observed,
    quoteAsOf: new Date(time).toISOString(),
    frequency: "test",
    window: "test",
    ivTerm: [],
    board: {
      spot: price,
      contracts: 2,
      universe: "digest",
      cells: [
        {
          key: `100|${expiry}`,
          strike: 100,
          expiry,
          observed,
          gex: 2000,
          oi: 1,
          volume: 1,
          coverage: 1,
          count: 2,
        },
      ],
    },
  };
}
const rule = {
  symbol: "APP",
  type: "exposure-cross",
  threshold: 100,
  enabled: true,
  exposureRole: "fixed",
  marginPercent: 0.5,
  name: "Test",
};
function monitor(getSnapshot, access = { sampleOnly: false }) {
  return load("lib/exposure-monitor.ts", {
    "./shared-market": { allowMarketUser: async () => true },
    "./access-server": {
      getAccess: async () => access,
      requestAccess: async () => access,
      requireFeature: () => {},
    },
    "node:crypto": { createHash },
    "./documents": { cleanDocument: (_, body) => body },
    "./market-workspace-server": {
      captureMarket: getSnapshot,
      marketSigningKey: () => signingKey,
    },
    "./market-checkpoints": checkpoints,
  }).checkExposureAlert;
}
async function seed(run, db) {
  await run(db, "user", { key: "rule", body: rule }, new Map());
}
test("monitor binds cache to account, skips disabled/access-denied fetches and stores compact signed state", async () => {
  const { state, db } = store();
  let fetches = 0;
  const run = monitor(async () => {
    fetches++;
    return snapshot({ price: 99 });
  });
  const cache = new Map();
  await run(
    db,
    "user",
    { key: "rule", body: { ...rule, enabled: false } },
    cache,
  );
  assert.equal(fetches, 0);
  await assert.rejects(
    monitor(
      async () => {
        throw Error("must not fetch");
      },
      { sampleOnly: true },
    )(db, "user", { key: "rule", body: rule }, cache),
    /not enabled/,
  );
  await run(db, "user", { key: "rule", body: rule }, cache);
  await run(store().db, "other", { key: "rule", body: rule }, cache);
  assert.equal(fetches, 2);
  assert.ok(Buffer.byteLength(JSON.stringify(state.baseline.body)) < 2000);
  assert.equal(state.baseline.body.snapshot.board, undefined);
});
test("monitor deduplicates crossing and retries an event insert after the baseline committed", async () => {
  const { state, db } = store();
  let current = snapshot({ id: "old", price: 99, time: Date.now() - 3600000 });
  const run = monitor(async () => current);
  await seed(run, db);
  current = snapshot();
  state.failEvent = true;
  await assert.rejects(
    run(db, "user", { key: "rule", body: rule }, new Map()),
    /alert could not be stored/,
  );
  assert.equal(state.baseline.body.snapshot.state.fingerprint, "new");
  const retry = await run(db, "user", { key: "rule", body: rule }, new Map());
  assert.equal(retry.created, 1);
  assert.equal(state.events.size, 1);
  assert.equal(
    (await run(db, "user", { key: "rule", body: rule }, new Map())).created,
    0,
  );
});
test("monitor resets changed rule baselines and never regresses after a concurrent newer capture", async () => {
  const { state, db } = store();
  let current = snapshot({ id: "old", price: 99, time: Date.now() - 3600000 });
  const run = monitor(async () => current);
  await seed(run, db);
  const latest = structuredClone(state.baseline);
  latest.updated_at = new Date(Date.now() + 1).toISOString();
  latest.body = checkpoints.sealCheckpoint(
    {
      ...latest.body.snapshot,
      state: {
        ...latest.body.snapshot.state,
        price: 105,
        fingerprint: "newer",
        observedAt: new Date(Date.now()).toISOString(),
      },
    },
    "user",
    signingKey,
  );
  state.race = () => {
    state.baseline = latest;
  };
  current = snapshot();
  await run(db, "user", { key: "rule", body: rule }, new Map());
  assert.equal(state.baseline.body.snapshot.state.fingerprint, "newer");
  assert.equal(state.events.size, 0);
  await run(
    db,
    "user",
    { key: "rule", body: { ...rule, marginPercent: 1 } },
    new Map(),
  );
  assert.equal(state.events.size, 0);
  assert.equal(state.baseline.body.snapshot.state.fingerprint, "new");
});
test("monitor ignores a forged unsigned baseline", async () => {
  const { state, db } = store();
  state.baseline = {
    user_id: "user",
    kind: "view",
    key:
      "internal:exposure:" +
      createHash("sha256").update("rule").digest("hex").slice(0, 40),
    updated_at: new Date().toISOString(),
    body: {
      snapshot: { state: { price: 99 } },
      signature: "f".repeat(64),
      kind: "options-v1",
    },
  };
  await monitor(async () => snapshot())(
    db,
    "user",
    { key: "rule", body: rule },
    new Map(),
  );
  assert.equal(state.events.size, 0);
  assert.equal(
    checkpoints.verifyCheckpoint(state.baseline.body, "user", signingKey),
    true,
  );
});
function capture(contracts, asOf = new Date().toISOString()) {
  return load("lib/market-workspace-server.ts", {
    "@supabase/supabase-js": {},
    "node:crypto": { createHash },
    "./server": { HttpError },
    "./providers": {
      quote: async () => ({
        quote: { price: 100, currency: "USD", stale: false, asOf },
      }),
    },
    "./options-source": {
      loadOptionChain: async () => ({ status: "available", contracts }),
    },
    "./exposure-board": exposure,
    "./market-checkpoints": checkpoints,
    "./options-context": { volatilityContext: () => ({ term: [] }) },
  }).captureMarket;
}
function contract(patch = {}) {
  return {
    id: "call",
    type: "call",
    strike: 100,
    expiry: day(Date.now() + 30 * 86400000),
    observed: day(Date.now()),
    gamma: 0.1,
    oi: 10,
    volume: 10,
    standard: true,
    multiplier: 100,
    ...patch,
  };
}
test("capture rejects stale, future and incoherent option inputs even with a fresh quote", async () => {
  for (const contracts of [
    [contract({ observed: day(Date.now() - 6 * 86400000) })],
    [contract({ observed: day(Date.now() + 86400000) })],
    [
      contract(),
      contract({
        id: "put",
        type: "put",
        observed: day(Date.now() - 86400000),
      }),
    ],
  ])
    await assert.rejects(
      capture(contracts)(store().db, "user", "APP"),
      /Recent coherent/,
    );
});
test("capture filters provider expirations and binds checkpoint identity to symbol", async () => {
  const { db, state } = store();
  const c = contract();
  const run = capture([
    c,
    contract({ id: "wrong-expiry", expiry: day(Date.now() + 60 * 86400000) }),
  ]);
  const a = await run(db, "user", "APP", c.expiry);
  const b = await run(db, "user", "OTHER", c.expiry);
  assert.equal(a.board.cells.length, 1);
  assert.equal(a.board.cells[0].expiry, c.expiry);
  assert.notEqual(a.id, b.id);
  assert.equal(state.observations.length, 2);
  assert.ok(
    checkpoints.verifyCheckpoint(
      state.observations[0].payload,
      "user",
      signingKey,
    ),
  );
});
function route(db, { sampleOnly = false } = {}) {
  let captures = 0;
  const api = load("app/api/market-workspace/[symbol]/route.ts", {
    "@/lib/server": {
      account: async () => ({ user: { id: "user" }, db }),
      HttpError,
      limit: () => {},
      privateJson: (data) => Response.json(data),
      failure: (error) =>
        Response.json(
          { error: error.message },
          { status: error.status ?? 500 },
        ),
    },
    "@/lib/market-workspace-server": {
      captureMarket: async () => {
        captures++;
        return snapshot();
      },
      marketHistory: async () => [],
    },
    "@/lib/access-server": {
      requestAccess: async () => ({ sampleOnly }),
      requireFeature: () => {},
    },
    "@/lib/shared-market": { allowMarketUser: async () => true },
    "@/lib/documents": { cleanMarketViews: (value) => value },
  });
  return { api, captures: () => captures };
}
const params = { params: Promise.resolve({ symbol: "APP" }) };
const post = (api, body) =>
  api.POST(
    new Request("https://example.test/api/market-workspace/APP", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    params,
  );
test("route rejects malformed, oversized and invalid expiration requests before provider capture", async () => {
  const { api, captures } = route(store().db);
  for (const body of [
    "{",
    "null",
    "[]",
    JSON.stringify({ op: "capture", expiry: "" }),
    JSON.stringify({ op: "capture", expiry: 20261218 }),
    JSON.stringify({ op: "capture", expiry: "2026-02-31" }),
  ])
    assert.equal((await post(api, body)).status, 400);
  assert.equal(
    (await post(api, { op: "capture", padding: "x".repeat(21000) })).status,
    413,
  );
  assert.equal(captures(), 0);
  const denied = route(store().db, { sampleOnly: true });
  assert.equal((await post(denied.api, { op: "capture" })).status, 403);
  assert.equal(denied.captures(), 0);
});
test("saved view CAS advances the version and rejects a stale device write", async () => {
  const { db, state } = store();
  const { api } = route(db);
  const first = await post(api, {
    op: "views",
    presets: [],
    expectedUpdatedAt: null,
  });
  assert.equal(first.status, 200);
  const version = (await first.json()).updatedAt;
  const next = await post(api, {
    op: "views",
    presets: [],
    expectedUpdatedAt: version,
  });
  assert.equal(next.status, 200);
  const nextVersion = (await next.json()).updatedAt;
  assert.ok(Date.parse(nextVersion) > Date.parse(version));
  assert.equal(state.baseline.updated_at, nextVersion);
  assert.equal(
    (await post(api, { op: "views", presets: [], expectedUpdatedAt: version }))
      .status,
    409,
  );
  assert.equal(
    (await post(api, { op: "views", presets: [], expectedUpdatedAt: null }))
      .status,
    409,
  );
});
