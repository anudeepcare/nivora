import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { productHandle } from "../lib/product-entities.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
import {
  createProviderFetch,
  providerConfig,
} from "../lib/sentisense-provider-core.ts";
const fixture = () => [
  {
    type: "PRODUCT",
    relatedStock: "NVDA",
    urlSlug: "GeForce-RTX",
    displayName: "GeForce RTX",
    category: "graphics_card",
  },
  {
    type: "PERSON",
    relatedStock: "NVDA",
    urlSlug: "Jensen-Huang",
    displayName: "Jensen Huang",
  },
];
function load(file, b, name) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) =>
        n
          .getText(ast)
          .replace(/^export default /, "")
          .replace(/^export /, ""),
      )
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  return new Function(...Object.keys(b), js + ";return " + name)(
    ...Object.values(b),
  );
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("company product discovery validates company and product relatedStock and public handles", async () => {
  const { companyProducts } = await import("../lib/company-products.ts");
  const r = companyProducts(fixture(), "NVDA");
  assert.equal(r.products.length, 1);
  assert.equal(r.products[0].handle, "GeForce-RTX");
  assert.equal(companyProducts(fixture(), "AMD"), null);
  for (const mutate of [
    (x) => (x[1].relatedStock = "AMD"),
    (x) => (x[0].urlSlug = "kb_product_0"),
    (x) => (x[0].urlSlug = "../../secret"),
    (x) => x.push(x[0]),
  ]) {
    const x = fixture();
    mutate(x);
    assert.equal(companyProducts(x, "NVDA"), null);
  }
  const other = fixture();
  other[0].relatedStock = "AMD";
  assert.equal(companyProducts(other, "NVDA"), null);
});
test("preview and missing metadata do not become ownership or zero coverage claims", async () => {
  const { companyProducts } = await import("../lib/company-products.ts");
  assert.equal(
    companyProducts({ ...fixture(), isPreview: true }, "NVDA"),
    null,
  );
  const x = fixture();
  x[0].appId = "12345";
  assert.equal(companyProducts(x, "NVDA").products[0].trackedApp, true);
  assert.doesNotMatch(
    JSON.stringify(companyProducts(x, "NVDA")),
    /owner|revenue|sentiment|kb\//,
  );
});
test("authenticated route through actual guard acquires one fixed company detail without fanout", async () => {
  const p = await import("../lib/company-products.ts");
  let calls = 0;
  const read = load(
    "lib/company-products.server.ts",
    {
      ...p,
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      sentisenseFetch: createProviderFetch({
        config: () => providerConfig({}),
        reserve: async () => ({ allowed: true, retryAfterSeconds: 60 }),
        cooldown: async () => {},
      }),
    },
    "readCompanyProducts",
  );
  const options = {
    key: "synthetic",
    fetcher: async (url, init) => {
      calls++;
      assert.equal(
        url,
        "https://app.sentisense.ai/api/v1/stocks/NVDA/entities",
      );
      assert.equal(init.redirect, "error");
      return Response.json(fixture());
    },
  };
  let blocked = false;
  const route = load(
    "app/api/company-products/route.ts",
    {
      ...p,
      HttpError,
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({ sampleOnly: blocked }),
      requireFeature: (_a, f) => assert.equal(f, "advanced"),
      limit: async () => {},
      reserveAccess: async () => {},
      readCompanyProducts: (symbol) => read(symbol, options),
      privateJson: (x) => x,
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const result = await route(new Request("https://local.test/?symbol=NVDA"));
  assert.equal(result.products[0].name, "GeForce RTX");
  assert.equal(calls, 1);
  const { productQuery } = await import("../lib/product-entities.ts");
  let index = 0;
  const Component = load(
    "components/ProductLookup.tsx",
    {
      React,
      productQuery,
      ProductAppHistory: () => null,
      s: {},
      useState: (initial) => [
        index++ === 1 ? { mode: "company", value: "NVDA" } : initial,
        () => {},
      ],
      useResource: () => ({ data: result, loading: false }),
    },
    "ProductLookup",
  );
  const html = renderToStaticMarkup(
    React.createElement(Component, { companySymbol: "NVDA" }),
  );
  assert.match(html, /GeForce RTX/);
  assert.match(html, /not ownership/);
  blocked = true;
  assert.equal(
    (await route(new Request("https://local.test/?symbol=NVDA"))).status,
    403,
  );
  assert.equal(calls, 1);
});
test("existing product view is company opt-in and opens only selected handle", () => {
  const src = fs.readFileSync("components/ProductLookup.tsx", "utf8");
  assert.match(src, /company-products\?symbol=/);
  assert.match(src, /Load linked products/);
  assert.match(src, /not ownership/);
  assert.match(src, /mode: "detail", value: item.handle/);
  const mount = fs.readFileSync("components/CompanyRelationships.tsx", "utf8");
  assert.match(mount, /<ProductLookup key=\{symbol\} companySymbol=\{symbol\}/);
});
test("company discovery renders inside existing product view without initial request or metrics fanout", async () => {
  const { companyProducts } = await import("../lib/company-products.ts");
  const { productQuery } = await import("../lib/product-entities.ts");
  let keys = [],
    writes = [],
    i = 0;
  let selected = null;
  let result = null;
  function render() {
    i = 0;
    const Component = load(
      "components/ProductLookup.tsx",
      {
        React,
        productQuery,
        ProductAppHistory: () => null,
        s: {},
        useState: (initial) => {
          const n = i++;
          return [
            n === 1 ? selected : initial,
            (v) => {
              if (n === 1) {
                selected = v;
                writes.push(v);
              }
            },
          ];
        },
        useResource: (key) => {
          keys.push(key);
          return { data: result, loading: false, refresh() {} };
        },
      },
      "ProductLookup",
    );
    return Component({ companySymbol: "NVDA" });
  }
  const tree = render();
  assert.equal(keys.at(-1), null);
  const walk = (node) =>
    node && typeof node === "object"
      ? [node, ...React.Children.toArray(node.props?.children).flatMap(walk)]
      : [];
  walk(tree)
    .find(
      (x) => x.type === "button" && x.props.children === "Load linked products",
    )
    .props.onClick();
  assert.deepEqual(selected, { mode: "company", value: "NVDA" });
  result = companyProducts(fixture(), "NVDA");
  const found = render();
  assert.equal(keys.at(-1), "company-products?symbol=NVDA");
  const html = renderToStaticMarkup(found);
  assert.match(html, /GeForce RTX/);
  assert.match(html, /not ownership/);
  assert.match(html, /related entities/);
  walk(found)
    .find((x) => x.type === "button" && x.props.children === "GeForce RTX")
    .props.onClick();
  assert.deepEqual(selected, { mode: "detail", value: "GeForce-RTX" });
  assert.equal(writes.length, 2);
  assert.ok(keys.every((x) => !x || !x.includes("metrics")));
  result = { ...result, symbol: "AMD" };
  selected = { mode: "company", value: "NVDA" };
  assert.doesNotMatch(renderToStaticMarkup(render()), /GeForce RTX/);
});

test("null product handles are disclosed as omitted and product count is bounded", async () => {
  const { companyProducts } = await import("../lib/company-products.ts");
  const rows = fixture();
  rows[0].urlSlug = null;
  const omitted = companyProducts(rows, "NVDA");
  assert.equal(omitted.products.length, 0);
  assert.equal(omitted.omittedHandles, 1);
  const many = Array.from({ length: 51 }, (_, i) => ({
    ...fixture()[0],
    urlSlug: `Product-${i}`,
  }));
  const bounded = companyProducts(many, "NVDA");
  assert.equal(bounded.products.length, 50);
  assert.equal(bounded.truncated, true);
  assert.equal(bounded.products[0].trackedApp, null);
});
