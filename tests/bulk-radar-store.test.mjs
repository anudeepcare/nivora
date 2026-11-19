import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as bulk from "../lib/bulk-radar.ts";
const snapshot = {
  symbol: "AAPL",
  policy: "raw-splits-v1",
  raw: [
    { date: "2026-11-16", open: 10, high: 11, low: 9, close: 10, volume: 100 },
  ],
  splits: [],
  historyAcquiredAt: "2026-11-17T00:00:00Z",
  actionsAcquiredAt: "2026-11-17T00:00:00Z",
  observedThrough: "2026-11-16",
  checkedThrough: "2026-11-16",
};
function load() {
  const source = fs
    .readFileSync("lib/bulk-radar-store.server.ts", "utf8")
    .replace(/import "server-only";/, "");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", js)(
    module,
    module.exports,
    () => bulk,
  );
  return module.exports;
}
const scope = "a".repeat(64);
test("store bounds scope and selection before querying; missing migration fails actionable", async () => {
  const { createBulkRadarStore } = load();
  let calls = 0;
  const store = createBulkRadarStore({
    rpc: async () => {
      calls++;
      return { error: { message: "internal secret" }, data: null };
    },
  });
  await assert.rejects(store.claim("bad", "AAPL"), /scope/);
  assert.equal(calls, 0);
  await assert.rejects(
    store.read(scope, Array(1001).fill("AAPL")),
    /selection/,
  );
  await assert.rejects(store.claim(scope, "AAPL"), /migration/);
  assert.equal(calls, 1);
});
test("claim and publish preserve fencing parameters and reject malformed results", async () => {
  const { createBulkRadarStore } = load();
  const calls = [];
  const store = createBulkRadarStore({
    rpc: async (name, args) => {
      calls.push({ name, args });
      return {
        error: null,
        data: name.endsWith("claim")
          ? { token: "d26dddb4-9cc3-49aa-b2e6-ec487f3d1fba", revision: 2 }
          : true,
      };
    },
  });
  const c = await store.claim(scope, "AAPL");
  assert.equal(c.revision, 2);
  await store.publish(scope, "AAPL", c.token, c.revision, snapshot);
  assert.equal(calls[1].args.p_revision, 2);
  assert.equal(calls[1].args.p_token, c.token);
  await assert.rejects(
    createBulkRadarStore({
      rpc: async () => ({ data: { token: "oops", revision: -1 } }),
    }).claim(scope, "AAPL"),
    /invalid/,
  );
});
test("read advances by actual returned page size until empty without treating capped rows as missing", async () => {
  const { createBulkRadarStore } = load();
  const offsets = [];
  const rows = ["AAPL", "MSFT"].map((symbol) => ({
    symbol,
    snapshot: null,
    revision: 0,
    issue: null,
    retry_at: null,
  }));
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    async range(start) {
      offsets.push(start);
      return { data: rows.slice(start, start + 1), error: null };
    },
  };
  const store = createBulkRadarStore({ from: () => query });
  const result = await store.read(scope, ["AAPL", "MSFT"]);
  assert.equal(result.size, 2);
  assert.deepEqual(offsets, [0, 1, 2]);
});
test("metadata listing excludes raw history and preserves missing snapshot state", async () => {
  const { createBulkRadarStore } = load();
  let selection;
  const query = {
    select(v) {
      selection = v;
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    async range(start) {
      return {
        error: null,
        data: start
          ? []
          : [
              {
                symbol: "AAPL",
                revision: 0,
                issue: null,
                retry_at: null,
                policy: null,
              },
            ],
      };
    },
  };
  const result = await createBulkRadarStore({ from: () => query }).readMeta(
    scope,
    ["AAPL"],
  );
  assert.equal(result.get("AAPL").snapshot, null);
  assert.ok(selection.includes("policy:snapshot->>policy"));
  assert.ok(!selection.split(",").includes("snapshot"));
  assert.ok(!selection.includes("raw"));
});
test("tiny backend caps have a hard request bound and cannot return partial data as complete", async () => {
  const { createBulkRadarStore } = load();
  let requests = 0;
  const symbols = Array.from({ length: 50 }, (_, i) => "A" + i);
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    async range(start) {
      requests++;
      return {
        error: null,
        data: [
          {
            symbol: symbols[start],
            snapshot: null,
            revision: 0,
            issue: null,
            retry_at: null,
          },
        ],
      };
    },
  };
  await assert.rejects(
    createBulkRadarStore({ from: () => query }).read(scope, symbols),
    /paging limit/,
  );
  assert.equal(requests, 32);
});
test("metadata refuses malformed or future provenance rather than advancing stale state", async () => {
  const { createBulkRadarStore } = load();
  const row = {
    symbol: "AAPL",
    policy: "raw-splits-v1",
    revision: 1,
    issue: null,
    retry_at: null,
    historyAcquiredAt: "2099-01-01T00:00:00Z",
    actionsAcquiredAt: "2026-11-17T00:00:00Z",
    observedThrough: "2026-11-16",
    checkedThrough: "2026-11-16",
  };
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    async range(start) {
      return { error: null, data: start ? [] : [row] };
    },
  };
  await assert.rejects(
    createBulkRadarStore({ from: () => query }).readMeta(scope, ["AAPL"]),
    /invalid snapshot/,
  );
});

test("persisted and new snapshots must pass actual financial validator", async () => {
  const { createBulkRadarStore } = load();
  let writes = 0;
  const bad = { ...snapshot, splits: [{ date: "2026-11-16", split: "0/1" }] };
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    async range(start) {
      return {
        error: null,
        data: start
          ? []
          : [
              {
                symbol: "AAPL",
                revision: 1,
                snapshot: bad,
                issue: null,
                retry_at: null,
              },
            ],
      };
    },
  };
  const store = createBulkRadarStore({
    from: () => query,
    rpc: async () => {
      writes++;
      return { data: true, error: null };
    },
  });
  await assert.rejects(
    store.publish(
      scope,
      "AAPL",
      "d26dddb4-9cc3-49aa-b2e6-ec487f3d1fba",
      1,
      bad,
    ),
  );
  assert.equal(writes, 0);
  await assert.rejects(store.read(scope, ["AAPL"]));
});
test("source cooldown methods preserve scope/date and validate returned instants", async () => {
  const { createBulkRadarStore } = load();
  const until = new Date(Date.now() + 60000).toISOString(),
    calls = [];
  const store = createBulkRadarStore({
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { error: null, data: name.endsWith("pause") ? true : until };
    },
  });
  assert.equal(await store.readSourceCooldown(scope, "2026-11-17"), until);
  await store.pauseSource(scope, "2026-11-17", until);
  assert.equal(calls[1].args.p_retry_at, until);
  assert.equal(calls[0].args.p_date, "2026-11-17");
  await assert.rejects(store.readSourceCooldown(scope, "2026-02-30"));
  await assert.rejects(
    createBulkRadarStore({
      rpc: async () => ({ data: "not a date", error: null }),
    }).readSourceCooldown(scope, "2026-11-17"),
  );
});
