import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load() {
  const file = "lib/sentisense-provider.server.ts",
    ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
  const f = ast.statements.find(
    (n) =>
      ts.isFunctionDeclaration(n) && n.name?.text === "createProviderBackend",
  );
  const js = ts.transpileModule(f.getText(ast).replace(/^export /, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(js + ";return createProviderBackend")();
}
const scope = { account: "a".repeat(64), credential: "c".repeat(64) },
  compat = { mode: "compatibility", max: 20, scope: "default" },
  required = { ...compat, mode: "required" };
test("compatibility aggregates all keys via existing shared limiter and preserves local cooldown", async () => {
  const keys = [];
  let now = 0;
  const b = load()({
    limit: async (k, max) => {
      keys.push([k, max]);
    },
    rpc: async () => {
      throw Error("not needed");
    },
    now: () => now,
  });
  await b.reserve(scope, compat);
  assert.equal(keys.length, 2);
  assert.match(keys[0][0], /account/);
  await b.cooldown(scope, 60, compat);
  assert.equal(
    (await b.reserve({ ...scope, credential: "d".repeat(64) }, compat)).allowed,
    false,
  );
  now = 60001;
  assert.equal((await b.reserve(scope, compat)).allowed, true);
});
test("required mode uses atomic RPC and never falls back on storage failure", async () => {
  let legacy = 0;
  const calls = [];
  const b = load()({
    limit: async () => {
      legacy++;
    },
    rpc: async (name, p) => {
      calls.push([name, p]);
      return { data: { allowed: true, retryAfterSeconds: 0 }, error: null };
    },
  });
  assert.equal((await b.reserve(scope, required)).allowed, true);
  assert.equal(calls[0][0], "auryn_sentisense_reserve");
  assert.equal(legacy, 0);
  assert.equal(calls[0][1].p_account, scope.account);
  const fail = load()({
    limit: async () => {
      legacy++;
    },
    rpc: async () => ({ data: null, error: { message: "private" } }),
  });
  await assert.rejects(() => fail.reserve(scope, required));
  assert.equal(legacy, 0);
});
test("required cooldown RPC acknowledgement and malformed reserve responses fail closed", async () => {
  const bad = load()({
    limit: async () => {},
    rpc: async () => ({ data: { allowed: "yes" }, error: null }),
  });
  await assert.rejects(() => bad.reserve(scope, required));
  await assert.rejects(() => bad.cooldown(scope, 60, required));
});

test("actual guard persists default 429 cooldown despite failing or truncated body in both modes", async () => {
  const { createProviderFetch, providerConfig } = await import(
    "../lib/sentisense-provider-core.ts"
  );
  for (const mode of ["compatibility", "required"])
    for (const bodyKind of ["failed", "truncated", "consumed"]) {
      let clock = 0,
        upstream = 0;
      const rpcCalls = [];
      const backend = load()({
        now: () => clock,
        limit: async () => {},
        rpc: async (name, p) => {
          rpcCalls.push([name, p]);
          return {
            data:
              name === "auryn_sentisense_cooldown"
                ? true
                : { allowed: true, retryAfterSeconds: 0 },
            error: null,
          };
        },
      });
      const config = providerConfig({ SENTISENSE_SHARED_GUARD: mode });
      const guarded = createProviderFetch({ config: () => config, ...backend });
      const response =
        bodyKind === "failed"
          ? new Response(
              new ReadableStream({
                start(controller) {
                  controller.error(new Error("SECRET_STREAM_DETAIL"));
                },
              }),
              { status: 429 },
            )
          : new Response('{"error":"quota_exceeded"', { status: 429 });
      if (bodyKind === "consumed") await response.text();
      const first = await guarded(
        "https://app.sentisense.ai/api/v1/stocks/ABC/profile",
        { headers: { "X-SentiSense-API-Key": "secret-fixture" } },
        async () => {
          upstream++;
          return response;
        },
      );
      assert.equal(first, response, "must preserve original response");
      const next = await guarded(
        "https://app.sentisense.ai/api/v1/insights/market",
        { headers: { "X-SentiSense-API-Key": "rotated-fixture" } },
        async () => {
          upstream++;
          return new Response();
        },
      );
      assert.equal(next.status, 429);
      assert.equal(next.headers.get("retry-after"), "60");
      assert.equal(upstream, 1);
      assert.ok(!(await next.text()).includes("SECRET_STREAM_DETAIL"));
      const cooldown = rpcCalls.find(
        ([name]) => name === "auryn_sentisense_cooldown",
      );
      if (mode === "required") {
        assert.equal(cooldown[1].p_seconds, 60);
        assert.ok(!JSON.stringify(rpcCalls).includes("secret-fixture"));
      } else assert.equal(cooldown, undefined);
      clock = 60001;
      assert.equal(
        (
          await guarded(
            "https://app.sentisense.ai/api/v1/insights/market",
            { headers: { "X-SentiSense-API-Key": "rotated-fixture" } },
            async () => new Response(),
          )
        ).status,
        200,
      );
    }
});
test("failed 429 body cannot mask required cooldown storage failure or leak raw errors", async () => {
  const { createProviderFetch, providerConfig } = await import(
    "../lib/sentisense-provider-core.ts"
  );
  const backend = load()({
    limit: async () => {},
    rpc: async (name) =>
      name === "auryn_sentisense_cooldown"
        ? { data: null, error: { message: "SECRET_DB" } }
        : { data: { allowed: true, retryAfterSeconds: 0 }, error: null },
  });
  const guarded = createProviderFetch({
    config: () => providerConfig({ SENTISENSE_SHARED_GUARD: "required" }),
    ...backend,
  });
  await assert.rejects(
    guarded(
      "https://app.sentisense.ai/api/v1/insights/market",
      { headers: { "X-SentiSense-API-Key": "secret-fixture" } },
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.error(Error("SECRET_STREAM"));
            },
          }),
          { status: 429 },
        ),
    ),
    (e) =>
      /cooldown could not be persisted/.test(e.message) &&
      !e.message.includes("SECRET"),
  );
});

test("real summary route and adapter retain neutral 429 and shared cooldown after broken upstream stream", async () => {
  const { createProviderFetch, providerConfig } = await import(
      "../lib/sentisense-provider-core.ts"
    ),
    { createHash } = await import("node:crypto"),
    { marketSummary } = await import("../lib/market-summary.ts"),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const compile = (path) => {
    const source = fs.readFileSync(path, "utf8"),
      ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    return ts.transpileModule(
      ast.statements
        .filter((n) => !ts.isImportDeclaration(n))
        .map((n) => n.getText(ast).replace(/^export /, ""))
        .join("\n"),
      { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
    ).outputText;
  };
  class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  for (const mode of ["compatibility", "required"]) {
    let requests = 0;
    const backend = load()({
      limit: async () => {},
      rpc: async (name) => ({
        data:
          name === "auryn_sentisense_cooldown"
            ? true
            : { allowed: true, retryAfterSeconds: 0 },
        error: null,
      }),
    });
    const guarded = createProviderFetch({
      config: () => providerConfig({ SENTISENSE_SHARED_GUARD: mode }),
      ...backend,
    });
    const read = new Function(
      "sentisenseFetch",
      "createHash",
      "marketSummary",
      "readBoundedMarketJson",
      "HttpError",
      "limit",
      compile("lib/market-summary.server.ts") + ";return readMarketSummary",
    )(
      guarded,
      createHash,
      marketSummary,
      readBoundedMarketJson,
      HttpError,
      async () => {},
    );
    const bindings = {
      HttpError,
      account: async () => ({ user: { id: "fixture" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readMarketSummary: () =>
        read({
          key: "secret-fixture",
          fetcher: async () => {
            requests++;
            return new Response(
              new ReadableStream({
                start(c) {
                  c.error(Error("SECRET_STREAM_DETAIL"));
                },
              }),
              { status: 429 },
            );
          },
        }),
      privateJson: (x) => Response.json(x),
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status ?? 500 }),
    };
    const get = new Function(
      ...Object.keys(bindings),
      compile("app/api/market-summary/route.ts") + ";return GET",
    )(...Object.values(bindings));
    for (let i = 0; i < 2; i++) {
      const response = await get(
        new Request("https://app.test/api/market-summary"),
      );
      assert.equal(response.status, 429);
      const text = await response.text();
      assert.ok(!text.includes("SECRET"));
      assert.ok(!text.includes("secret-fixture"));
    }
    assert.equal(
      requests,
      1,
      "second adapter call must be stopped before upstream",
    );
  }
});
