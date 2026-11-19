import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as pure from "../lib/bulk-radar.ts";
const workerSource = fs.readFileSync("lib/bulk-radar-worker.ts", "utf8");
const ast = ts.createSourceFile(
  "worker.ts",
  workerSource,
  ts.ScriptTarget.Latest,
  true,
);
const src = ts.transpileModule(
  ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast))
    .join("\n"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
).outputText;
const exports = {};
new Function("exports", ...Object.keys(pure), src)(
  exports,
  ...Object.values(pure),
);
const { runBulkRadar } = exports;
const now = () => Date.parse("2026-11-18T12:00:00Z");
function harness(symbols, initial = new Map(), denied = false) {
  const state = new Map(initial),
    calls = { daily: 0, seed: 0, publish: 0 };
  const seed = (symbol, date = "2026-11-17") =>
    pure.bootstrapRadar(
      symbol,
      [{ date, open: 10, high: 11, low: 9, close: 10, volume: 100 }],
      [],
      "2026-11-18T00:00:00Z",
    );
  let sourcePause = null;
  const store = {
    readSourceCooldown: async () => sourcePause,
    pauseSource: async (_, __, retryAt) => { sourcePause = retryAt; },
    readMeta: async () => state,
    read: async (_, ss) => new Map([...state].filter(([s]) => ss.includes(s))),
    claim: async (_, s) => ({
      token: s,
      revision: state.get(s)?.revision ?? 0,
    }),
    publish: async (_, s, t, r, snapshot) => {
      calls.publish++;
      state.set(s, { snapshot, revision: r + 1, issue: null, retryAt: null });
      return true;
    },
    fail: async (_, s, t, issue, retryAt) => {
      state.set(s, {
        snapshot: state.get(s)?.snapshot ?? null,
        revision: state.get(s)?.revision ?? 0,
        issue,
        retryAt,
      });
      return true;
    },
  };
  const provider = {
    scope: "scope",
    seed: async (s) => {
      calls.seed++;
      return seed(s);
    },
    daily: async (date) => {
      calls.daily++;
      if (denied) throw Error("denied");
      return {
        prices: {
          status: "ready",
          date,
          rows: symbols.map((s) => [s, date, 10, 11, 9, 10, 100]),
          issue: null,
        },
        actions: [],
        pricesAcquiredAt: "2026-11-18T00:00:00Z",
        actionsAcquiredAt: "2026-11-18T00:00:00Z",
      };
    },
  };
  return {
    state,
    calls,
    seed,
    deps: { store, provider, allow: async () => true, now },
  };
}
test("500 cold symbols bootstrap only two per continuation and report498pending", async () => {
  const symbols = Array.from({ length: 500 }, (_, i) => `T${i}`),
    h = harness(symbols);
  const out = await runBulkRadar(
    { symbols, requested: 500, excluded: 0 },
    true,
    0,
    h.deps,
  );
  assert.equal(h.calls.daily, 1);
  assert.equal(h.calls.seed, 2);
  assert.equal(out.ready, 2);
  assert.equal(out.pending, 498);
  assert.match(out.limitations.join(" "), /Historical bars/);
});
test("denied bulk entitlement never starts a per-ticker fallback storm", async () => {
  const symbols = Array.from({ length: 500 }, (_, i) => `T${i}`),
    h = harness(symbols, new Map(), true);
  const out = await runBulkRadar({ symbols, requested: 500, excluded: 0 }, true, 0, h.deps);
  assert.equal(out.sourceStatus, "unavailable");
  assert.equal(out.sourceRetryAt, "2026-11-18T13:00:00.000Z");
  assert.equal(out.retryAfterSeconds, 3600);
  assert.equal(out.pending, 500);
  assert.equal(h.calls.daily, 1);
  assert.equal(h.calls.seed, 0);
  assert.equal(h.calls.publish, 0);
});
test("cached GET never calls provider; appends preserve historical acquisition vintage", async () => {
  const h = harness(["TEST"]);
  const original = h.seed("TEST", "2026-11-16");
  h.state.set("TEST", {
    snapshot: original,
    revision: 1,
    issue: null,
    retryAt: null,
  });
  const u = { symbols: ["TEST"], requested: 1, excluded: 0 };
  const before = await runBulkRadar(u, false, 0, h.deps);
  assert.equal(h.calls.daily, 0);
  assert.equal(before.rows[0].stale, true);
  const out = await runBulkRadar(u, true, 0, h.deps);
  assert.equal(out.ready, 1);
  assert.equal(h.calls.seed, 0);
  assert.equal(out.rows[0].historyAcquiredAt, original.historyAcquiredAt);
  assert.equal(out.rows[0].history.length, 2);
});

test("split or gap requires full reseed; failed rebuild preserves last good generation", async () => {
  const h = harness(["TEST"]);
  const old = h.seed("TEST", "2026-11-16");
  h.state.set("TEST", {
    snapshot: old,
    revision: 4,
    issue: null,
    retryAt: null,
  });
  h.deps.provider.daily = async (date) => ({
    prices: {
      status: "ready",
      date,
      rows: [["TEST", date, 5, 6, 4, 5, 100]],
      issue: null,
    },
    actions: [{ symbol: "TEST", action: { date, split: "2/1" } }],
    pricesAcquiredAt: "2026-11-18T00:00:00Z",
    actionsAcquiredAt: "2026-11-18T00:00:00Z",
  });
  h.deps.provider.seed = async () => {
    h.calls.seed++;
    throw Error("rebuild unavailable");
  };
  const out = await runBulkRadar(
    { symbols: ["TEST"], requested: 1, excluded: 0 },
    true,
    0,
    h.deps,
  );
  assert.equal(h.calls.seed, 1);
  assert.equal(h.calls.publish, 0);
  assert.equal(out.rows[0].stale, true);
  assert.deepEqual(h.state.get("TEST").snapshot, old);
});
test("monthly full rebuild replaces removed actions instead of applying deltas", async () => {
  const h = harness(["TEST"]);
  const old = {
    ...h.seed("TEST", "2026-11-16"),
    historyAcquiredAt: "2026-10-01T00:00:00Z",
    splits: [{ date: "2026-11-16", split: "2/1" }],
  };
  h.state.set("TEST", {
    snapshot: old,
    revision: 1,
    issue: null,
    retryAt: null,
  });
  await runBulkRadar(
    { symbols: ["TEST"], requested: 1, excluded: 0 },
    true,
    0,
    h.deps,
  );
  assert.equal(h.calls.seed, 1);
  assert.deepEqual(h.state.get("TEST").snapshot.splits, []);
});

test("revision advanced between read and claim cannot overwrite newer generation", async () => {
  const h = harness(["TEST"]);
  h.state.set("TEST", {
    snapshot: h.seed("TEST", "2026-11-16"),
    revision: 1,
    issue: null,
    retryAt: null,
  });
  h.deps.store.claim = async () => ({ token: "new-lease", revision: 2 });
  await runBulkRadar(
    { symbols: ["TEST"], requested: 1, excluded: 0 },
    true,
    0,
    h.deps,
  );
  assert.equal(h.calls.publish, 0);
  assert.equal(h.calls.seed, 0);
});

test("all seed paths reject missing or contradictory triggering split and retain last good", async () => {
  for (const mode of ["cold", "aged", "gap", "split"]) {
    for (const splits of [[], [{ date: "2026-11-17", split: "3/1" }], [{ date: "2026-11-16", split: "2/1" }]]) {
      const h = harness(["TEST"]);
      const old = mode === "cold" ? null : {
        ...h.seed("TEST", mode === "gap" ? "2026-11-13" : "2026-11-16"),
        ...(mode === "aged" ? { historyAcquiredAt: "2026-10-01T00:00:00Z" } : {}),
      };
      if (old) h.state.set("TEST", {snapshot:old,revision:4,issue:null,retryAt:null});
      const daily = h.deps.provider.daily;
      h.deps.provider.daily = async date => ({...await daily(date), actions:[{symbol:"TEST",action:{date,split:"2/1"}}]});
      h.deps.provider.seed = async () => ({...h.seed("TEST"),splits});
      const out = await runBulkRadar({symbols:["TEST"],requested:1,excluded:0},true,0,h.deps);
      assert.equal(h.calls.publish,0,`${mode}: ${JSON.stringify(splits)}`);
      assert.equal(out.ready,0);
      assert.deepEqual(h.state.get("TEST").snapshot,old);
      assert.ok(h.state.get("TEST").retryAt);
    }
  }
});
test("reseed accepts numerically equivalent split ratio on exact effective date", async () => {
  const h = harness(["TEST"]);
  const daily = h.deps.provider.daily;
  h.deps.provider.daily = async date => ({...await daily(date), actions:[{symbol:"TEST",action:{date,split:"2/1"}}]});
  h.deps.provider.seed = async () => ({...h.seed("TEST"),splits:[{date:"2026-11-17",split:"4/2"}]});
  const out=await runBulkRadar({symbols:["TEST"],requested:1,excluded:0},true,0,h.deps);
  assert.equal(out.ready,1);
  assert.equal(h.calls.publish,1);
});


test("source outage survives GET reload and blocks further POST work for all500cold rows", async () => {
  const symbols=Array.from({length:500},(_,i)=>`T${i}`), h=harness(symbols,new Map(),true);
  let clock=now(); h.deps.now=()=>clock;
  let allowances=0; h.deps.allow=async()=>{allowances++;return true};
  const u={symbols,requested:500,excluded:0};
  const first=await runBulkRadar(u,true,0,h.deps);
  for (const advance of [false,true,false]) {
    const out=await runBulkRadar(u,advance,0,h.deps);
    assert.equal(out.sourceStatus,"unavailable");
    assert.equal(out.sourceRetryAt,first.sourceRetryAt);
    assert.equal(out.retryAfterSeconds,3600);
    assert.equal(out.pending,500);
  }
  assert.equal(h.calls.daily,1); assert.equal(allowances,1);
  clock+=3600001;
  await runBulkRadar(u,true,0,h.deps);
  assert.equal(h.calls.daily,2); assert.equal(allowances,2);
});
