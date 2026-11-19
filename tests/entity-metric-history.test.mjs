import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const load = () => import("../lib/entity-metric-history.ts");
const end = Date.parse("2026-11-18T12:00:00Z"),
  start = end - 30 * 86400000;
test("dated metric projection exists", () =>
  assert.ok(fs.existsSync("lib/entity-metric-history.ts")));
test("canonical enum, epoch milliseconds, null and zero preserved without inferred days", async () => {
  const { metricHistory } = await load();
  const r = metricHistory(
    [
      { timestamp: end - 86400000, metricType: "SENTISENSE_SCORE", value: 180 },
      { timestamp: end, metricType: "SENTISENSE_SCORE", value: 0 },
    ],
    "ABC",
    "sentisense",
    30,
    start,
    end,
  );
  assert.equal(r.points.length, 2);
  assert.equal(r.points[0].value, 180);
  assert.equal(r.points[1].value, 0);
  assert.equal(r.points[1].at, "2026-11-18T12:00:00.000Z");
  const missing = metricHistory(
    [{ timestamp: end, metricType: "MENTIONS" }],
    "ABC",
    "mentions",
    30,
    start,
    end,
  );
  assert.equal(missing.points[0].value, null);
});
test("wrong type, subject, duplicate, future or outside-window data is not charted", async () => {
  const { metricHistory } = await load();
  const point = { timestamp: end, metricType: "SENTIMENT", value: 0.2 };
  for (const rows of [
    [{ ...point, metricType: "MENTIONS" }],
    [{ ...point, ticker: "XYZ" }],
    [point, point],
    [{ ...point, timestamp: end + 1 }],
    [{ ...point, timestamp: start - 1 }],
    [{ ...point, timestamp: Math.floor(end / 1000) }],
  ])
    assert.equal(metricHistory(rows, "ABC", "sentiment", 30, start, end), null);
  assert.equal(
    metricHistory([point], "ABC", "arbitrary", 30, start, end),
    null,
  );
});
test("units and directional sample metadata are bounded independently", async () => {
  const { metricHistory } = await load();
  assert.equal(
    metricHistory(
      [{ timestamp: end, metricType: "SOCIAL_DOMINANCE", value: 0.021 }],
      "ABC",
      "social_dominance",
      30,
      start,
      end,
    ).points[0].value,
    0.021,
  );
  assert.equal(
    metricHistory(
      [{ timestamp: end, metricType: "SENTIMENT", value: 3 }],
      "ABC",
      "sentiment",
      30,
      start,
      end,
    ).points[0].value,
    null,
  );
  const p = {
    timestamp: end,
    metricType: "SENTISENSE_SCORE",
    value: -180,
    metricValue: {
      properties: { bull: 2, bear: 3, directional: 5, secret: "omit" },
    },
  };
  const r = metricHistory([p], "ABC", "sentisense", 30, start, end);
  assert.equal(r.points[0].directional, 5);
  assert.doesNotMatch(JSON.stringify(r), /secret/);
  assert.equal(
    metricHistory(
      [
        {
          ...p,
          metricValue: { properties: { bull: 2, bear: 3, directional: 6 } },
        },
      ],
      "ABC",
      "sentisense",
      30,
      start,
      end,
    ).points[0].directional,
    null,
  );
});
function compile(path, bindings) {
  const source = fs.readFileSync(path, "utf8"),
    ast = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast))
      .join("\n"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  const exports = {};
  providerFixtureFunction("exports", ...Object.keys(bindings), code)(
    exports,
    ...Object.values(bindings),
  );
  return exports;
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("route-to-UI retains exact dates and scales; gates reject before provider", async () => {
  const { metricHistory, entityMetric, entityMetrics } = await load();
  let calls = 0,
    locked = true;
  const route = compile("app/api/entity-metric-history/[symbol]/route.ts", {
    account: async () => ({ user: { id: "u" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: () => {
      if (locked) throw new HttpError("locked", 403);
    },
    limit: async () => {},
    reserveAccess: async () => {},
    HttpError,
    entityMetric,
    sentiSenseTicker: (s) => (s === "ABC" ? s : null),
    readMetricHistory: async (s, m, d) => {
      calls++;
      return {
        ...metricHistory(
          [
            { timestamp: end - 86400000, metricType: "SENTIMENT", value: -0.2 },
            { timestamp: end, metricType: "SENTIMENT", value: 0 },
          ],
          s,
          m,
          d,
          start,
          end,
        ),
        receivedAt: new Date(end).toISOString(),
      };
    },
    privateJson: Response.json,
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
  });
  const req = new Request(
      "https://example.test/api/entity-metric-history/ABC?metric=sentiment&days=30",
    ),
    params = { params: Promise.resolve({ symbol: "ABC" }) };
  assert.equal((await route.GET(req, params)).status, 403);
  assert.equal(calls, 0);
  locked = false;
  const body = await (await route.GET(req, params)).json();
  assert.equal(body.points[0].value, -0.2);
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  let index = 0;
  const ui = compile("components/EntityMetricHistory.tsx", {
    React,
    EntityMetricBreakdown: () => null,
    useState: () => [[true, "sentiment", 30][index++], () => {}],
    useResource: () => ({ data: body }),
    entityMetrics,
    s: new Proxy({}, { get: (_, k) => String(k) }),
  });
  const html = renderToStaticMarkup(
    React.createElement(ui.default, { symbol: "ABC" }),
  );
  assert.match(html, /2026-11-17/);
  assert.match(html, /−1 to \+1/);
  assert.match(html, /-0.2/);
  assert.match(html, /current New York day may be incomplete/);
});
test("metric UI stays opt-in and preview performs no request", async () => {
  const { entityMetrics } = await load();
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const requests = [];
  for (const preview of [false, true]) {
    let index = 0;
    const ui = compile("components/EntityMetricHistory.tsx", {
      React,
      EntityMetricBreakdown: () => null,
      useState: () => [[preview, "sentiment", 30][index++], () => {}],
      useResource: (key) => {
        requests.push(key);
        return {};
      },
      entityMetrics,
      s: new Proxy({}, { get: (_, k) => String(k) }),
    });
    renderToStaticMarkup(
      React.createElement(ui.default, { symbol: "ABC", preview }),
    );
  }
  assert.deepEqual(requests, [null, null]);
});
test("transport is fixed v2, bounded, identity-scoped and concurrent-deduped", async () => {
  const { metricHistory, entityMetric } = await load(),
    { createHash } = await import("node:crypto");
  let calls = 0;
  const server = compile("lib/entity-metric-history.server.ts", {
    createHash,
    HttpError,
    limit: async () => {},
    sentiSenseTicker: (s) => (s === "ABC" ? s : null),
    entityMetric,
    metricHistory,
    readBoundedMarketJson: async (r, cap) => {
      assert.equal(cap, 2000000);
      return r.json();
    },
  });
  const fetcher = async (url, init) => {
    calls++;
    const u = new URL(url);
    assert.equal(u.pathname, "/api/v2/metrics/entity/ABC/metric/mentions");
    assert.equal(u.searchParams.get("maxDataPoints"), "90");
    const t = Number(u.searchParams.get("endTime"));
    assert.equal(t - Number(u.searchParams.get("startTime")), 30 * 86400000);
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    return Response.json([{ timestamp: t, metricType: "MENTIONS", value: 0 }]);
  };
  const [a, b] = await Promise.all([
    server.readMetricHistory("ABC", "mentions", 30, {
      key: "test-only",
      fetcher,
    }),
    server.readMetricHistory("ABC", "mentions", 30, {
      key: "test-only",
      fetcher,
    }),
  ]);
  assert.equal(calls, 1);
  assert.equal(a.points[0].value, 0);
  assert.equal(a.receivedAt, b.receivedAt);
  await assert.rejects(
    server.readMetricHistory("../evil", "mentions", 30, {
      key: "test-only",
      fetcher,
    }),
  );
  assert.equal(calls, 1);
});

test("history disclosure does not imply immutable or unrounded evidence", () => {
  const source = fs.readFileSync("components/EntityMetricHistory.tsx", "utf8");
  assert.match(source, /Reported dated metric readings/);
  assert.match(source, /may be\s+restated/);
  assert.match(source, /rounded to three decimal places/);
});
