import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
async function projection() {
  assert.ok(
    fs.existsSync("lib/market-summary.ts"),
    "market summary projection must exist",
  );
  const src = fs.readFileSync("lib/market-summary.ts", "utf8");
  return import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpileModule(src, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString("base64")
  );
}
const now = Date.parse("2026-11-18T12:00:00Z");
test("summary separates generated seconds from served milliseconds and received time", async () => {
  const { marketSummary } = await projection();
  const r = marketSummary(
    {
      headline: "A headline",
      expandedContent: "### Evidence\n[Story](https://example.com)",
      generatedAt: (now - 3600000) / 1000,
      lastUpdated: now,
    },
    now,
  );
  assert.equal(r.generatedAt, "2026-11-18T11:00:00.000Z");
  assert.equal(r.servedAt, "2026-11-18T12:00:00.000Z");
  assert.equal(r.receivedAt, r.servedAt);
  assert.equal(r.headline, "A headline");
});
test("null summary stays unavailable, invalid future times or oversized prose reject", async () => {
  const { marketSummary } = await projection();
  assert.equal(
    marketSummary(
      {
        headline: null,
        expandedContent: null,
        generatedAt: null,
        lastUpdated: now,
      },
      now,
    ).headline,
    null,
  );
  for (const patch of [
    { generatedAt: (now + 3600000) / 1000 },
    { lastUpdated: now + 3600000 },
    { headline: "x".repeat(4001) },
    { expandedContent: 42 },
  ])
    assert.equal(
      marketSummary(
        {
          headline: "H",
          expandedContent: "Text",
          generatedAt: (now - 1000) / 1000,
          lastUpdated: now,
          ...patch,
        },
        now,
      ),
      null,
    );
});
function compiled(path) {
  assert.ok(fs.existsSync(path), path + " must exist");
  const src = fs.readFileSync(path, "utf8"),
    ast = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true);
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
test("summary route denies sample/overview before provider and rejects all parameters", async () => {
  const js = compiled("app/api/market-summary/route.ts");
  for (const deny of ["sample", "overview", null]) {
    const calls = [],
      b = {
        HttpError,
        account: async () => ({ user: { id: "fixture" } }),
        requestAccess: async () => ({ sampleOnly: deny === "sample" }),
        requireFeature: (_, f) => {
          calls.push(f);
          if (deny === f) throw new HttpError("Forbidden", 403);
        },
        limit: async () => {},
        reserveAccess: async () => {},
        readMarketSummary: async () => {
          calls.push("provider");
          return { ok: true };
        },
        privateJson: (x) => x,
        failure: (e) => ({ status: e.status }),
      };
    const get = providerFixtureFunction(...Object.keys(b), js + ";return GET")(
      ...Object.values(b),
    );
    const r = await get(new Request("https://app.test/api/market-summary"));
    if (deny) {
      assert.equal(r.status, 403);
      assert.ok(!calls.includes("provider"));
    } else assert.equal(r.ok, true);
    assert.equal(
      (await get(new Request("https://app.test/api/market-summary?url=evil")))
        .status,
      deny ? 403 : 400,
    );
  }
});
test("summary transport fixed host, credentials, bounded body, neutral errors, cache receipt", async () => {
  const js = compiled("lib/market-summary.server.ts");
  const { createHash } = await import("node:crypto"),
    { readBoundedMarketJson } = await import("../lib/market-response.ts"),
    { marketSummary } = await projection();
  const read = providerFixtureFunction(
    "createHash",
    "marketSummary",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return readMarketSummary",
  )(
    createHash,
    marketSummary,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  let calls = 0;
  const fetcher = async (u, o) => {
    calls++;
    assert.equal(u, "https://app.sentisense.ai/api/v1/market-summary");
    assert.equal(o.redirect, "error");
    assert.equal(o.cache, "no-store");
    assert.equal(o.headers["X-SentiSense-API-Key"], "fixture");
    return new Response(
      JSON.stringify({
        lastUpdated: Date.now(),
        headline: "H",
        expandedContent: null,
        generatedAt: null,
      }),
    );
  };
  const a = await read({ key: "fixture", fetcher }),
    b = await read({ key: "fixture", fetcher });
  assert.equal(calls, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  await assert.rejects(
    read({
      key: "denied",
      fetcher: async () => new Response("SECRET", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("SECRET"),
  );
  await assert.rejects(
    read({
      key: "huge",
      fetcher: async () => new Response("x".repeat(2100000)),
    }),
    (e) => e.status === 502,
  );
});
test("summary markdown renders headings/emphasis and safe citations but never HTML or unsafe links", async () => {
  assert.ok(
    fs.existsSync("components/MarketSummaryMarkdown.tsx"),
    "safe markdown renderer must exist",
  );
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const src = fs
    .readFileSync("components/MarketSummaryMarkdown.tsx", "utf8")
    .replace(/^import .*;$/gm, "")
    .replace("export default function", "function");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const Component = providerFixtureFunction("React", js + ";return MarketSummaryMarkdown")(
    React,
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, {
      text: "### Market overview\n**Strong** [Story](https://example.com/news) [Bad](javascript:evil)\n<script>evil</script>\n- One",
    }),
  );
  assert.match(html, /<h3>Market overview/);
  assert.match(html, /<strong>Strong/);
  assert.match(html, /href="https:\/\/example.com\/news"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes("<script>"));
  assert.match(html, /<li>One/);
});
test("market integration is lazy and summary provides on-demand refresh and honest AI age", () => {
  assert.ok(
    fs.existsSync("components/MarketSummary.tsx"),
    "summary UI must exist",
  );
  const s = fs.readFileSync("components/MarketSummary.tsx", "utf8"),
    page = fs.readFileSync("components/OptionsMarketPage.tsx", "utf8");
  assert.match(s, /AI-generated/);
  assert.match(s, /generatedAt/);
  assert.match(s, /resource.refresh/);
  assert.match(s, /Source and coverage/);
  assert.match(page, /import\("\.\/MarketSummary"\)/);
  assert.match(page, /view === "summary"/);
});
