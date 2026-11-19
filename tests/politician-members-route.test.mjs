import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  politicianQuery,
  projectDirectory,
  projectMember,
} from "../lib/politician-members.ts";
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

const member = {
  urlSlug: "Example-Member",
  bioguideId: "E000001",
  displayName: "Example <Member>",
  chamber: "HOUSE",
  party: "Independent",
  state: "CA",
  former: true,
  servedUntil: "2021",
};
const reader = () =>
  load(
    "lib/politician-members.server.ts",
    {
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      politicianQuery,
      projectDirectory,
      projectMember,
    },
    "readPoliticians",
  );
test("route→verified directory identity→member page→render keeps range and both dates", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    return Response.json(
      calls.length === 1
        ? { data: { members: [member], totalCount: 1 } }
        : {
            isPreview: false,
            totalCount: 1,
            data: {
              profile: member,
              recentTrades: [
                {
                  ticker: "ABC",
                  transactionType: "PURCHASE",
                  transactionDate: "2021-01-01",
                  disclosureDate: "2021-02-01",
                  amountRange: "$1,001 - $15,000",
                  owner: "Spouse",
                },
              ],
            },
          },
    );
  };
  const read = reader();
  const GET = load(
    "app/api/politician-members/route.ts",
    {
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({}),
      requireFeature: () => {},
      reserveAccess: async () => {},
      limit: async () => {},
      HttpError,
      privateJson: Response.json,
      failure: (e) => new Response(e.message, { status: e.status || 500 }),
      politicianQuery,
      readPoliticians: (q) => read(q, { key: "x", fetcher }),
    },
    "GET",
  );
  const response = await GET(
    new Request(
      "https://app/api/politician-members?slug=Example-Member&bioguideId=E000001",
    ),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(calls.length, 2);
  assert.match(calls[0], /politicians\/directory\?/);
  assert.match(calls[1], /member\/Example-Member\?limit=50&offset=0/);
  const C = load(
    "components/PoliticianMembers.tsx",
    {
      React,
      useState: (v) => [v, () => {}],
      useResource: () => ({ data, loading: false, error: null }),
      IntelligenceTable: ({ rows }) =>
        React.createElement("pre", null, JSON.stringify(rows)),
    },
    "MemberHistory",
  );
  const html = renderToStaticMarkup(React.createElement(C, { member }));
  assert.match(html, /Former/);
  assert.match(html, /2021-01-01/);
  assert.match(html, /2021-02-01/);
  assert.match(html, /1,001 - \$15,000/);
  assert.match(html, /&lt;Member&gt;/);
  assert.match(html, /not exact amounts/);
});
test("failed authentication/feature/sample checks do not fetch", async () => {
  for (const mode of ["auth", "sample", "gate"]) {
    let n = 0;
    const GET = load(
      "app/api/politician-members/route.ts",
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
        politicianQuery,
        readPoliticians: () => {
          n++;
        },
      },
      "GET",
    );
    assert.ok(
      (await GET(new Request("https://app/api/politician-members"))).status >=
        400,
    );
    assert.equal(n, 0);
  }
});
test("unverified identity stops before member request; size cap and upstream errors neutral", async () => {
  const read = reader();
  let n = 0;
  const q = politicianQuery(
    new URLSearchParams("slug=Example-Member&bioguideId=E000001"),
  );
  await assert.rejects(() =>
    read(q, {
      key: "x",
      fetcher: async () => {
        n++;
        return Response.json({
          data: {
            members: [{ ...member, bioguideId: "X000001" }],
            totalCount: 1,
          },
        });
      },
    }),
  );
  assert.equal(n, 1);
  await assert.rejects(
    () =>
      read(politicianQuery(new URLSearchParams()), {
        key: "x",
        fetcher: async () => new Response("private error", { status: 500 }),
      }),
    /source unavailable/,
  );
  await assert.rejects(
    () =>
      read(politicianQuery(new URLSearchParams()), {
        key: "x",
        fetcher: async () => new Response("x".repeat(2000001)),
      }),
    /safely/,
  );
});
test("unavailable later page offers return to first page rather than repeated paging", () => {
  const C = load(
    "components/PoliticianMembers.tsx",
    {
      React,
      useState: (v) => [50, () => {}],
      useResource: () => ({ data: null, loading: false, error: "unavailable" }),
      IntelligenceTable: () => null,
    },
    "MemberHistory",
  );
  assert.match(
    renderToStaticMarkup(React.createElement(C, { member })),
    /Return to first page/,
  );
});
