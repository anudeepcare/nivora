import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const path = new URL("../lib/options-flow.ts", import.meta.url);
const code = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const mod = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
);
const id = "AAPL280121C00100000",
  now = Date.parse("2026-11-05T19:00:00Z");
const contract = (id, oi = 10) => ({
  id,
  standard: true,
  multiplier: 100,
  type: "call",
  strike: Number(id.slice(-8)) / 1000,
  expiry: "2028-01-21",
  oi,
});
test("scope selects only validated standard contracts for underlying and expiry, capped at thirty by OI", () => {
  assert.equal(typeof mod.selectFlowContracts, "function");
  const rows = Array.from({ length: 40 }, (_, i) =>
    contract(`AAPL280121C${String(100000 + i * 1000).padStart(8, "0")}`, i),
  );
  const selected = mod.selectFlowContracts(
    [
      ...rows,
      contract("MSFT280121C00100000", 999),
      { ...contract(id, 999), multiplier: 10 },
      contract("AAPL280230C00100000", 999),
    ],
    "AAPL",
    "2028-01-21",
  );
  assert.equal(selected.length, 30);
  assert.equal(selected[0].oi, 39);
  assert.equal(new Set(selected.map((c) => c.id)).size, 30);
});
test("trade normalization deduplicates, validates timestamps and numbers, and computes sample premium only", () => {
  assert.equal(typeof mod.normalizeFlowTrades, "function");
  const trade = {
    t: "2026-11-05T18:59:00Z",
    p: 2.5,
    s: 3,
    x: "A",
    c: ["I"],
    i: 4,
  };
  const r = mod.normalizeFlowTrades(
    {
      [id]: [
        trade,
        trade,
        { ...trade, i: 5, t: "2026-11-06T00:00:00Z" },
        { ...trade, i: 6, p: -1 },
        { ...trade, i: 7, s: 0 },
        { ...trade, i: 8, s: "3" },
        { ...trade, i: 9, t: "bad" },
      ],
      MSFT280121C00100000: [trade],
    },
    [contract(id)],
    now,
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].premium, 750);
  assert.equal(r[0].condition, "I");
  assert.equal(r[0].exchange, "A");
  assert.equal(r[0].time, trade.t);
  assert.deepEqual(mod.rankFlowPremium(r), [
    { contract: id, premium: 750, prints: 1, size: 3 },
  ]);
});
test("malformed provider response is an informative error, valid empty is empty", () => {
  assert.equal(typeof mod.normalizeFlowTrades, "function");
  assert.throws(
    () => mod.normalizeFlowTrades(null, [contract(id)], now),
    /unsupported/,
  );
  assert.throws(
    () => mod.normalizeFlowTrades({ [id]: {} }, [contract(id)], now),
    /unsupported/,
  );
  assert.deepEqual(mod.normalizeFlowTrades({}, [contract(id)], now), []);
});
function adapter(
  env = {},
  response = {
    trades: {
      [id]: [
        {
          t: new Date(Date.now() - 60000).toISOString(),
          p: 2,
          s: 1,
          x: "A",
          c: [],
          i: 1,
        },
      ],
    },
    next_page_token: "more",
  },
) {
  const p = new URL("../lib/options-flow-source.ts", import.meta.url);
  assert.ok(fs.existsSync(p), "flow source adapter exists");
  const js = ts.transpileModule(fs.readFileSync(p, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const counts = { chain: 0, budget: 0, fetch: 0 };
  const exports = {};
  const require = (name) =>
    name === "./options-source"
      ? {
          loadOptionChain: async () => {
            counts.chain++;
            return {
              status: "available",
              contracts: [contract(id)],
              complete: true,
            };
          },
        }
      : name === "./provider-budget"
        ? {
            reserveProvider: async () => {
              counts.budget++;
            },
          }
        : name === "./server"
          ? {
              HttpError: class extends Error {
                constructor(message, status) {
                  super(message);
                  this.status = status;
                }
              },
            }
          : mod;
  const fetch = async (url) => {
    counts.fetch++;
    const u = new URL(url);
    assert.equal(u.origin, "https://data.alpaca.markets");
    assert.equal(u.pathname, "/v1beta1/options/trades");
    assert.equal(u.searchParams.get("limit"), "500");
    assert.equal(u.searchParams.get("sort"), "desc");
    assert.equal(u.searchParams.has("feed"), false);
    assert.equal(u.searchParams.has("end"), false);
    assert.equal(counts.budget, counts.fetch);
    return Response.json(response);
  };
  new Function("require", "exports", "process", "fetch", "AbortSignal", js)(
    require,
    exports,
    { env },
    fetch,
    AbortSignal,
  );
  return { load: exports.loadOptionsFlow, counts };
}
test("flow switch blocks every chain and trade request before source access", async () => {
  const a = adapter({ AURYN_OPTIONS_ENABLED: "true" });
  const r = await a.load("AAPL", null);
  assert.equal(r.status, "unavailable");
  assert.match(r.message, /permissions|rights/i);
  assert.deepEqual(a.counts, { chain: 0, budget: 0, fetch: 0 });
});
test("one bounded page reserves budget, coalesces requests and labels truncated symbol-first sample", async () => {
  const a = adapter({
    AURYN_OPTIONS_ENABLED: "true",
    AURYN_OPTIONS_FLOW_ENABLED: "true",
    ALPACA_PAPER_API_KEY: "test",
    ALPACA_PAPER_API_SECRET: "test",
  });
  const [r, s] = await Promise.all([
    a.load("AAPL", null),
    a.load("AAPL", null),
  ]);
  assert.equal(r.partial, true);
  assert.equal(r.trades.length, 1);
  assert.deepEqual(r, s);
  await a.load("AAPL", null);
  assert.deepEqual(a.counts, { chain: 1, budget: 1, fetch: 1 });
});
test("source condition code strings are preserved and impossible calendar timestamps discarded", () => {
  const base = { t: "2026-11-05T18:59:00Z", p: 2, s: 1, x: "A", c: "I", i: 1 };
  const r = mod.normalizeFlowTrades(
    { [id]: [base, { ...base, i: 2, t: "2026-02-30T01:00:00Z" }] },
    [contract(id)],
    now,
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].condition, "I");
});
test("missing credentials and invalid expiry fail before chain or budget requests", async () => {
  const enabled = {
    AURYN_OPTIONS_ENABLED: "true",
    AURYN_OPTIONS_FLOW_ENABLED: "true",
  };
  const a = adapter(enabled);
  await assert.rejects(a.load("AAPL"), /not configured/);
  assert.deepEqual(a.counts, { chain: 0, budget: 0, fetch: 0 });
  const b = adapter({
    ...enabled,
    ALPACA_PAPER_API_KEY: "test",
    ALPACA_PAPER_API_SECRET: "test",
  });
  await assert.rejects(b.load("AAPL", "2028-02-30"), /valid expiry/);
  assert.deepEqual(b.counts, { chain: 0, budget: 0, fetch: 0 });
});
test("unsupported upstream data fails visibly and is not cached as an empty tape", async () => {
  const a = adapter(
    {
      AURYN_OPTIONS_ENABLED: "true",
      AURYN_OPTIONS_FLOW_ENABLED: "true",
      ALPACA_PAPER_API_KEY: "test",
      ALPACA_PAPER_API_SECRET: "test",
    },
    { unexpected: [] },
  );
  await assert.rejects(a.load("AAPL"), /unsupported/);
  await assert.rejects(a.load("AAPL"), /unsupported/);
  assert.equal(a.counts.fetch, 2);
});
