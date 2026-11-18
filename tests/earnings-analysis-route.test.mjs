import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  earningsAnalysisQuery,
  projectEarningsAnalysis,
} from "../lib/earnings-analysis.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
function fn(file, name, b) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const node = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const js = ts.transpileModule(node.getText(source).replace(/^export /, ""), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return providerFixtureFunction(...Object.keys(b), js + `;return ${name}`)(
    ...Object.values(b),
  );
}
function server() {
  return fn("lib/earnings-analysis.server.ts", "readEarningsAnalysis", {
    HttpError,
    limit: async () => {},
    readBoundedMarketJson,
    projectEarningsAnalysis,
    earningsAnalysisQuery,
  });
}
function render(data) {
  const file = "components/EarningsAnalysisPanel.tsx",
    ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export default /, ""))
    .join("\n");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const b = {
    React,
    Link: ({ children, ...p }) => React.createElement("a", p, children),
    useResource: () => ({ data, loading: false, error: "" }),
    s: new Proxy({}, { get: (_, k) => k }),
  };
  const C = providerFixtureFunction(
    ...Object.keys(b),
    js + ";return EarningsAnalysisPanel",
  )(...Object.values(b));
  return renderToStaticMarkup(React.createElement(C, { view: data.view }));
}
test("authenticated route→fixed upstream→closed projection→render preserves dated identity and escapes editorial text", async () => {
  const now = Date.now(),
    date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
    }).format(now);
  let calls = 0;
  const read = server();
  const fake = async (url, init) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/earnings/recent?days=7&limit=25",
    );
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal);
    return new Response(
      JSON.stringify({
        isPreview: false,
        data: [
          {
            ticker: "ABC",
            reportDate: date,
            headline: "<script>alert(1)</script>",
            generatedAt: Math.floor(now / 1000),
            secret: "omit",
          },
        ],
      }),
    );
  };
  const gates = [];
  const GET = fn("app/api/earnings-analysis/route.ts", "GET", {
    account: async () => ({ user: { id: "owner" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: (_, f) => gates.push(f),
    earningsAnalysisQuery,
    HttpError,
    limit: async () => gates.push("limit"),
    reserveAccess: async () => gates.push("reserve"),
    readEarningsAnalysis: (q) => read(q, { key: "fixture", fetcher: fake }),
    privateJson: (x) => x,
    failure: (e) => {
      throw e;
    },
  });
  const d = await GET(
    new Request("https://local/api/earnings-analysis?view=recent"),
  );
  assert.deepEqual(gates, ["overview", "analysts", "news", "limit", "reserve"]);
  assert.equal(calls, 1);
  assert.equal(d.rows[0].ticker, "ABC");
  assert.equal(d.rows[0].secret, undefined);
  const html = render(d);
  assert.match(html, /ABC/);
  assert.match(html, /Provider editorial summary/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
test("auth, feature, sample and invalid query failures occur before upstream reads", async () => {
  for (const mode of ["auth", "feature", "sample", "query"]) {
    let reads = 0;
    const GET = fn("app/api/earnings-analysis/route.ts", "GET", {
      account: async () => {
        if (mode === "auth") throw new HttpError("Sign in", 401);
        return { user: { id: "self" } };
      },
      requestAccess: async () => ({ sampleOnly: mode === "sample" }),
      requireFeature: () => {
        if (mode === "feature") throw new HttpError("Not enabled", 403);
      },
      earningsAnalysisQuery,
      HttpError,
      limit: async () => {},
      reserveAccess: async () => {},
      readEarningsAnalysis: async () => {
        reads++;
      },
      privateJson: (x) => x,
      failure: (e) => ({ status: e.status }),
    });
    const r = await GET(
      new Request(
        "https://local/api?" +
          (mode === "query" ? "view=recent&url=https://bad" : "view=recent"),
      ),
    );
    assert.equal(
      r.status,
      mode === "auth" ? 401 : mode === "query" ? 400 : 403,
    );
    assert.equal(reads, 0);
  }
});
test("transport rejects oversized responses, neutralizes provider errors and cannot follow supplied paths", async () => {
  const read = server();
  await assert.rejects(
    read(earningsAnalysisQuery(new URLSearchParams("view=recent")), {
      key: "fixture",
      fetcher: async () => new Response("x".repeat(2000001)),
    }),
    (e) => e.status === 502,
  );
  await assert.rejects(
    read(earningsAnalysisQuery(new URLSearchParams("view=recent")), {
      key: "fixture",
      fetcher: async () => new Response("SECRET", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("SECRET"),
  );
  let seen;
  await read(
    { view: "recent", path: "https://evil" },
    {
      key: "fixture",
      fetcher: async (u) => {
        seen = u;
        return new Response(JSON.stringify({ isPreview: false, data: [] }));
      },
    },
  );
  assert.equal(
    seen,
    "https://app.sentisense.ai/api/v1/earnings/recent?days=7&limit=25",
  );
});
test("calendar renders exactly one selected view and keeps source-date keys", () => {
  const s = fs.readFileSync("components/GlobalEarningsCalendar.tsx", "utf8");
  assert.match(s, /view === "calendar" \?/);
  assert.match(s, /key=\{`\$\{view\}:\$\{day\}`\}/);
  assert.match(s, /import\("\.\/EarningsAnalysisPanel"\)/);
});
