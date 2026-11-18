import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { activityQuery, projectActivity } from "../lib/politician-activity.ts";
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

const reader = () =>
  load(
    "lib/politician-activity.server.ts",
    {
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      activityQuery,
      projectActivity,
    },
    "readActivity",
  );
test("actual private route→fixed activity endpoint→projection→render retains disclosure basis", async () => {
  let called = "";
  const fetcher = async (url, init) => {
    called = url;
    assert.equal(init.redirect, "error");
    const day = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return Response.json({
      isPreview: false,
      totalCount: 1,
      data: [
        {
          politicianName: "Example <Member>",
          bioguideId: "E000001",
          chamber: "HOUSE",
          ticker: "ABC",
          assetType: "ETF",
          transactionType: "SALE",
          transactionDate: day,
          disclosureDate: day,
          amountRange: "$1,001 - $15,000",
          owner: "Joint",
        },
      ],
    });
  };
  const read = reader();
  const GET = load(
    "app/api/politician-activity/route.ts",
    {
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({}),
      requireFeature: () => {},
      reserveAccess: async () => {},
      limit: async () => {},
      HttpError,
      privateJson: Response.json,
      failure: (e) => new Response(e.message, { status: e.status || 500 }),
      activityQuery,
      readActivity: (q) => read(q, { key: "x", fetcher }),
    },
    "GET",
  );
  const response = await GET(
    new Request("https://app/api/politician-activity?days=30"),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(
    called,
    "https://app.sentisense.ai/api/v1/politicians/activity?lookbackDays=30&limit=50&offset=0",
  );
  const C = load(
    "components/PoliticianActivity.tsx",
    {
      React,
      useState: (v) => [v, () => {}],
      useResource: () => ({ data, loading: false, error: null }),
      IntelligenceTable: ({ rows }) =>
        React.createElement("pre", null, JSON.stringify(rows)),
    },
    "ActivityPage",
  );
  const html = renderToStaticMarkup(React.createElement(C, { days: 30 }));
  assert.match(html, /Disclosure date/);
  assert.match(html, /Transaction date/);
  assert.match(html, /Joint/);
  assert.match(html, /ETF/);
  assert.match(html, /&lt;Member&gt;/);
  assert.match(html, /not exact amounts/);
});
test("sample/auth/access rejection precedes provider", async () => {
  for (const mode of ["auth", "sample", "gate"]) {
    let n = 0;
    const GET = load(
      "app/api/politician-activity/route.ts",
      {
        account: async () => {
          if (mode === "auth") throw new HttpError("no", 401);
          return { user: { id: "u" } };
        },
        requestAccess: async () => ({ sampleOnly: mode === "sample" }),
        requireFeature: () => {
          if (mode === "gate") throw new HttpError("no", 403);
        },
        reserveAccess: async () => {},
        limit: async () => {},
        HttpError,
        privateJson: Response.json,
        failure: (e) => new Response("", { status: e.status }),
        activityQuery,
        readActivity: () => {
          n++;
        },
      },
      "GET",
    );
    assert.ok(
      (await GET(new Request("https://app/api/politician-activity"))).status >=
        400,
    );
    assert.equal(n, 0);
  }
});
test("bounded transport neutralizes upstream and oversized responses", async () => {
  const read = reader(),
    q = activityQuery(new URLSearchParams());
  await assert.rejects(
    () =>
      read(q, {
        key: "x",
        fetcher: async () => new Response("private", { status: 500 }),
      }),
    /source unavailable/,
  );
  await assert.rejects(
    () =>
      read(q, {
        key: "x",
        fetcher: async () => new Response("x".repeat(2000001)),
      }),
    /safely/,
  );
});
