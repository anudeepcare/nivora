import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createHash } from "node:crypto";
import * as pure from "../lib/bulk-radar.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
import { eodCallCost } from "../lib/market-policy.ts";
function load(
  env = {},
  fetcher = async () => {
    throw Error("unexpected fetch");
  },
) {
  const ast = ts.createSourceFile(
    "provider.ts",
    fs.readFileSync("lib/bulk-radar-provider.server.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const js = ts.transpileModule(
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
  const cache = new Map(),
    costs = [];
  let calls = 0,
    clock = 0;
  const exports = {};
  const bindings = {
    ...pure,
    createHash,
    readBoundedMarketJson,
    eodTicker: (s) => s + ".US",
    process: { env },
    sharedMarketEnabled: () => env.AURYN_SHARED_MARKET_GUARD === "true",
    pauseSharedEod: async () => {},
    fetch: async (...a) => {
      calls++;
      return fetcher(...a);
    },
    sharedEodBoundedRead: async (token, path, params, ttl, read) => {
      const key = token + path + JSON.stringify(params);
      if (!cache.has(key) || cache.get(key).expires <= clock) {
        costs.push(eodCallCost(path, params));
        const value = await read();
        cache.set(key, { value, expires: clock + ttl(value) });
      }
      return cache.get(key).value;
    },
  };
  new Function("exports", ...Object.keys(bindings), js)(
    exports,
    ...Object.values(bindings),
  );
  return {
    exports,
    costs,
    calls: () => calls,
    advance: (ms) => {
      clock += ms;
    },
  };
}
const env = {
  AURYN_BULK_RADAR_ENABLED: "true",
  EODHD_BULK_RADAR_ENTITLEMENT: "verified",
  AURYN_SHARED_MARKET_GUARD: "true",
  EODHD_API_KEY: "synthetic-only",
};
test("bulk transport default disabled/unknown entitlement requires explicit config before any reads", () => {
  for (const config of [
    {},
    { ...env, EODHD_BULK_RADAR_ENTITLEMENT: "" },
    { ...env, AURYN_SHARED_MARKET_GUARD: "false" },
  ]) {
    const h = load(config);
    assert.throws(() => h.exports.bulkRadarProvider());
    assert.equal(h.calls(), 0);
  }
});
test("daily fixed paths spend200units with no private symbols; cached failures do not fan out", async () => {
  const h = load(env, async (url, init) => {
    assert.equal(init.redirect, "error");
    const u = new URL(url);
    assert.equal(u.searchParams.has("symbols"), false);
    assert.equal(u.searchParams.has("_auryn_policy"), false);
    assert.equal(u.pathname, "/api/eod-bulk-last-day/US");
    return Response.json(
      u.searchParams.get("type") === "splits"
        ? []
        : [
            {
              code: "TEST",
              exchange_short_name: "US",
              date: "2026-11-17",
              open: 10,
              high: 11,
              low: 9,
              close: 10,
              volume: 100,
            },
          ],
    );
  });
  const p = h.exports.bulkRadarProvider();
  assert.equal((await p.daily("2026-11-17")).prices.status, "ready");
  await p.daily("2026-11-17");
  assert.deepEqual(h.costs, [100, 100]);
  assert.equal(h.calls(), 2);
  const denied = load(
    env,
    async () => new Response("secret upstream", { status: 403 }),
  );
  const d = denied.exports.bulkRadarProvider();
  await assert.rejects(d.daily("2026-11-17"));
  await assert.rejects(d.daily("2026-11-17"));
  assert.equal(denied.calls(), 1);
});

test("early unavailable data can recover after bounded hourly negative cache", async () => {
  let ready = false;
  const h = load(env, async (url) =>
    !ready
      ? new Response("temporary", { status: 503 })
      : Response.json(
          new URL(url).searchParams.get("type") === "splits"
            ? []
            : [
                {
                  code: "TEST",
                  exchange_short_name: "US",
                  date: "2026-11-17",
                  open: 10,
                  high: 11,
                  low: 9,
                  close: 10,
                  volume: 100,
                },
              ],
        ),
  );
  const p = h.exports.bulkRadarProvider();
  await assert.rejects(p.daily("2026-11-17"));
  ready = true;
  await assert.rejects(p.daily("2026-11-17"));
  assert.equal(h.calls(), 1);
  h.advance(3600001);
  assert.equal((await p.daily("2026-11-17")).prices.status, "ready");
  assert.equal(h.calls(), 3);
});
