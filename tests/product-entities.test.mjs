import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  productQuery,
  productHandle,
  productMatches,
  productDetail,
} from "../lib/product-entities.ts";
const match = () => [
  {
    name: "Synthetic product",
    urlSlug: "Example-Product",
    type: "product",
    ticker: null,
  },
];
const detail = () => ({
  entity: {
    id: "kb/product/1",
    displayName: "Synthetic product",
    type: "PRODUCT",
    urlSlug: "Example-Product",
    relatedStock: "MSFT",
    category: "software",
  },
  description: "Synthetic description",
  profile: {
    maker: {
      name: "Example maker",
      urlSlug: "Example-Maker",
      type: "COMPANY",
      ticker: null,
      listingCoverage: "private",
    },
    family: {
      name: "Example family",
      urlSlug: "Example-Family",
      type: "PRODUCT",
    },
    about: "Synthetic about",
    aliases: ["Example"],
  },
  latestMetrics: { sentiment: 0.2, mentions: 4.5, sentisense_score: 15 },
  relatedEntities: [],
});
test("product query and handle are bounded public identifiers, not URLs/tickers inferred from names", () => {
  assert.equal(productQuery(" ChatGPT "), "ChatGPT");
  for (const v of ["a", "a@example.com", "https://example.com", "x\ny"])
    assert.equal(productQuery(v), null);
  for (const v of [
    "kb/product/1",
    "kb-product-1",
    "../x",
    "http://x",
    "search",
    "popular",
  ])
    assert.equal(productHandle(v), null);
  assert.equal(productHandle("Apple-Siri"), "Apple-Siri");
  assert.equal(productMatches(match())[0].handle, "Example-Product");
});
test("search rejects people and non-null ticker rather than conflating entity with stock", () => {
  for (const change of [
    (x) => (x[0].type = "person"),
    (x) => (x[0].ticker = "MSFT"),
    (x) => (x[0].urlSlug = "kb/product/1"),
  ]) {
    const x = match();
    change(x);
    assert.equal(productMatches(x), null);
  }
});
test("detail verifies PRODUCT and exact returned slug, ignores private/profile extras and retains metric scales", () => {
  const p = productDetail(detail(), "Example-Product");
  assert.equal(p.maker.listingCoverage, "private");
  assert.equal(p.maker.ticker, null);
  assert.equal(p.metrics.mentions, 4.5);
  assert.equal(p.metrics.score, 15);
  assert.equal(p.metrics.sentiment, 0.2);
  assert.equal(p.id, undefined);
  assert.equal(p.relatedStock, undefined);
  assert.equal(p.asOf, undefined);
  for (const change of [
    (x) => (x.entity.type = "PERSON"),
    (x) => (x.entity.urlSlug = "Other"),
    (x) => (x.latestMetrics.sentiment = 2),
    (x) => (x.latestMetrics.mentions = -1),
    (x) => (x.latestMetrics.sentisense_score = [5]),
  ]) {
    const x = detail();
    change(x);
    assert.equal(productDetail(x, "Example-Product"), null);
  }
});
test("missing readings stay null and no preview wrapper is treated as complete detail", () => {
  const x = detail();
  x.latestMetrics = {};
  const p = productDetail(x, "Example-Product");
  assert.deepEqual(p.metrics, { score: null, sentiment: null, mentions: null });
  assert.equal(
    productDetail({ isPreview: true, data: detail() }, "Example-Product"),
    null,
  );
});

import fs from "node:fs";
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

test("fixed product search/detail transport bounded and excludes private/user endpoints", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const run = load(
    "lib/product-entities.server.ts",
    {
      HttpError,
      limit: async () => {},
      productQuery,
      productHandle,
      productMatches,
      productDetail,
      readBoundedMarketJson,
    },
    "readProductEntity",
  );
  let calls = 0;
  const fetcher = async (url, opt) => {
    calls++;
    assert.equal(opt.redirect, "error");
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/kb/entities/search?q=Example&type=product&limit=10",
    );
    return new Response(JSON.stringify(match()));
  };
  assert.equal(
    (await run("search", "Example", { key: "synthetic", fetcher })).data[0]
      .handle,
    "Example-Product",
  );
  await assert.rejects(
    run("popular", "Example", { key: "synthetic", fetcher }),
    (e) => e.status === 400,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    run("detail", "Example-Product", {
      key: "synthetic",
      fetcher: async () => new Response(" ".repeat(2000001)),
    }),
    (e) => e.status === 502,
  );
  await assert.rejects(
    run("detail", "Example-Product", {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
});
test("product route auth, sample, advanced feature and quota guard before request", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/product-entities/route.ts",
    {
      HttpError,
      productQuery,
      productHandle,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "test" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: (_, name) => {
        assert.equal(name, "advanced");
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readProductEntity: async () => {
        calls++;
        return {};
      },
      privateJson: (x) => ({ status: 200, data: x }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    new Request(
      "https://local.test/api/product-entities" +
        (q ?? "?mode=search&value=Example"),
    );
  auth = false;
  assert.equal((await get(req())).status, 401);
  auth = true;
  sample = true;
  assert.equal((await get(req())).status, 403);
  sample = false;
  feature = false;
  assert.equal((await get(req())).status, 403);
  feature = true;
  quota = false;
  assert.equal((await get(req())).status, 429);
  quota = true;
  for (const q of [
    "?mode=user&value=Example",
    "?mode=search&value=a",
    "?mode=detail&value=kb/product/1",
    "?mode=search&value=Example&value=Other",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(calls, 1);
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function ui(request, data) {
  const file = "components/ProductLookup.tsx";
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace("export default function", "function"))
    .join("\n");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  let state = 0,
    requested;
  const Component = providerFixtureFunction(
    "React",
    "useState",
    "useResource",
    "productQuery",
    "ProductAppHistory",
    "s",
    code + ";return ProductLookup;",
  )(
    React,
    (initial) => [state++ === 1 ? request : initial, () => {}],
    (url) => {
      requested = url;
      return { data, error: null, loading: false, refresh: () => {} };
    },
    productQuery,
    () => null,
    {},
  );
  return {
    html: renderToStaticMarkup(React.createElement(Component)),
    requested,
  };
}
test("product UI is lazy, treats handles as products and dates as unavailable", () => {
  assert.equal(ui(null, null).requested, null);
  const r = { mode: "detail", value: "Example-Product" };
  const d = {
    ...r,
    data: productDetail(detail(), r.value),
    retrievedAt: "2026-11-18T12:00:00Z",
  };
  const shown = ui(r, d);
  assert.equal(
    shown.requested,
    "product-entities?mode=detail&value=Example-Product",
  );
  assert.match(shown.html, /Synthetic product/);
  assert.match(shown.html, /7-day averages/);
  assert.match(shown.html, /Observation dates are not supplied/);
  assert.match(shown.html, /15/);
  assert.match(shown.html, /private/);
  assert.doesNotMatch(shown.html, /research\/MSFT/);
  assert.doesNotMatch(
    ui(r, { ...d, value: "Other" }).html,
    /Synthetic product/,
  );
});
test("real route to transport to projector to product UI preserves lookup identity", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = load(
    "lib/product-entities.server.ts",
    {
      HttpError,
      limit: async () => {},
      productQuery,
      productHandle,
      productMatches,
      productDetail,
      readBoundedMarketJson,
    },
    "readProductEntity",
  );
  const get = load(
    "app/api/product-entities/route.ts",
    {
      HttpError,
      productQuery,
      productHandle,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readProductEntity: (m, v) =>
        read(m, v, {
          key: "synthetic",
          fetcher: async () =>
            new Response(JSON.stringify(m === "search" ? match() : detail())),
        }),
      privateJson: (x) => x,
      failure: (e) => {
        throw e;
      },
    },
    "GET",
  );
  const search = await get(
    new Request(
      "https://local.test/api/product-entities?mode=search&value=Example",
    ),
  );
  const handle = search.data[0].handle;
  const d = await get(
    new Request(
      "https://local.test/api/product-entities?mode=detail&value=" + handle,
    ),
  );
  assert.match(
    ui({ mode: "detail", value: handle }, d).html,
    /Synthetic product/,
  );
});
