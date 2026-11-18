import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as normalize from "../lib/eod-context.ts";
function harness({ sampleOnly = false, allowed = true } = {}) {
  const calls = [];
  class HttpError extends Error {
    constructor(m, status = 400) {
      super(m);
      this.status = status;
    }
  }
  const source = fs.readFileSync("app/api/market-context/route.ts", "utf8");
  const ast = ts.createSourceFile(
    "route.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const bindings = {
    ...normalize,
    HttpError,
    account: async () => ({ user: { id: "owner" } }),
    requestAccess: async () => ({ sampleOnly }),
    requireFeature: () => {
      if (!allowed) throw new HttpError("Unavailable", 403);
    },
    limit: async () => {},
    privateJson: (x) => x,
    failure: (e) => ({ status: e.status ?? 503 }),
    providerSymbol: (s) => {
      if (!s) throw new HttpError("Symbol required");
      return s;
    },
    eodTicker: (s) => s + ".US",
    eodRequest: async (path, params, ttl) => {
      calls.push({ path, params, ttl });
      return path === "economic-events"
        ? []
        : path === "calendar/dividends"
          ? { meta: { symbol: params["filter[symbol]"], total: 0 }, data: [] }
          : { data: [] };
    },
  };
  return {
    calls,
    GET: new Function(...Object.keys(bindings), js + ";return GET")(
      ...Object.values(bindings),
    ),
  };
}
test("each context selection makes one bounded shared-cache request, no marketplace endpoints or per-company macro fanout", async () => {
  const h = harness();
  await h.GET(
    new Request("http://local/api/market-context?kind=dividends&symbol=TEST"),
  );
  await h.GET(new Request("http://local/api/market-context?kind=economy"));
  await h.GET(new Request("http://local/api/market-context?kind=treasury"));
  assert.deepEqual(
    h.calls.map((c) => c.path),
    ["calendar/dividends", "economic-events", "ust/yield-rates"],
  );
  assert.equal(h.calls[0].params["page[limit]"], "100");
  assert.equal(h.calls[0].params["filter[symbol]"], "TEST.US");
  assert.equal(h.calls[1].params.limit, "100");
  assert.equal(h.calls[1].params.country, "US");
  assert.ok(h.calls.every((c) => c.ttl >= 1800000));
});
test("sample-only, denied access, crypto and caller-selected arbitrary datasets never reach provider", async () => {
  for (const options of [{ sampleOnly: true }, { allowed: false }]) {
    const h = harness(options);
    assert.equal(
      (await h.GET(new Request("http://local/api/market-context?kind=economy")))
        .status,
      403,
    );
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  assert.equal(
    (
      await h.GET(
        new Request(
          "http://local/api/market-context?kind=dividends&symbol=BTC/USD",
        ),
      )
    ).status,
    422,
  );
  assert.equal(
    (await h.GET(new Request("http://local/api/market-context?kind=anything")))
      .status,
    400,
  );
  assert.equal(h.calls.length, 0);
});
