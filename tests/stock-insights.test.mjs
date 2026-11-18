import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { stockInsights, insightRequest } from "../lib/stock-insights.ts";
const now = Date.parse("2026-11-18T02:00:00Z");
const row = () => ({
  insightId: "sample",
  insightType: "ai_risk_assessment",
  ticker: "GOOG",
  category: "FUNDAMENTAL",
  insightText: "Synthetic test only",
  confidence: 0.8,
  urgency: "high",
  generatedAt: now / 1000 - 60,
  docRefs: [{ url: "https://example.com/filing", type: "SEC" }],
});
const raw = () => ({
  isPreview: true,
  previewReason: "PRO_REQUIRED",
  totalCount: 10,
  data: [row()],
});
test("projection preserves attributed scores, dates, preview, sources, without invented missing values", () => {
  const p = stockInsights(raw(), "GOOG", now);
  assert.equal(p.preview, true);
  assert.equal(p.total, 10);
  assert.equal(p.rows[0].confidence, 0.8);
  assert.equal(p.rows[0].generatedAt, new Date(now - 60000).toISOString());
  assert.equal(p.rows[0].sources[0].url, "https://example.com/filing");
  const x = raw();
  x.data[0].confidence = null;
  x.data[0].docRefs = null;
  assert.equal(stockInsights(x, "GOOG", now).rows[0].confidence, null);
});
test("strict share class identity, primitive numeric domains and generation time", () => {
  for (const alter of [
    (x) => (x.data[0].ticker = "GOOGL"),
    (x) => (x.data[0].ticker = null),
    (x) => (x.data[0].confidence = 2),
    (x) => (x.data[0].confidence = [0.2]),
    (x) => (x.data[0].generatedAt = now / 1000 + 1),
    (x) => (x.data[0].category = "UNKNOWN"),
    (x) => x.data.push(row()),
  ]) {
    const x = raw();
    alter(x);
    assert.equal(stockInsights(x, "GOOG", now), null);
  }
  const x = raw();
  x.data[0].docRefs = [{ url: "javascript:alert(1)", type: "x" }];
  assert.deepEqual(stockInsights(x, "GOOG", now).rows[0].sources, []);
});
test("fixed current or thirty Eastern calendar days only, no personalized paths", () => {
  assert.deepEqual(insightRequest("GOOG", "current", now), {
    symbol: "GOOG",
    mode: "current",
    path: "/stock/GOOG",
    start: null,
    end: null,
  });
  const p = insightRequest("GOOG", "month", now);
  assert.equal(p.end, "2026-11-17");
  assert.equal(p.start, "2026-10-19");
  assert.equal(
    p.path,
    "/stock/GOOG/range?startDate=2026-10-19&endDate=2026-11-17",
  );
  for (const [s, m] of [
    ["../user", "current"],
    ["GOOG", "user"],
    ["GOOG", "latest"],
  ])
    assert.equal(insightRequest(s, m, now), null);
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
  return providerFixtureFunction(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

test("server fixed paths, bounded body, rejected identity and sanitized failure", async () => {
  const run = load(
    "lib/stock-insights.server.ts",
    {
      HttpError,
      limit: async () => {},
      insightRequest,
      stockInsights,
      readBoundedMarketJson: async (r) => r.json(),
    },
    "readStockInsights",
  );
  let calls = 0;
  const fetcher = async (url, opt) => {
    calls++;
    assert.equal(url, "https://app.sentisense.ai/api/v1/insights/stock/GOOG");
    assert.equal(opt.redirect, "error");
    return new Response(JSON.stringify(raw()));
  };
  const p = await run("GOOG", "current", { key: "synthetic", fetcher, now });
  assert.equal(p.symbol, "GOOG");
  assert.equal(calls, 1);
  await assert.rejects(
    run("GOOG", "user", { key: "synthetic", fetcher, now }),
    (e) => e.status === 400,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    run("GOOG", "current", {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
      now,
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
  await assert.rejects(
    run("GOOG", "current", {
      key: "synthetic",
      fetcher: async () => {
        const x = raw();
        x.data[0].ticker = "GOOGL";
        return new Response(JSON.stringify(x));
      },
      now,
    }),
    (e) => e.status === 502,
  );
});
test("route auth, product feature, quota and strict request guard precede transport", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/stock-insights/route.ts",
    {
      HttpError,
      insightRequest,
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
      readStockInsights: async () => {
        calls++;
        return {};
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    new Request(
      "https://local.test/api/stock-insights" +
        (q ?? "?symbol=GOOG&mode=current"),
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
    "?symbol=GOOG&mode=user",
    "?symbol=GOOG&symbol=GOOGL",
    "?symbol=GOOG&url=https://evil",
    "?symbol=../user",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(calls, 1);
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function ui(selected, data) {
  const file = "components/StockInsights.tsx";
  const source = fs
    .readFileSync(file, "utf8")
    .replace(/^import .*;\n/gm, "")
    .replace("export default function", "function");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  let state = 0;
  let requested;
  const Component = providerFixtureFunction(
    "React",
    "useState",
    "useResource",
    "s",
    "styles",
    code + ";return StockInsights;",
  )(
    React,
    (initial) => [state++ === 0 ? selected : initial, () => {}],
    (url) => {
      requested = url;
      return { data, loading: false, error: null, refresh: () => {} };
    },
    { tabs: "tabs" },
    { rows: "rows" },
  );
  return {
    html: renderToStaticMarkup(
      React.createElement(Component, { symbol: "GOOG" }),
    ),
    requested,
  };
}
test("UI makes no initial request and retains preview, attribution and sources after selection", () => {
  const initial = ui(null, null);
  assert.equal(initial.requested, null);
  assert.match(initial.html, /Select a window/);
  const data = {
    ...stockInsights(raw(), "GOOG", now),
    mode: "current",
    start: null,
    end: null,
  };
  const shown = ui("current", data);
  assert.equal(shown.requested, "stock-insights?symbol=GOOG&mode=current");
  assert.match(shown.html, /Synthetic test only/);
  assert.match(shown.html, /Provider confidence/);
  assert.match(shown.html, /not a return probability/);
  assert.match(shown.html, /Limited provider preview/);
  assert.match(shown.html, /https:\/\/example.com\/filing/);
  assert.doesNotMatch(
    ui("current", { ...data, symbol: "GOOGL" }).html,
    /Synthetic test only/,
  );
});

test("documented personalized category is retained only from fixed stock response, never requests user feed", () => {
  const x = raw();
  x.data[0].category = "PERSONALIZED";
  assert.equal(stockInsights(x, "GOOG", now).rows[0].category, "PERSONALIZED");
});
test("range transport enforces Eastern inclusive bounds and response stream cap", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const run = load(
    "lib/stock-insights.server.ts",
    {
      HttpError,
      limit: async () => {},
      insightRequest,
      stockInsights,
      readBoundedMarketJson,
    },
    "readStockInsights",
  );
  const response = (timestamp) => {
    const x = raw();
    x.data[0].generatedAt = Date.parse(timestamp) / 1000;
    return new Response(JSON.stringify(x));
  };
  const opts = {
    key: "synthetic",
    now,
    fetcher: async (url) => {
      assert.match(
        url,
        /\/stock\/GOOG\/range\?startDate=2026-10-19&endDate=2026-11-17$/,
      );
      return response("2026-10-19T04:00:00Z");
    },
  };
  assert.equal((await run("GOOG", "month", opts)).rows.length, 1);
  await assert.rejects(
    run("GOOG", "month", {
      ...opts,
      fetcher: async () => response("2026-10-19T03:59:59Z"),
    }),
    (e) => e.status === 502,
  );
  await assert.rejects(
    run("GOOG", "current", {
      ...opts,
      fetcher: async () => new Response(" ".repeat(2000001)),
    }),
    (e) => e.status === 502,
  );
});
test("gated route through real transport/projector reaches rendered UI without score substitution", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = load(
    "lib/stock-insights.server.ts",
    {
      HttpError,
      limit: async () => {},
      insightRequest,
      stockInsights,
      readBoundedMarketJson,
    },
    "readStockInsights",
  );
  const get = load(
    "app/api/stock-insights/route.ts",
    {
      HttpError,
      insightRequest,
      account: async () => ({ user: { id: "synthetic" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readStockInsights: (s, m) =>
        read(s, m, {
          key: "synthetic",
          now,
          fetcher: async () => new Response(JSON.stringify(raw())),
        }),
      privateJson: (data) => data,
      failure: (e) => {
        throw e;
      },
    },
    "GET",
  );
  const result = await get(
    new Request(
      "https://local.test/api/stock-insights?symbol=GOOG&mode=current",
    ),
  );
  assert.match(ui("current", result).html, /Synthetic test only/);
  assert.match(ui("current", result).html, /80%/);
  assert.equal(result.preview, true);
});

test("successful view offers explicit refresh and separates source attribution from main explanation", () => {
  const data = {
    ...stockInsights(raw(), "GOOG", now),
    mode: "current",
    start: null,
    end: null,
    retrievedAt: new Date(now).toISOString(),
  };
  const html = ui("current", data).html;
  assert.match(html, /Refresh insights/);
  assert.match(html, /Source &amp; retrieval/);
  assert.match(html, /Fetched/);
});
