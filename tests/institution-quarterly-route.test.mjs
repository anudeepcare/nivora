import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  quarterlyQuery,
  selectQuarter,
  projectQuarterly,
} from "../lib/institution-quarterly.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
function load(file, b, name) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
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
  const js = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return providerFixtureFunction(...Object.keys(b), js + `;return ${name}`)(
    ...Object.values(b),
  );
}
const read = () =>
  load(
    "lib/institution-quarterly.server.ts",
    {
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      quarterlyQuery,
      selectQuarter,
      projectQuarterly,
    },
    "readQuarterly",
  );
const quarters = [{ reportDate: "2026-06-30", pending: false }];
test("actual route→two fixed requests→projection→UI preserves quarter and safe financial wording", async () => {
  const calls = [];
  const reader = read();
  const fetcher = async (url, init) => {
    calls.push(url);
    assert.equal(init.redirect, "error");
    return Response.json(
      calls.length === 1
        ? quarters
        : {
            isPreview: false,
            data: [
              {
                baseTicker: "ABC",
                companyName: "<script>bad</script>",
                totalValue: 12,
              },
            ],
          },
    );
  };
  const GET = load(
    "app/api/institution-quarterly/route.ts",
    {
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({}),
      requireFeature: () => {},
      reserveAccess: async () => {},
      limit: async () => {},
      HttpError,
      privateJson: Response.json,
      failure: (e) => new Response(e.message, { status: e.status || 500 }),
      quarterlyQuery,
      readQuarterly: (q) => reader(q, { key: "test", fetcher }),
    },
    "GET",
  );
  const response = await GET(
    new Request("https://app/api/institution-quarterly?view=bonds"),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.reportDate, "2026-06-30");
  assert.deepEqual(calls, [
    "https://app.sentisense.ai/api/v1/institutional/quarters",
    "https://app.sentisense.ai/api/v1/institutional/bonds?reportDate=2026-06-30",
  ]);
  const C = load(
    "components/InstitutionQuarterly.tsx",
    {
      React,
      useState: (v) => [v, () => {}],
      useResource: () => ({ data, loading: false, error: null }),
      IntelligenceTable: ({ rows }) =>
        React.createElement("pre", null, JSON.stringify(rows)),
    },
    "QuarterlyData",
  );
  const html = renderToStaticMarkup(React.createElement(C, { view: "bonds" }));
  assert.match(html, /2026-06-30/);
  assert.match(html, /not live trades/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  data.rows = [];
  data.returnedCount = 1;
  data.omitted = 1;
  assert.match(
    renderToStaticMarkup(React.createElement(C, { view: "bonds" })),
    /No usable positions/,
  );
});
test("auth/sample/gate failures do not contact provider", async () => {
  for (const mode of ["auth", "sample", "gate"]) {
    let called = 0;
    const GET = load(
      "app/api/institution-quarterly/route.ts",
      {
        account: async () => {
          if (mode === "auth") throw new HttpError("Denied", 401);
          return { user: { id: "u" } };
        },
        requestAccess: async () => ({ sampleOnly: mode === "sample" }),
        requireFeature: () => {
          if (mode === "gate") throw new HttpError("Denied", 403);
        },
        reserveAccess: async () => {},
        limit: async () => {},
        HttpError,
        privateJson: Response.json,
        failure: (e) => new Response("", { status: e.status }),
        quarterlyQuery,
        readQuarterly: () => {
          called++;
        },
      },
      "GET",
    );
    assert.ok(
      (
        await GET(
          new Request("https://app/api/institution-quarterly?view=bonds"),
        )
      ).status >= 400,
    );
    assert.equal(called, 0);
  }
});
test("pending/unknown quarter stops before dataset; bounded transport and neutral failures", async () => {
  const reader = read();
  let n = 0;
  await assert.rejects(() =>
    reader(
      { view: "options", reportDate: "2026-03-31" },
      {
        key: "x",
        fetcher: async () => {
          n++;
          return Response.json(quarters);
        },
      },
    ),
  );
  assert.equal(n, 1);
  await assert.rejects(
    () =>
      reader(
        { view: "bonds", reportDate: "" },
        {
          key: "x",
          fetcher: async () =>
            new Response("private provider error", { status: 500 }),
        },
      ),
    /source unavailable/,
  );
  await assert.rejects(
    () =>
      reader(
        { view: "bonds", reportDate: "" },
        { key: "x", fetcher: async () => new Response("x".repeat(2000001)) },
      ),
    /safely/,
  );
});
