import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  analystActivityQuery,
  projectAnalystActivity,
} from "../lib/analyst-market-activity.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
import {
  createProviderFetch,
  providerConfig,
} from "../lib/sentisense-provider-core.ts";
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
  return new Function(...Object.keys(b), js + `;return ${name}`)(
    ...Object.values(b),
  );
}

let permits = 0;
const guard = createProviderFetch({
  config: () => providerConfig({}),
  reserve: async () => {
    permits++;
    return { allowed: true, retryAfterSeconds: 0 };
  },
  cooldown: async () => {},
});
const reader = () =>
  load(
    "lib/analyst-market-activity.server.ts",
    {
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      analystActivityQuery,
      projectAnalystActivity,
      sentisenseFetch: guard,
    },
    "readAnalystActivity",
  );
test("actual route→shared guard→fixed activity endpoint→render distinguishes market-wide actions", async () => {
  let called = "";
  const fetcher = async (url, init) => {
    called = url;
    assert.equal(init.redirect, "error");
    return Response.json({
      isPreview: false,
      totalCount: 1,
      data: [
        {
          ticker: "ABC",
          firm: "Example <Research>",
          actionDate: new Date(Date.now() - 86400000)
            .toISOString()
            .slice(0, 10),
          actionType: "UPGRADE",
          fromGrade: "Hold",
          toGrade: "Buy",
          priceTarget: 100,
        },
      ],
    });
  };
  const read = reader();
  const GET = load(
    "app/api/analyst-market-activity/route.ts",
    {
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({}),
      requireFeature: () => {},
      reserveAccess: async () => {},
      limit: async () => {},
      HttpError,
      privateJson: Response.json,
      failure: (e) => new Response(e.message, { status: e.status || 500 }),
      analystActivityQuery,
      readAnalystActivity: (q) => read(q, { key: "test", fetcher }),
    },
    "GET",
  );
  const response = await GET(
    new Request("https://app/api/analyst-market-activity"),
  );
  assert.equal(response.status, 200);
  assert.ok(permits > 0);
  assert.equal(
    called,
    "https://app.sentisense.ai/api/v1/analyst/activity?lookbackDays=30&limit=50&offset=0&actionTypes=UPGRADE%2CDOWNGRADE%2CINITIATE",
  );
  const data = await response.json();
  const C = load(
    "components/AnalystMarketActivity.tsx",
    {
      React,
      useState: (v) => [v, () => {}],
      useResource: () => ({ data, loading: false, error: null }),
      IntelligenceTable: ({ rows }) =>
        React.createElement("pre", null, JSON.stringify(rows)),
    },
    "AnalystActivityPage",
  );
  const html = renderToStaticMarkup(
    React.createElement(C, { days: 30, mode: "changes" }),
  );
  assert.match(html, /market-wide/i);
  assert.match(html, /&lt;Research&gt;/);
  assert.match(html, /UPGRADE/);
  assert.match(html, /split/);
  assert.equal(JSON.stringify(data).includes("priceTarget"), false);
});
test("auth/sample/analysts access rejects before provider", async () => {
  for (const mode of ["auth", "sample", "gate"]) {
    let n = 0;
    const GET = load(
      "app/api/analyst-market-activity/route.ts",
      {
        account: async () => {
          if (mode === "auth") throw new HttpError("no", 401);
          return { user: { id: "u" } };
        },
        requestAccess: async () => ({ sampleOnly: mode === "sample" }),
        requireFeature: (_a, f) => {
          assert.equal(f, "analysts");
          if (mode === "gate") throw new HttpError("no", 403);
        },
        reserveAccess: async () => {},
        limit: async () => {},
        HttpError,
        privateJson: Response.json,
        failure: (e) => new Response("", { status: e.status }),
        analystActivityQuery,
        readAnalystActivity: () => {
          n++;
        },
      },
      "GET",
    );
    assert.ok(
      (await GET(new Request("https://app/api/analyst-market-activity")))
        .status >= 400,
    );
    assert.equal(n, 0);
  }
});
test("bounded streaming response, neutral upstream error and retry recovery", async () => {
  const read = reader(),
    q = analystActivityQuery(new URLSearchParams());
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
  const C = load(
    "components/AnalystMarketActivity.tsx",
    {
      React,
      useState: () => [50, () => {}],
      useResource: () => ({ data: null, error: "limited", loading: false }),
      IntelligenceTable: () => null,
    },
    "AnalystActivityPage",
  );
  assert.match(
    renderToStaticMarkup(React.createElement(C, { days: 30, mode: "changes" })),
    /Return to first page/,
  );
});
test("known guard rate-limit exceptions retain 429 without leaking internal details", async () => {
  const read = load(
    "lib/analyst-market-activity.server.ts",
    {
      HttpError,
      limit: async () => {},
      readBoundedMarketJson,
      analystActivityQuery,
      projectAnalystActivity,
      sentisenseFetch: async () => {
        throw new HttpError("private internal detail", 429);
      },
    },
    "readAnalystActivity",
  );
  await assert.rejects(
    () =>
      read(analystActivityQuery(new URLSearchParams()), {
        key: "x",
        fetcher: async () => {
          throw Error("must not fetch");
        },
      }),
    (e) => e.status === 429 && !e.message.includes("private"),
  );
});
