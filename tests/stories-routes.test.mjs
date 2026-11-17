import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function route(path, { authenticated = true, allowed = true } = {}) {
  const ast = ts.createSourceFile(
      "route.ts",
      fs.readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    ),
    body = ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    code = ts.transpileModule(body, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    calls = [];
  class HttpError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }
  const b = {
    HttpError,
    account: async () => {
      calls.push("auth");
      if (!authenticated) throw new HttpError("Sign in", 401);
      return { user: { id: "user" } };
    },
    limit: async () => calls.push("limit"),
    researchSymbol: (s) => s,
    requestAccess: async () => ({
      enabled: true,
      owner: false,
      features: { news: allowed },
    }),
    reserveAccess: async () => calls.push("reserve"),
    sentisenseStoryRead: async (symbol, id) => {
      calls.push("detail");
      return { symbol, status: "available", data: { id, tickers: [symbol] } };
    },
    sentisenseTrackedStocks: async () => {
      calls.push("coverage");
      return {
        status: "available",
        data: ["AAPL", "MSFT"],
        retrievedAt: "2026-11-17",
        source: "SentiSense",
        entitlement: "unverified",
      };
    },
    privateJson: (v) =>
      Response.json(v, { headers: { "Cache-Control": "private, no-store" } }),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
  };
  return {
    calls,
    get: new Function(...Object.keys(b), code + ";return GET;")(
      ...Object.values(b),
    ),
  };
}
const request = new Request("https://example.test/api/stories/AAPL/story1");
test("story detail requires signed-in news access and valid bounded ID before provider call", async () => {
  for (const [config, id, status] of [
    [{ authenticated: false }, "story1", 401],
    [{ allowed: false }, "story1", 403],
    [{}, "../evil", 400],
  ]) {
    const h = route("app/api/stories/[symbol]/[id]/route.ts", config),
      r = await h.get(request, {
        params: Promise.resolve({ symbol: "AAPL", id }),
      });
    assert.equal(r.status, status);
    assert.ok(!h.calls.includes("detail"));
  }
});
test("valid detail reserves existing research allowance and remains private", async () => {
  const h = route("app/api/stories/[symbol]/[id]/route.ts"),
    r = await h.get(request, {
      params: Promise.resolve({ symbol: "AAPL", id: "story1" }),
    });
  assert.equal(r.status, 200);
  assert.deepEqual(h.calls, ["auth", "limit", "reserve", "detail"]);
  assert.match(r.headers.get("Cache-Control"), /no-store/);
});
test("coverage requires authentication and returns only validated tracker data without per-company fanout", async () => {
  const denied = route("app/api/research-coverage/route.ts", {
    authenticated: false,
  });
  assert.equal((await denied.get(request)).status, 401);
  assert.ok(!denied.calls.includes("coverage"));
  const h = route("app/api/research-coverage/route.ts"),
    r = await h.get(request);
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).tickers, ["AAPL", "MSFT"]);
  assert.deepEqual(h.calls, ["auth", "limit", "coverage"]);
});
