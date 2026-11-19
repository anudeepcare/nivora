import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
async function load() {
  assert.ok(
    fs.existsSync("lib/market-insights.ts"),
    "insights projection exists",
  );
  return import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpileModule(fs.readFileSync("lib/market-insights.ts", "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString("base64")
  );
}
const now = Date.parse("2026-11-18T12:00:00Z"),
  row = {
    insightId: "id",
    insightType: "market_insider_trend",
    ticker: null,
    category: "FUNDAMENTAL",
    insightText: "Fixture pattern",
    confidence: 0,
    urgency: "high",
    generatedAt: now / 1000 - 100,
    docRefs: [
      { url: "https://example.com/source", type: "filing" },
      { url: "javascript:evil" },
    ],
  };
test("market insights preserve dated cross-company evidence and preview metadata, not a session summary", async () => {
  const { marketInsights } = await load();
  const x = marketInsights(
    {
      isPreview: true,
      totalCount: 20,
      data: [
        row,
        { ...row, insightId: "stock", ticker: "ABC", insightText: null },
      ],
    },
    "market",
    now,
  );
  assert.equal(x.rows[0].ticker, null);
  assert.equal(x.rows[0].confidence, 0);
  assert.equal(x.rows[0].sources.length, 1);
  assert.equal(x.rows[1].text, null);
  assert.equal(x.total, 20);
  assert.equal(x.preview, true);
});
test("future dates duplicates personal categories and malformed confidence fail closed", async () => {
  const { marketInsights } = await load();
  for (const rows of [
    [{ ...row, generatedAt: now / 1000 + 1 }],
    [row, row],
    [{ ...row, category: "PERSONALIZED" }],
    [{ ...row, confidence: 2 }],
    [{ ...row, ticker: "../x" }],
  ])
    assert.equal(
      marketInsights({ isPreview: false, data: rows }, "latest", now),
      null,
    );
  assert.equal(
    marketInsights(
      { isPreview: false, data: [{ ...row, insightText: null }] },
      "market",
      now,
    ),
    null,
  );
});
function compiled(path) {
  assert.ok(fs.existsSync(path), path + " exists");
  const s = fs.readFileSync(path, "utf8"),
    ast = ts.createSourceFile(path, s, ts.ScriptTarget.Latest, true);
  return ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("market insights never proxy user feed and enforce auth advanced before provider", async () => {
  const js = compiled("app/api/market-insights/route.ts");
  for (const deny of ["sample", "advanced", null]) {
    let calls = 0;
    const b = {
      HttpError,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: deny === "sample" }),
      requireFeature: (_, f) => {
        if (f === deny) throw new HttpError("Denied", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {},
      readMarketInsights: async () => {
        calls++;
        return { ok: true };
      },
      privateJson: (x) => x,
      failure: (e) => ({ status: e.status }),
    };
    const get = providerFixtureFunction(...Object.keys(b), js + ";return GET")(
      ...Object.values(b),
    );
    const r = await get(
      new Request("https://test/api/market-insights?kind=market"),
    );
    assert.equal(deny ? r.status : r.ok, deny ? 403 : true);
    if (deny) assert.equal(calls, 0);
    else
      for (const q of [
        "kind=user",
        "kind=latest&limit=1000",
        "kind=market&kind=latest",
      ])
        assert.equal(
          (await get(new Request("https://test/api/market-insights?" + q)))
            .status,
          400,
        );
  }
});
test("transport bounds latest50 and market fixed host, safe cache receipt and errors", async () => {
  const js = compiled("lib/market-insights.server.ts"),
    { marketInsights } = await load(),
    { createHash } = await import("node:crypto"),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = providerFixtureFunction(
    "marketInsights",
    "createHash",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return readMarketInsights",
  )(
    marketInsights,
    createHash,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  let calls = 0;
  const fetcher = async (u, o) => {
    calls++;
    assert.equal(
      u,
      "https://app.sentisense.ai/api/v1/insights/latest?limit=50",
    );
    assert.equal(o.redirect, "error");
    assert.equal(o.cache, "no-store");
    return new Response(JSON.stringify({ isPreview: true, data: [] }));
  };
  const a = await read("latest", { key: "fixture", fetcher }),
    b = await read("latest", { key: "fixture", fetcher });
  assert.equal(calls, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  await assert.rejects(
    read("user", { key: "fixture", fetcher }),
    (e) => e.status === 400,
  );
  await assert.rejects(
    read("market", {
      key: "fixture",
      fetcher: async () => new Response("SECRET", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("SECRET"),
  );
  await assert.rejects(
    read("market", {
      key: "fixture",
      fetcher: async () => new Response("x".repeat(2100000)),
    }),
    (e) => e.status === 502,
  );
});
test("actual route projection to React render keeps dates citations preview and confidence semantics", async () => {
  assert.ok(
    fs.existsSync("components/MarketInsights.tsx"),
    "market insights UI exists",
  );
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server"),
    { marketInsights } = await load();
  const bindings = {
    HttpError,
    account: async () => ({ user: { id: "test" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: () => {},
    limit: async () => {},
    reserveAccess: async () => {},
    readMarketInsights: async (kind) => ({
      ...marketInsights(
        {
          isPreview: true,
          data: [{ ...row, insightText: "<script>fixture</script>" }],
        },
        kind,
        now,
      ),
      receivedAt: new Date(now).toISOString(),
    }),
    privateJson: (x) => Response.json(x),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
  };
  const get = providerFixtureFunction(
    ...Object.keys(bindings),
    compiled("app/api/market-insights/route.ts") + ";return GET",
  )(...Object.values(bindings));
  const data = await (
    await get(new Request("https://test/api/market-insights?kind=market"))
  ).json();
  const src = fs.readFileSync("components/MarketInsights.tsx", "utf8"),
    ast = ts.createSourceFile(
      "u.tsx",
      src,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    js = ts.transpileModule(
      ast.statements
        .filter((n) => !ts.isImportDeclaration(n))
        .map((n) => n.getText(ast).replace(/^export default /, ""))
        .join("\n"),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.React,
        },
      },
    ).outputText;
  const C = providerFixtureFunction(
    "React",
    "useState",
    "useResource",
    "Link",
    "s",
    js + ";return InsightFeed",
  )(
    React,
    (x) => [x, () => {}],
    (key) => {
      assert.equal(key, "market-insights?kind=market");
      return { data, loading: false, error: "", refresh() {} };
    },
    (p) => React.createElement("a", p),
    new Proxy({}, { get: (_, k) => k }),
  );
  const html = renderToStaticMarkup(React.createElement(C, { kind: "market" }));
  assert.match(html, /Preview/);
  assert.match(html, /Market-wide/);
  assert.match(html, /2026-11-18T11:58:20/);
  assert.match(html, /not a probability/);
  assert.match(html, /0%/);
  assert.match(html, /href="https:\/\/example.com\/source"/);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("javascript:"));
});
