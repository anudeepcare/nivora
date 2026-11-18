import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readBoundedMarketJson } from "../lib/market-response.ts";
test("market JSON permits bounded valid data but rejects oversized declared and streaming bodies", async () => {
  assert.deepEqual(
    await readBoundedMarketJson(new Response('{"value":1}'), 100),
    { value: 1 },
  );
  await assert.rejects(
    readBoundedMarketJson(
      new Response("{}", { headers: { "content-length": "101" } }),
      100,
    ),
    /size/,
  );
  let cancelled = false;
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode("x".repeat(101)));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readBoundedMarketJson(new Response(stream), 100),
    /size/,
  );
  assert.equal(cancelled, true);
});
test("malformed JSON and UTF8 fail with neutral errors, and provider fetch rejects redirects", async () => {
  await assert.rejects(
    readBoundedMarketJson(new Response("not json"), 100),
    /valid JSON/,
  );
  await assert.rejects(
    readBoundedMarketJson(new Response(new Uint8Array([255])), 100),
    /valid JSON/,
  );
  const source = fs.readFileSync("lib/eodhd.ts", "utf8");
  assert.match(source, /redirect: "error"/);
  assert.match(source, /readBoundedMarketJson\(/);
  assert.doesNotMatch(source, /await response\.json\(\)/);
});

test("actual shared EOD request sets redirect policy and invokes streamed context byte cap", async () => {
  const ts = (await import("typescript")).default;
  const source = fs.readFileSync("lib/eodhd.ts", "utf8"),
    ast = ts.createSourceFile("eodhd.ts", source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "eodRequest",
  );
  const js = ts.transpileModule(node.getText(ast).replace(/^export /, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  class NeutralError extends Error {}
  const calls = [];
  const bindings = {
    process: { env: { EODHD_API_KEY: "test-only-placeholder" } },
    cache: new Map(),
    canonicalMarketKey: (path, params) => path + JSON.stringify(params),
    sharedEodRead: async (_token, _path, _params, _ttl, read) => read(),
    pauseSharedEod: async () => {},
    readBoundedMarketJson,
    HttpError: NeutralError,
    EodAccessError: NeutralError,
    EodBackoffError: NeutralError,
    MarketGuardError: NeutralError,
    normalizeEodBars: (x) => x,
    fetch: async (_url, options) => {
      calls.push(options);
      return new Response('{"data":[]}');
    },
  };
  const request = new Function(
    ...Object.keys(bindings),
    js + ";return eodRequest",
  )(...Object.values(bindings));
  assert.deepEqual(
    await request("ust/yield-rates", { "filter[year]": "2026" }),
    { data: [] },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].redirect, "error");
  assert.ok(calls[0].signal instanceof AbortSignal);
  await request("ust/yield-rates", { "filter[year]": "2026" });
  assert.equal(calls.length, 1, "cache still avoids repeated transport");
});
