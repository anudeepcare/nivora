import test from "node:test";
import assert from "node:assert/strict";
import { appMetric, appHistory } from "../lib/product-app-history.ts";
const end = Date.parse("2026-11-18T14:00:00Z"),
  start = end - 30 * 86400000;
const point = (metric, value, t = start + 86400000) => ({
  timestamp: t,
  metricType: metric.toUpperCase(),
  value,
});
test("app metrics are closed and preserve written integer counts versus allocated fractional counts", () => {
  assert.equal(appMetric("app_rating"), "app_rating");
  assert.equal(appMetric("sentisense"), null);
  assert.equal(
    appHistory(
      [point("app_review_count", 3)],
      "Example-App",
      "app_review_count",
      30,
      start,
      end,
    ).points[0].value,
    3,
  );
  assert.equal(
    appHistory(
      [point("app_all_ratings_count", 2.5)],
      "Example-App",
      "app_all_ratings_count",
      30,
      start,
      end,
    ).points[0].value,
    2.5,
  );
  assert.equal(
    appHistory(
      [point("app_review_count", 2.5)],
      "Example-App",
      "app_review_count",
      30,
      start,
      end,
    ),
    null,
  );
});
test("stars1to5 missing dates values and ordered bounded points are never invented", () => {
  const p = point("app_rating", undefined);
  delete p.value;
  assert.equal(
    appHistory([p], "Example-App", "app_rating", 30, start, end).points[0]
      .value,
    null,
  );
  for (const rows of [
    [point("app_rating", 0)],
    [point("app_rating", 6)],
    [point("app_rating", [4])],
    [point("app_rating", 4, end + 1)],
    [point("app_rating", 4), point("app_rating", 4)],
    [point("app_rating", 4, start + 2), point("app_rating", 4, start + 1)],
  ])
    assert.equal(
      appHistory(rows, "Example-App", "app_rating", 30, start, end),
      null,
    );
  assert.equal(
    appHistory([], "Example-App", "app_rating", 30, start, end).points.length,
    0,
  );
});
test("metric mismatch and optional identity mismatches fail closed, no preview wrapper accepted", () => {
  assert.equal(
    appHistory(
      [point("app_rating", 4)],
      "Example-App",
      "app_review_count",
      30,
      start,
      end,
    ),
    null,
  );
  assert.equal(
    appHistory(
      [{ ...point("app_rating", 4), urlSlug: "Other" }],
      "Example-App",
      "app_rating",
      30,
      start,
      end,
    ),
    null,
  );
  assert.equal(
    appHistory(
      { isPreview: true, data: [] },
      "Example-App",
      "app_rating",
      30,
      start,
      end,
    ),
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
  return new Function(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

import {
  createProviderFetch,
  providerConfig,
} from "../lib/sentisense-provider-core.ts";
import {
  productQuery,
  productHandle,
  productMatches,
  productDetail,
} from "../lib/product-entities.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
function reader(allowed = true) {
  const guard = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => ({ allowed, retryAfterSeconds: 60 }),
    cooldown: async () => {},
  });
  const product = load(
    "lib/product-entities.server.ts",
    {
      HttpError,
      limit: async () => {},
      productQuery,
      productHandle,
      productMatches,
      productDetail,
      readBoundedMarketJson,
      sentisenseFetch: guard,
    },
    "readProductEntity",
  );
  return load(
    "lib/product-app-history.server.ts",
    {
      HttpError,
      limit: async () => {},
      productHandle,
      appMetric,
      appHistory,
      readBoundedMarketJson,
      sentisenseFetch: guard,
      readProductEntity: product,
    },
    "readAppHistory",
  );
}
const product = () => ({
  entity: {
    displayName: "Example App",
    type: "PRODUCT",
    urlSlug: "Example-App",
  },
  latestMetrics: {},
});
test("actual shared provider guard permits bounded v1 identity then v2 product metric requests", async () => {
  const urls = [];
  const fetcher = async (url, opts) => {
    urls.push(String(url));
    assert.equal(opts.redirect, "error");
    return new Response(
      JSON.stringify(
        String(url).includes("/api/v1/") ? product() : [point("app_rating", 4)],
      ),
    );
  };
  const p = await reader()("Example-App", "app_rating", 30, {
    key: "synthetic",
    fetcher,
    now: end,
  });
  assert.equal(p.points[0].value, 4);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /api\/v1\/kb\/entities\/Example-App$/);
  assert.match(
    urls[1],
    /api\/v2\/metrics\/entity\/Example-App\/metric\/app_rating\?/,
  );
  assert.match(urls[1], /maxDataPoints=100/);
});
test("guard denial and invalid product identity prevent the metric request", async () => {
  let calls = 0;
  await assert.rejects(
    reader(false)("Example-App", "app_rating", 30, {
      key: "synthetic",
      now: end,
      fetcher: async () => {
        calls++;
        return new Response("[]");
      },
    }),
  );
  assert.equal(calls, 0);
  await assert.rejects(
    reader()("Example-App", "app_rating", 30, {
      key: "synthetic",
      now: end,
      fetcher: async () => {
        calls++;
        const p = product();
        p.entity.type = "COMPANY";
        return new Response(JSON.stringify(p));
      },
    }),
  );
  assert.equal(calls, 1);
});
test("route auth, preview deployment, feature and quota gating precede history calls", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/product-app-history/route.ts",
    {
      HttpError,
      productHandle,
      appMetric,
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
      readAppHistory: async () => {
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
      "https://local.test/api/product-app-history" +
        (q ?? "?handle=Example-App&metric=app_rating&days=30"),
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
    "?handle=../x&metric=app_rating&days=30",
    "?handle=Example-App&metric=sentisense&days=30",
    "?handle=Example-App&metric=app_rating&days=365",
    "?handle=Example-App&metric=app_rating&days=30&days=90",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(calls, 1);
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { appMetrics } from "../lib/product-app-history.ts";
function ui(open, data, metric = "app_review_count") {
  const file = "components/ProductAppHistory.tsx";
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const src = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace("export default function", "function"))
    .join("\n");
  const code = ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  let state = 0,
    key;
  const Component = new Function(
    "React",
    "useState",
    "useResource",
    "appMetrics",
    "s",
    code + ";return ProductAppHistory;",
  )(
    React,
    () => [[open, metric, 30][state++], () => {}],
    (url) => {
      key = url;
      return { data, error: null, loading: false, refresh: () => {} };
    },
    appMetrics,
    {},
  );
  return {
    html: renderToStaticMarkup(
      React.createElement(Component, { handle: "Example-App" }),
    ),
    key,
  };
}
test("app UI is opt-in and keeps dated points separate with no fake period average", () => {
  assert.equal(ui(false, null).key, null);
  const d = {
    ...appHistory(
      [point("app_review_count", 3)],
      "Example-App",
      "app_review_count",
      30,
      start,
      end,
    ),
    productName: "Example App",
    receivedAt: new Date(end).toISOString(),
  };
  const shown = ui(true, d);
  assert.equal(
    shown.key,
    "product-app-history?handle=Example-App&metric=app_review_count&days=30",
  );
  assert.match(shown.html, /New written reviews/);
  assert.match(shown.html, /No period average/);
  assert.match(shown.html, /2026/);
  assert.doesNotMatch(shown.html, /<polyline/);
  assert.match(
    ui(true, { ...d, points: [] }).html,
    /not proof of zero reviews/,
  );
});
test("allocated all-rating metrics explicitly disclose spread days, not independent daily measurements", () => {
  const d = {
    ...appHistory(
      [point("app_all_ratings_count", 2.5)],
      "Example-App",
      "app_all_ratings_count",
      30,
      start,
      end,
    ),
    productName: "Example App",
    receivedAt: new Date(end).toISOString(),
  };
  assert.match(
    ui(true, d, "app_all_ratings_count").html,
    /spread evenly across days/,
  );
  assert.match(
    ui(true, d, "app_all_ratings_count").html,
    /not independently measured daily/,
  );
  assert.match(
    ui(true, d, "app_all_ratings_count").html,
    /ends before the latest written-review day/,
  );
});
test("full authenticated route through real guarded provider and UI keeps app stars correctly", async () => {
  const get = load(
    "app/api/product-app-history/route.ts",
    {
      HttpError,
      productHandle,
      appMetric,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readAppHistory: (h, m, d) =>
        reader()(h, m, d, {
          key: "synthetic",
          now: end,
          fetcher: async (url) =>
            new Response(
              JSON.stringify(
                String(url).includes("/api/v1/")
                  ? product()
                  : [point("app_rating", 4)],
              ),
            ),
        }),
      privateJson: (x) => x,
      failure: (e) => {
        throw e;
      },
    },
    "GET",
  );
  const result = await get(
    new Request(
      "https://local.test/api/product-app-history?handle=Example-App&metric=app_rating&days=30",
    ),
  );
  assert.match(ui(true, result, "app_rating").html, /Written reviews/);
  assert.equal(result.points[0].value, 4);
});
test("daily app series rejects duplicate New York calendar buckets", () => {
  assert.equal(
    appHistory(
      [
        point("app_rating", 4, start + 1000),
        point("app_rating", 3, start + 2000),
      ],
      "Example-App",
      "app_rating",
      30,
      start,
      end,
    ),
    null,
  );
});
