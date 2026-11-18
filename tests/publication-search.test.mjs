import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import {
  createProviderFetch,
  providerConfig,
} from "../lib/sentisense-provider-core.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
import { renderToStaticMarkup } from "react-dom/server";
function load(file, bindings, name) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const src = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) =>
      n
        .getText(ast)
        .replace(/^export default /, "")
        .replace(/^export /, ""),
    )
    .join("\n");
  const code = ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
const request = { query: "NVDA earnings", kind: "stories", days: 7 };
const raw = [
  {
    id: "story-1",
    cluster: {
      title: "Provider story",
      storySource: "AI",
      clusteredAt: 1700000000,
    },
    tickers: ["MSFT"],
    brokeAt: null,
  },
];
const doc = {
  documents: [
    {
      id: "doc-1",
      source: "NEWS",
      sourceName: "Publisher",
      url: "https://example.com/news",
      published: 1700000000,
      title: "Forbidden headline",
      body: "Forbidden text",
    },
  ],
  totalCount: 1,
};
test("bounded explicit query contract rejects extra fields and invalid windows", async () => {
  const { searchRequest } = await import("../lib/publication-search.ts");
  assert.deepEqual(searchRequest(request), request);
  for (const x of [
    { ...request, days: 30 },
    { ...request, kind: "all" },
    { ...request, query: " " },
    { ...request, query: "x".repeat(241) },
    { ...request, holdings: ["private"] },
    { ...request, query: "a\nb" },
  ])
    assert.equal(searchRequest(x), null);
});
test("story search retains actual cross-company tickers without claiming stock identity", async () => {
  const { projectSearch } = await import("../lib/publication-search.ts");
  const result = projectSearch(raw, request);
  assert.deepEqual(result.rows[0].tickers, ["MSFT"]);
  assert.equal(result.rows[0].published, null);
  assert.equal(result.rows[0].assembledAt, "2023-11-14T22:13:20.000Z");
  assert.equal(
    projectSearch(
      [{ ...raw[0], cluster: { ...raw[0].cluster, storySource: "unknown" } }],
      request,
    ),
    null,
  );
});
test("document search drops copyrighted fields and unsafe links, preserves preview", async () => {
  const { projectSearch } = await import("../lib/publication-search.ts");
  const q = { ...request, kind: "links" };
  const r = projectSearch(
    { isPreview: true, previewReason: "LIMITED", data: doc },
    q,
  );
  assert.equal(r.preview, true);
  assert.equal(r.rows[0].title, "Publisher");
  assert.doesNotMatch(JSON.stringify(r), /Forbidden/);
  assert.equal(
    projectSearch(
      {
        ...doc,
        documents: [{ ...doc.documents[0], url: "javascript:alert(1)" }],
      },
      q,
    ).rows[0].url,
    null,
  );
});
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("route guards and authenticated route to transport projection to rendered results", async () => {
  const p = await import("../lib/publication-search.ts");
  let calls = 0;
  const transport = load(
    "lib/publication-search.server.ts",
    {
      ...p,
      HttpError,
      limit: async () => {},
      sentisenseFetch: createProviderFetch({
        config: () => providerConfig({}),
        reserve: async () => ({ allowed: true, retryAfterSeconds: 60 }),
        cooldown: async () => {},
      }),
      readBoundedMarketJson,
    },
    "readPublicationSearch",
  );
  let access = { sampleOnly: false };
  const get = load(
    "app/api/publication-search/route.ts",
    {
      ...p,
      HttpError,
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => access,
      requireFeature: (_a, f) => assert.equal(f, "news"),
      limit: async () => {},
      reserveAccess: async () => {},
      readBoundedMarketJson,
      readPublicationSearch: (q) =>
        transport(q, {
          key: "test-key",
          fetcher: async (url, init) => {
            calls++;
            assert.equal(
              new URL(url).pathname,
              "/api/v1/documents/stories/search",
            );
            assert.equal(new URL(url).searchParams.get("limit"), "20");
            assert.equal(init.redirect, "error");
            return Response.json(raw);
          },
        }),
      privateJson: (x) => x,
      failure: (e) => ({ error: e.message, status: e.status }),
    },
    "POST",
  );
  const req = () =>
    new Request("https://local.test/api/publication-search", {
      method: "POST",
      body: JSON.stringify(request),
    });
  access = { sampleOnly: true };
  assert.equal((await get(req())).status, 403);
  assert.equal(calls, 0);
  access = { sampleOnly: false };
  const result = await get(req());
  assert.equal(calls, 1);
  const View = load(
    "components/PublicationSearch.tsx",
    {
      React,
      useState: (initial) => [initial, () => {}],
      useResource: () => ({ data: result }),
      styles: {},
      searchRequest: p.searchRequest,
    },
    "SearchResults",
  );
  const html = renderToStaticMarkup(
    React.createElement(View, { data: result }),
  );
  assert.match(html, /Provider story/);
  assert.match(html, /MSFT/);
  assert.match(html, /not restricted to the current stock/);
});
test("search requires submit, sends only entered query and controls, never prefetched details", () => {
  const src = fs.readFileSync("components/PublicationSearch.tsx", "utf8");
  assert.match(src, /onSubmit/);
  assert.match(src, /sent to SentiSense/);
  assert.match(src, /api<SearchResult>\("publication-search", input\)/);
  assert.doesNotMatch(src, /portfolio|conversation|stories\//);
});
test("real search form is idle until explicit submit and sends no contextual fields", async () => {
  const p = await import("../lib/publication-search.ts");
  let calls = [];
  let index = 0;
  const values = ["NVDA earnings", "stories", 7, null, false, ""];
  const Component = load(
    "components/PublicationSearch.tsx",
    {
      React,
      styles: {},
      searchRequest: p.searchRequest,
      useState: () => [values[index++], () => {}],
      api: async (path, body) => {
        calls.push({ path, body });
        return p.projectSearch(raw, body);
      },
    },
    "PublicationSearch",
  );
  const tree = Component();
  assert.equal(calls.length, 0);
  const form = React.Children.toArray(tree.props.children).find(
    (x) => x.type === "form",
  );
  await form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls, [{ path: "publication-search", body: request }]);
});
test("news entitlement, authorization, quota and oversized body fail before provider acquisition", async () => {
  const p = await import("../lib/publication-search.ts");
  let calls = 0;
  for (const blocked of ["auth", "feature", "quota", "body"]) {
    const route = load(
      "app/api/publication-search/route.ts",
      {
        ...p,
        HttpError,
        readBoundedMarketJson,
        account: async () => {
          if (blocked === "auth") throw new HttpError("Sign in", 401);
          return { user: { id: "u" } };
        },
        requestAccess: async () => ({}),
        requireFeature: () => {
          if (blocked === "feature") throw new HttpError("Locked", 403);
        },
        limit: async () => {},
        reserveAccess: async () => {
          if (blocked === "quota") throw new HttpError("Quota", 429);
        },
        readPublicationSearch: async () => {
          calls++;
        },
        privateJson: (x) => x,
        failure: (e) => ({ status: e.status }),
      },
      "POST",
    );
    const r = await route(
      new Request("https://local.test/api/publication-search", {
        method: "POST",
        body: JSON.stringify(
          blocked === "body"
            ? { ...request, query: "x".repeat(3000) }
            : request,
        ),
      }),
    );
    assert.ok([400, 401, 403, 429].includes(r.status));
    assert.equal(calls, 0);
  }
});
test("source-links request uses fixed search endpoint and shared denial stops transport", async () => {
  const p = await import("../lib/publication-search.ts");
  let calls = 0;
  let allowed = true;
  const read = load(
    "lib/publication-search.server.ts",
    {
      ...p,
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      sentisenseFetch: createProviderFetch({
        config: () => providerConfig({}),
        reserve: async () => ({ allowed, retryAfterSeconds: 60 }),
        cooldown: async () => {},
      }),
    },
    "readPublicationSearch",
  );
  const fetcher = async (url) => {
    calls++;
    assert.equal(new URL(url).pathname, "/api/v1/documents/search");
    assert.equal(new URL(url).searchParams.get("days"), "14");
    return Response.json(doc);
  };
  const result = await read(
    { ...request, kind: "links", days: 14 },
    { key: "test", fetcher },
  );
  assert.equal(result.rows[0].title, "Publisher");
  allowed = false;
  await assert.rejects(
    read({ ...request, kind: "links", days: 14 }, { key: "test", fetcher }),
  );
  assert.equal(calls, 1);
});
test('publication search propagates request cancellation and does not dispatch already-aborted work', async()=>{
 const p=await import('../lib/publication-search.ts');let calls=0,limited=0;
 const read=load('lib/publication-search.server.ts',{...p,HttpError,limit:async()=>{limited++},readBoundedMarketJson,sentisenseFetch:async(_url,init)=>{calls++;assert.ok(init.signal.aborted);throw Error('aborted')}},'readPublicationSearch');
 const c=new AbortController();c.abort();await assert.rejects(read(request,{key:'fixture',signal:c.signal}));assert.equal(calls,0);assert.equal(limited,0);
});
