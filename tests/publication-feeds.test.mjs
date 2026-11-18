import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("publication feed source is closed and projection rejects subject/source mismatch", async () => {
  assert.ok(
    fs.existsSync("lib/publication-feeds.ts"),
    "publication projector exists",
  );
  const { publicationSource, projectPublications } = await import(
    "../lib/publication-feeds.ts"
  );
  assert.equal(publicationSource("X"), "X");
  assert.equal(publicationSource("ALL"), null);
  const raw = {
    searchTicker: "APP",
    source: "X",
    totalCount: 1,
    documents: [
      {
        id: "1",
        url: "https://x.com/test/status/1",
        source: "X",
        sourceName: "Publisher",
        published: 1700000000,
        body: "secret",
        title: "not supplied contract",
      },
    ],
  };
  const p = projectPublications(raw, "APP", "X");
  assert.equal(p.rows[0].published, "2023-11-14T22:13:20.000Z");
  assert.equal(p.rows[0].publisher, "Publisher");
  assert.ok(!JSON.stringify(p).includes("secret"));
  assert.ok(!JSON.stringify(p).includes("not supplied contract"));
  assert.equal(projectPublications(raw, "MSFT", "X"), null);
  assert.equal(projectPublications(raw, "APP", "NEWS"), null);
  raw.documents[0].url = "javascript:alert(1)";
  assert.equal(projectPublications(raw, "APP", "X").rows[0].url, null);
  raw.documents[0].published = 99999999999;
  assert.equal(projectPublications(raw, "APP", "X").rows[0].published, null);
});
test("preview metadata survives and malformed rows fail closed", async () => {
  const { projectPublications } = await import("../lib/publication-feeds.ts");
  const data = {
    searchTicker: "APP",
    source: "NEWS",
    totalCount: 0,
    documents: [],
  };
  assert.equal(
    projectPublications(
      { isPreview: true, previewReason: "PRO_REQUIRED", data },
      "APP",
      "NEWS",
    ).preview,
    true,
  );
  assert.equal(
    projectPublications({ ...data, totalCount: -1 }, "APP", "NEWS"),
    null,
  );
  assert.equal(
    projectPublications(
      { ...data, documents: [{ id: "x", source: "REDDIT" }] },
      "APP",
      "NEWS",
    ),
    null,
  );
});

import ts from "typescript";
function load(file, bindings, name) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  return providerFixtureFunction(
    ...Object.keys(bindings),
    code + ";return " + name,
  )(...Object.values(bindings));
}
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
test("auth/sample/news gates and malformed sources prevent acquisition", async () => {
  const { publicationSource } = await import("../lib/publication-feeds.ts");
  let calls = 0,
    auth = true,
    sample = false,
    feature = true;
  const get = load(
    "app/api/publications/[symbol]/route.ts",
    {
      HttpError,
      publicationSource,
      sentiSenseTicker: (x) => (/^[A-Z]+$/.test(x) ? x : null),
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "test" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: (_, f) => {
        assert.equal(f, "news");
        if (!feature) throw new HttpError("locked", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {},
      readPublications: async (symbol, source) => {
        calls++;
        return { symbol, source };
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    get(new Request("https://test.local/api/publications/APP" + q), {
      params: Promise.resolve({ symbol: "APP" }),
    });
  auth = false;
  assert.equal((await req("?source=NEWS")).status, 401);
  auth = true;
  sample = true;
  assert.equal((await req("?source=NEWS")).status, 403);
  sample = false;
  feature = false;
  assert.equal((await req("?source=NEWS")).status, 403);
  feature = true;
  for (const q of [
    "?source=ALL",
    "?source=X&source=NEWS",
    "?source=X&url=https://evil.test",
    "",
  ])
    assert.equal((await req(q)).status, 400);
  assert.equal(calls, 0);
  assert.equal((await req("?source=YOUTUBE")).data.source, "YOUTUBE");
  assert.equal(calls, 1);
});
test("fixed URL and bounded response; UI source is opt-in, identity keyed", () => {
  const server = fs.readFileSync("lib/publication-feeds.server.ts", "utf8");
  assert.match(
    server,
    /https:\/\/app.sentisense.ai\/api\/v1\/documents\/ticker\//,
  );
  assert.match(server, /redirect:\s*["']error/);
  assert.match(server, /readBoundedMarketJson\(response,\s*2000000\)/);
  const ui = fs.readFileSync("components/PublicationFeeds.tsx", "utf8");
  assert.match(ui, /useState<PublicationSource\s*\|\s*null>\(null\)/);
  assert.match(ui, /source && !search\s*\?\s*`publications/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML|iframe|setInterval/);
  assert.match(
    fs.readFileSync("components/SentiSensePanels.tsx", "utf8"),
    /<PublicationFeeds key=\{symbol\}/,
  );
});
test("transport rejects invalid input before fetch, sanitizes status and forwards bounded fixed request", async () => {
  const { publicationSource, projectPublications } = await import(
    "../lib/publication-feeds.ts"
  );
  let calls = 0,
    status = 200;
  const read = load(
    "lib/publication-feeds.server.ts",
    {
      HttpError,
      publicationSource,
      projectPublications,
      sentiSenseTicker: (x) => (/^[A-Z]+$/.test(x) ? x : null),
      limit: async () => {},
      process: { env: { SENTISENSE_API_KEY: "synthetic" } },
      fetch: async (url, init) => {
        calls++;
        assert.equal(
          url,
          "https://app.sentisense.ai/api/v1/documents/ticker/APP?source=X&days=30&limit=25",
        );
        assert.equal(init.redirect, "error");
        assert.equal(init.next.revalidate, 300);
        return new Response(
          JSON.stringify({
            searchTicker: "APP",
            source: "X",
            totalCount: 0,
            documents: [],
          }),
          { status },
        );
      },
      readBoundedMarketJson: async (response, cap) => {
        assert.equal(cap, 2000000);
        return response.json();
      },
    },
    "readPublications",
  );
  await assert.rejects(read("APP", "ALL"), (e) => e.status === 400);
  assert.equal(calls, 0);
  const result = await read("APP", "X");
  assert.equal(result.source, "X");
  assert.equal(result.totalCount, 0);
  assert.equal(calls, 1);
  status = 403;
  await assert.rejects(
    read("APP", "X"),
    (e) => e.status === 403 && !e.message.includes("synthetic"),
  );
});
