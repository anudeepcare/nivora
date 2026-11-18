import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
test("every dedicated upstream adapter routes injected or native fetch through shared provider guard", () => {
  const files = fs
    .readdirSync("lib")
    .filter(
      (f) =>
        f.endsWith(".server.ts") &&
        fs.readFileSync("lib/" + f, "utf8").includes("app.sentisense.ai"),
    );
  assert.ok(files.length >= 25);
  for (const file of files) {
    const source = fs.readFileSync("lib/" + file, "utf8"),
      ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    let guards = 0;
    function visit(n) {
      if (ts.isCallExpression(n)) {
        const name = n.expression.getText(ast);
        assert.ok(
          !["fetch", "fetcher", "globalThis.fetch"].includes(name),
          file + ": unguarded " + name,
        );
        if (name === "sentisenseFetch") guards++;
      }
      ts.forEachChild(n, visit);
    }
    visit(ast);
    assert.ok(guards >= 1, file + " missing guard");
    assert.match(
      source,
      /import\s*{\s*sentisenseFetch\s*}\s*from\s*["']\.\/sentisense-provider.server["']/,
    );
  }
});
test("generic runtime singletons always inject guarded transport while factory remains isolated for fixtures", () => {
  const s = fs.readFileSync("lib/sentisense-api.ts", "utf8");
  const runtime = s.slice(s.indexOf("let singleton:"));
  const factories = [
    ...runtime.matchAll(/createSentiSenseClient\(\{([\s\S]*?)\}\)/g),
  ];
  assert.equal(factories.length, 8);
  for (const m of factories)
    assert.match(m[1], /fetcher:\s*guardedSentiSenseFetch/);
  assert.match(s, /import\(["']\.\/sentisense-provider.server["']\)/);
});

test("actual stock adapter obeys shared denial before network and preserves successful fixed plan", async () => {
  const { createProviderFetch, providerConfig } = await import(
    "../lib/sentisense-provider-core.ts"
  );
  const { screenInput, screenRows } = await import("../lib/stock-screener.ts");
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  let allowed = false,
    network = 0,
    reservations = 0;
  const sentisenseFetch = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => {
      reservations++;
      return { allowed, retryAfterSeconds: 30 };
    },
    cooldown: async () => {},
  });
  const file = "lib/stock-screener.server.ts",
    source = fs.readFileSync(file, "utf8"),
    ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const run = new Function(
    "sentisenseFetch",
    "screenInput",
    "screenRows",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return runStockScreen",
  )(
    sentisenseFetch,
    screenInput,
    screenRows,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  const input = { field: "PRICE", op: "GTE", value: 1 },
    deps = {
      key: "fixture-key",
      fetcher: async (url, init) => {
        network++;
        assert.equal(url, "https://app.sentisense.ai/api/v1/screener/execute");
        assert.equal(JSON.parse(init.body).limit, 100);
        return Response.json({ matched: 0, results: [] });
      },
    };
  await assert.rejects(run(input, deps), (e) => e.status === 429);
  assert.equal(network, 0);
  assert.equal(reservations, 1);
  allowed = true;
  assert.equal((await run(input, deps)).matched, 0);
  assert.equal(network, 1);
  assert.equal(reservations, 2);
});

test("actual market mood v2 adapter passes shared guard, while unsupported API versions remain blocked", async () => {
  const { createProviderFetch, providerConfig } = await import(
    "../lib/sentisense-provider-core.ts"
  );
  const { moodKinds, moodSnapshot } = await import("../lib/market-mood.ts");
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  let calls = 0,
    permits = 0;
  const sentisenseFetch = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => {
      permits++;
      return { allowed: true, retryAfterSeconds: 0 };
    },
    cooldown: async () => {},
  });
  const file = "lib/market-mood.server.ts",
    source = fs.readFileSync(file, "utf8"),
    ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const fixtureFetch = async (url) => {
    calls++;
    assert.equal(url, "https://app.sentisense.ai/api/v2/market-mood?days=90");
    return Response.json({
      market: { currentScore: 0, history: [] },
      sectors: {},
    });
  };
  const read = new Function(
    "sentisenseFetch",
    "moodKinds",
    "moodSnapshot",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    "fetch",
    "process",
    js + ";return readMarketMood",
  )(
    sentisenseFetch,
    moodKinds,
    moodSnapshot,
    readBoundedMarketJson,
    HttpError,
    async () => {},
    fixtureFetch,
    { env: { SENTISENSE_API_KEY: "fixture" } },
  );
  const result = await read("mood");
  assert.equal(result.mood.score, 0);
  assert.equal(calls, 1);
  assert.equal(permits, 1);
  for (const path of [
    "/api/v3/market-mood",
    "/api/v20/market-mood",
    "/api/v2evil",
    "/api/market-mood",
  ])
    await assert.rejects(
      sentisenseFetch(
        "https://app.sentisense.ai" + path,
        { headers: { "X-SentiSense-API-Key": "fixture" } },
        fixtureFetch,
      ),
    );
  assert.equal(calls, 1);
  assert.equal(permits, 1);
});
