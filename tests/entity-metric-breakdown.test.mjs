import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const load = () => import("../lib/entity-metric-breakdown.ts");
const end = Date.parse("2026-11-18T12:00:00Z"),
  start = end - 30 * 86400000;
test("metric breakdown closed projector exists", () =>
  assert.ok(fs.existsSync("lib/entity-metric-breakdown.ts")));
test("mention shares and sentiment means require matching valueType and scale", async () => {
  const { metricBreakdown } = await load();
  const base = {
    metricType: "mentions",
    dimension: "source",
    timestamp: end,
    distribution: { News: 0, Reddit: 100 },
    valueType: "SHARE_PERCENT",
  };
  const r = metricBreakdown(
    base,
    "ABC",
    "mentions",
    "source",
    "distribution",
    start,
    end,
    end,
  );
  assert.equal(r.rows[0].value, 0);
  assert.equal(r.unit, "SHARE_PERCENT");
  assert.equal(r.computedAt, "2026-11-18T12:00:00.000Z");
  assert.equal(
    metricBreakdown(
      { ...base, valueType: "MEAN" },
      "ABC",
      "mentions",
      "source",
      "distribution",
      start,
      end,
      end,
    ),
    null,
  );
  const m = metricBreakdown(
    {
      ...base,
      metricType: "sentiment",
      valueType: "MEAN",
      distribution: { News: -0.24 },
    },
    "ABC",
    "sentiment",
    "source",
    "distribution",
    start,
    end,
    end,
  );
  assert.equal(m.rows[0].value, -0.24);
  assert.equal(m.unit, "MEAN");
  assert.equal(
    metricBreakdown(
      {
        ...base,
        metricType: "sentiment",
        valueType: "MEAN",
        distribution: { News: 24 },
      },
      "ABC",
      "sentiment",
      "source",
      "distribution",
      start,
      end,
      end,
    ),
    null,
  );
});
test("wrong identity dimension future time and arbitrary paths fail closed; empty is not zero", async () => {
  const { metricBreakdown } = await load();
  const base = {
    metricType: "mentions",
    dimension: "source",
    distribution: {},
    valueType: "SHARE_PERCENT",
  };
  const r = metricBreakdown(
    base,
    "ABC",
    "mentions",
    "source",
    "distribution",
    start,
    end,
    end,
  );
  assert.deepEqual(r.rows, []);
  assert.equal(r.computedAt, null);
  for (const p of [
    { ...base, ticker: "XYZ" },
    { ...base, dimension: "publisher" },
    { ...base, timestamp: end + 1 },
    { ...base, distribution: { News: null } },
  ])
    assert.equal(
      metricBreakdown(
        p,
        "ABC",
        "mentions",
        "source",
        "distribution",
        start,
        end,
        end,
      ),
      null,
    );
  assert.equal(
    metricBreakdown(
      base,
      "ABC",
      "sentisense",
      "source",
      "distribution",
      start,
      end,
      end,
    ),
    null,
  );
});
test("slice discovery is undated metadata, bounded and preserves only allowed dimensions", async () => {
  const { metricBreakdown } = await load();
  const r = metricBreakdown(
    [
      {
        metricType: "MENTIONS",
        dimension: "source",
        values: ["News", "Reddit"],
        displayName: "Sources",
      },
    ],
    "ABC",
    "mentions",
    "source",
    "slices",
    start,
    end,
    end,
  );
  assert.equal(r.start, null);
  assert.equal(r.computedAt, null);
  assert.deepEqual(r.slices[0].values, ["News", "Reddit"]);
  assert.equal(
    metricBreakdown(
      [{ metricType: "mentions", dimension: "secret", values: [] }],
      "ABC",
      "mentions",
      "source",
      "slices",
      start,
      end,
      end,
    ),
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
test("route to rendered evidence preserves means rather than percent; locked calls stop", async () => {
  const lib = await load();
  let locked = true,
    calls = 0;
  const route = compile("app/api/entity-metric-breakdown/[symbol]/route.ts", {
    ...lib,
    account: async () => ({ user: { id: "u" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: () => {
      if (locked) throw new HttpError("locked", 403);
    },
    limit: async () => {},
    reserveAccess: async () => {},
    HttpError,
    sentiSenseTicker: (s) => (s === "ABC" ? s : null),
    readMetricBreakdown: async (s, m, d, mode) => {
      calls++;
      return {
        ...lib.metricBreakdown(
          {
            metricType: m,
            dimension: d,
            valueType: "MEAN",
            distribution: { News: -0.24 },
          },
          s,
          m,
          d,
          mode,
          start,
          end,
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
      "https://example.test/api/entity-metric-breakdown/ABC?metric=sentiment&dimension=source&mode=distribution&days=30",
    ),
    params = { params: Promise.resolve({ symbol: "ABC" }) };
  assert.equal((await route.GET(req, params)).status, 403);
  assert.equal(calls, 0);
  locked = false;
  const body = await (await route.GET(req, params)).json();
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  let i = 0;
  const ui = compile("components/EntityMetricBreakdown.tsx", {
    React,
    useState: () => [[true, "distribution", "source"][i++], () => {}],
    useResource: () => ({ data: body }),
    s: new Proxy({}, { get: (_, k) => String(k) }),
  });
  const html = renderToStaticMarkup(
    React.createElement(ui.default, {
      symbol: "ABC",
      metric: "sentiment",
      days: 30,
    }),
  );
  assert.match(html, /-0.24/);
  assert.doesNotMatch(html, /-0.24%/);
  assert.match(html, /each day counts equally/);
});
test("breakdown view makes no initial request and rejects unsupported per-source composites", async () => {
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const requests = [];
  for (const metric of ["mentions", "sentisense"]) {
    let i = 0;
    const ui = compile("components/EntityMetricBreakdown.tsx", {
      React,
      useState: () => [[false, "distribution", "source"][i++], () => {}],
      useResource: (k) => {
        requests.push(k);
        return {};
      },
      s: new Proxy({}, { get: (_, k) => String(k) }),
    });
    renderToStaticMarkup(
      React.createElement(ui.default, { symbol: "ABC", metric, days: 30 }),
    );
  }
  assert.deepEqual(requests, [null, null]);
});
test("transport selects one fixed v2 operation and preserves cache provenance", async () => {
  const lib = await load(),
    { createHash } = await import("node:crypto");
  let calls = [];
  const server = compile("lib/entity-metric-breakdown.server.ts", {
    ...lib,
    createHash,
    HttpError,
    limit: async () => {},
    sentiSenseTicker: (s) => (s === "ABC" ? s : null),
    readBoundedMarketJson: async (r, cap) => {
      assert.equal(cap, 2000000);
      return r.json();
    },
  });
  const fetcher = async (url, init) => {
    calls.push(url);
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    const u = new URL(url);
    if (u.pathname.endsWith("/slices")) {
      assert.equal(u.search, "");
      return Response.json([
        { metricType: "mentions", dimension: "source", values: ["News"] },
      ]);
    }
    assert.equal(
      u.pathname,
      "/api/v2/metrics/entity/ABC/distribution/mentions",
    );
    assert.equal(u.searchParams.get("dimension"), "source");
    assert.equal(
      Number(u.searchParams.get("endTime")) -
        Number(u.searchParams.get("startTime")),
      30 * 86400000,
    );
    return Response.json({
      metricType: "mentions",
      dimension: "source",
      valueType: "SHARE_PERCENT",
      distribution: { News: 100 },
    });
  };
  const args = [
    "ABC",
    "mentions",
    "source",
    "distribution",
    30,
    { key: "test-only", fetcher },
  ];
  const [a, b] = await Promise.all([
    server.readMetricBreakdown(...args),
    server.readMetricBreakdown(...args),
  ]);
  assert.equal(calls.length, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  const slice = await server.readMetricBreakdown(
    "ABC",
    "mentions",
    "source",
    "slices",
    30,
    { key: "test-only", fetcher },
  );
  assert.equal(slice.start, null);
  assert.equal(calls.length, 2);
  await assert.rejects(
    server.readMetricBreakdown(
      "ABC",
      "sentisense",
      "source",
      "distribution",
      30,
      { key: "test-only", fetcher },
    ),
  );
  assert.equal(calls.length, 2);
});
test("existing metric history hosts breakdown without a separate eager lens", () => {
  const s = fs.readFileSync("components/EntityMetricHistory.tsx", "utf8");
  assert.match(s, /import EntityMetricBreakdown/);
  assert.match(s, /<EntityMetricBreakdown/);
});
