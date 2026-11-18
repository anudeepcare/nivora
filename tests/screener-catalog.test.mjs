import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
async function load() {
  assert.ok(
    fs.existsSync("lib/screener-catalog.ts"),
    "catalog projection exists",
  );
  return import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpileModule(fs.readFileSync("lib/screener-catalog.ts", "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString("base64")
  );
}
const field = {
  name: "MA_CROSS_STATE",
  label: "MA cross",
  group: "Technical",
  unit: "STATE",
  type: "ENUM",
  ops: ["EQ"],
  sortable: true,
  description: "Ordinal",
  options: [
    { value: -1, label: "Death cross" },
    { value: 0, label: "Neither" },
    { value: 1, label: "Golden cross" },
  ],
};
test("catalog preserves units enumeration zero and string choices with bounded whitelist", async () => {
  const { projectCatalog } = await load();
  const x = projectCatalog("fields", {
    stock: [field],
    etf: [
      {
        ...field,
        name: "ISSUER",
        type: "STRING",
        ops: ["IN", "NOT_IN"],
        values: ["Example"],
      },
    ],
  });
  assert.equal(x.stock[0].options[1].value, 0);
  assert.deepEqual(x.etf[0].values, ["Example"]);
  assert.equal(x.stock[0].unit, "STATE");
  assert.equal(
    projectCatalog("fields", { stock: [field, field], etf: [] }),
    null,
  );
  assert.equal(
    projectCatalog("fields", {
      stock: [{ ...field, ops: ["EXECUTE"] }],
      etf: [],
    }),
    null,
  );
});
test("curated plans are data only, bounded and normalized without inventing universe or personal saves", async () => {
  const { projectCatalog } = await load();
  const x = projectCatalog("screens", {
    screens: [
      {
        id: "example",
        name: "Example",
        summary: "A preset",
        plan: {
          filters: [{ fieldName: "MARKET_CAP", op: "GTE", value: "500M" }],
          sort: { fieldName: "MARKET_CAP", dir: "DESC" },
        },
      },
    ],
  });
  assert.equal(x.screens[0].universe, "STOCK");
  assert.equal(x.screens[0].filters[0].value, "500M");
  assert.equal(
    projectCatalog("screens", {
      screens: [
        {
          id: "bad",
          name: "Bad",
          plan: { filters: [{ fieldName: "X", op: "RUN", value: 1 }] },
        },
      ],
    }),
    null,
  );
});
function compiled(path) {
  assert.ok(fs.existsSync(path), path + " exists");
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
test("catalog route permits only fixed kind after account and advanced gate", async () => {
  const js = compiled("app/api/screener-catalog/route.ts");
  for (const deny of ["sample", "advanced", null]) {
    const calls = [],
      b = {
        HttpError,
        account: async () => ({ user: { id: "test" } }),
        requestAccess: async () => ({ sampleOnly: deny === "sample" }),
        requireFeature: (_, f) => {
          if (f === deny) throw new HttpError("Denied", 403);
        },
        limit: async () => {},
        reserveAccess: async () => {},
        readCatalog: async (kind) => {
          calls.push(kind);
          return { kind };
        },
        privateJson: (x) => x,
        failure: (e) => ({ status: e.status }),
      };
    const get = providerFixtureFunction(...Object.keys(b), js + ";return GET")(
      ...Object.values(b),
    );
    const x = await get(
      new Request("https://app.test/api/screener-catalog?kind=fields"),
    );
    assert.equal(deny ? x.status : x.kind, deny ? 403 : "fields");
    if (deny) assert.equal(calls.length, 0);
    else
      for (const q of [
        "kind=other",
        "kind=fields&kind=screens",
        "kind=fields&url=evil",
      ])
        assert.equal(
          (await get(new Request("https://app.test/api/screener-catalog?" + q)))
            .status,
          400,
        );
  }
});
test("catalog server fixed GET whitelist bounded body neutral errors and receipt cache", async () => {
  const js = compiled("lib/screener-catalog.server.ts"),
    { projectCatalog } = await load(),
    { createHash } = await import("node:crypto"),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = providerFixtureFunction(
    "projectCatalog",
    "createHash",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return readCatalog",
  )(
    projectCatalog,
    createHash,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  let calls = 0;
  const fetcher = async (u, o) => {
    calls++;
    assert.equal(u, "https://app.sentisense.ai/api/v1/screener/fields");
    assert.equal(o.redirect, "error");
    return new Response(JSON.stringify({ stock: [field], etf: [] }));
  };
  const a = await read("fields", { key: "test", fetcher }),
    b = await read("fields", { key: "test", fetcher });
  assert.equal(calls, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  await assert.rejects(
    read("execute", { key: "test", fetcher }),
    (e) => e.status === 400,
  );
  await assert.rejects(
    read("screens", {
      key: "test",
      fetcher: async () => new Response("SECRET", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("SECRET"),
  );
  await assert.rejects(
    read("screens", {
      key: "test",
      fetcher: async () => new Response("x".repeat(2100000)),
    }),
    (e) => e.status === 502,
  );
});
test("catalog UI exposes on-demand discovery without claiming personal saves or execution", () => {
  assert.ok(
    fs.existsSync("components/ScreenerCatalog.tsx"),
    "catalog UI exists",
  );
  const s = fs.readFileSync("components/ScreenerCatalog.tsx", "utf8");
  assert.match(s, /not your saved\s+screens/);
  assert.match(s, /not executed/);
  assert.match(s, /kind=\$\{kind\}/);
  assert.match(s, /slice\(page \* 20/);
  assert.match(s, /Source and freshness/);
});
test("actual catalog route and projection render field units and safe preset content in React", async () => {
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server"),
    { projectCatalog } = await load();
  const route = compiled("app/api/screener-catalog/route.ts"),
    bindings = {
      HttpError,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readCatalog: async (kind) => ({
        ...projectCatalog(
          kind,
          kind === "fields"
            ? { stock: [field], etf: [] }
            : {
                screens: [
                  {
                    id: "safe",
                    name: "<script>bad</script>",
                    summary: "A fixture",
                    plan: {
                      filters: [
                        { fieldName: "MARKET_CAP", op: "GTE", value: "500M" },
                      ],
                    },
                  },
                ],
              },
        ),
        receivedAt: "2026-11-18T00:00:00Z",
      }),
      privateJson: (x) => Response.json(x),
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status ?? 500 }),
    };
  const get = providerFixtureFunction(...Object.keys(bindings), route + ";return GET")(
    ...Object.values(bindings),
  );
  const src = fs.readFileSync("components/ScreenerCatalog.tsx", "utf8"),
    ast = ts.createSourceFile(
      "c.tsx",
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
  for (const kind of ["fields", "screens"]) {
    const data = await (
      await get(new Request(`https://test/api/screener-catalog?kind=${kind}`))
    ).json();
    const useResource = (key) => {
      assert.equal(key, `screener-catalog?kind=${kind}`);
      return { data, error: "", loading: false, refresh() {} };
    };
    const C = providerFixtureFunction(
      "React",
      "useState",
      "useResource",
      "s",
      js + ";return CatalogContent",
    )(
      React,
      (x) => [x, () => {}],
      useResource,
      new Proxy({}, { get: (_, k) => k }),
    );
    const html = renderToStaticMarkup(
      React.createElement(C, { kind, universe: "STOCK" }),
    );
    if (kind === "fields") {
      assert.match(html, /STATE/);
      assert.match(html, /0.*Neither/);
      assert.match(html, /Comparisons:.*EQ/);
    } else {
      assert.match(html, /MARKET_CAP.*GTE.*500M/);
      assert.ok(!html.includes("<script>"));
      assert.match(html, /not a recommendation/);
    }
  }
});

test("catalog refresh resets pagination before replacing snapshot", () => {
  const s = fs.readFileSync("components/ScreenerCatalog.tsx", "utf8");
  assert.match(s, /setPage\(0\);\s*resource.refresh\(\)/);
});
