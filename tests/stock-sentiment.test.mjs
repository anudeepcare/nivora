import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const path = "lib/stock-sentiment.ts";
test("stock sentiment feature has a closed projector", () =>
  assert.ok(fs.existsSync(path)));
const load = async () => import("../lib/stock-sentiment.ts");
const now = Date.parse("2026-11-18T12:00:00Z");
const payload = (patch = {}) => ({
  isPreview: false,
  data: {
    ticker: "ABC",
    asOf: "2026-11-17",
    sentisenseScore: null,
    sentisenseScoreAvg30d: 180,
    scoreSparkline: [-200, 0, 180],
    socialDominance: 0.021,
    mentions: 0,
    bySource: [{ source: "News", value: -0.2, mentionShare: 58 }],
    ...patch,
  },
});
test("unbounded score, fraction and polarity stay distinct; null is not zero", async () => {
  const { stockSentiment } = await load();
  const r = stockSentiment(payload(), "ABC", now);
  assert.equal(r.score, null);
  assert.equal(r.average30d, 180);
  assert.equal(r.socialDominance, 0.021);
  assert.equal(r.mentions, 0);
  assert.equal(r.sources[0].polarity, -0.2);
  assert.deepEqual(r.history, [-200, 0, 180]);
  assert.equal(r.asOf, "2026-11-17");
  assert.equal(
    stockSentiment(payload({ sentisenseScore: 0 }), "ABC", now).score,
    0,
  );
});
test("identity, future dates and malformed preview fail closed", async () => {
  const { stockSentiment } = await load();
  for (const p of [
    payload({ ticker: "XYZ" }),
    payload({ asOf: "2026-11-19" }),
    payload({ asOf: "2026-02-30" }),
    { ...payload(), isPreview: "false" },
  ])
    assert.equal(stockSentiment(p, "ABC", now), null);
  assert.equal(
    stockSentiment(payload({ socialDominance: 2 }), "ABC", now).socialDominance,
    null,
  );
});
test("preview withholds numbers and unknown objects, thin flags remain explicit", async () => {
  const { stockSentiment } = await load();
  const p = payload({
    sentisenseScoreThinSample: true,
    sentisenseScoreAvg30dThinSample: false,
    secret: "SECRET",
  });
  const r = stockSentiment(p, "ABC", now);
  assert.equal(r.thinToday, true);
  assert.equal(r.thin30d, false);
  assert.doesNotMatch(JSON.stringify(r), /SECRET/);
  const preview = stockSentiment({ ...p, isPreview: true }, "ABC", now);
  assert.equal(preview.average30d, null);
  assert.deepEqual(preview.history, []);
  assert.equal(preview.sources[0].polarity, null);
});
function moduleCode(path, bindings) {
  let source = fs.readFileSync(path, "utf8");
  const ast = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast))
    .join("\n");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
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
test("route gates requests and serializes only projected evidence for actual UI", async () => {
  const { stockSentiment } = await load();
  let calls = 0;
  let locked = false;
  const route = moduleCode("app/api/stock-sentiment/[symbol]/route.ts", {
    account: async () => ({ user: { id: "owner" } }),
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: () => {
      if (locked) throw new HttpError("locked", 403);
    },
    reserveAccess: async () => {},
    limit: async () => {},
    HttpError,
    sentiSenseTicker: (s) => (/^[A-Z]{1,6}$/.test(s) ? s : null),
    readStockSentiment: async (s) => {
      calls++;
      return {
        ...stockSentiment(payload(), s, now),
        receivedAt: "2026-11-18T12:00:00Z",
      };
    },
    privateJson: Response.json,
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
  });
  const req = new Request("https://example.test/api/stock-sentiment/ABC");
  const params = { params: Promise.resolve({ symbol: "ABC" }) };
  locked = true;
  assert.equal((await route.GET(req, params)).status, 403);
  assert.equal(calls, 0);
  locked = false;
  const body = await (await route.GET(req, params)).json();
  assert.equal(body.average30d, 180);
  assert.equal(body.mentions, 0);
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const ui = moduleCode("components/StockSentiment.tsx", {
    React,
    useState: () => [true, () => {}],
    useResource: () => ({
      data: body,
      loading: false,
      error: null,
      refresh: () => {},
    }),
    s: new Proxy({}, { get: (_, key) => String(key) }),
  });
  const html = renderToStaticMarkup(
    React.createElement(ui.default, { symbol: "ABC" }),
  );
  assert.match(html, /180/);
  assert.match(html, /2.1%/);
  assert.match(html, /No reading yet/);
  assert.match(html, /Dates not supplied/);
  assert.match(html, /2026-11-17/);
});
test("stock sentiment initially requests nothing and preview never requests data", async () => {
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  let requests = [];
  const render = (open, preview) => {
    const ui = moduleCode("components/StockSentiment.tsx", {
      React,
      useState: () => [open, () => {}],
      useResource: (key) => {
        requests.push(key);
        return {};
      },
      s: new Proxy({}, { get: (_, key) => String(key) }),
    });
    return renderToStaticMarkup(
      React.createElement(ui.default, { symbol: "ABC", preview }),
    );
  };
  assert.match(render(false, false), /Open sentiment/);
  render(true, true);
  assert.ok(requests.every((x) => x === null));
});
test("server fixed endpoint deduplicates and preserves acquisition time without leaking raw data", async () => {
  const { stockSentiment } = await load(),
    { createHash } = await import("node:crypto");
  let calls = 0;
  const server = moduleCode("lib/stock-sentiment.server.ts", {
    createHash,
    HttpError,
    limit: async () => {},
    sentiSenseTicker: (s) => (s === "ABC" ? s : null),
    readBoundedMarketJson: (r) => r.json(),
    stockSentiment,
  });
  const fetcher = async (url, init) => {
    calls++;
    assert.equal(url, "https://app.sentisense.ai/api/v1/stocks/ABC/sentiment");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    return Response.json(payload());
  };
  const [a, b] = await Promise.all([
    server.readStockSentiment("ABC", { key: "test-only", fetcher }),
    server.readStockSentiment("ABC", { key: "test-only", fetcher }),
  ]);
  assert.equal(calls, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  assert.equal(a.average30d, 180);
  await assert.rejects(
    server.readStockSentiment("../bad", { key: "test-only", fetcher }),
  );
  assert.equal(calls, 1);
});
test("server rate limit cools down subsequent requests", async () => {
  const { stockSentiment } = await load(),
    { createHash } = await import("node:crypto");
  let calls = 0;
  const server = moduleCode("lib/stock-sentiment.server.ts", {
    createHash,
    HttpError,
    limit: async () => {},
    sentiSenseTicker: (s) => s,
    readBoundedMarketJson: (r) => r.json(),
    stockSentiment,
  });
  const fetcher = async () => {
    calls++;
    return new Response("", { status: 429, headers: { "Retry-After": "120" } });
  };
  await assert.rejects(
    server.readStockSentiment("ABC", { key: "test-only", fetcher }),
    (e) => e.status === 429,
  );
  await assert.rejects(
    server.readStockSentiment("XYZ", { key: "test-only", fetcher }),
    (e) => e.status === 429,
  );
  assert.equal(calls, 1);
});
test("pending daily read is distinct from preview or invalid numeric evidence", async () => {
  const { stockSentiment } = await load();
  assert.equal(stockSentiment(payload(), "ABC", now).scoreStatus, "pending");
  for (const score of ["0", {}, Infinity, undefined]) {
    const r = stockSentiment(
      payload({ sentisenseScore: score, latestDirection: "Bullish" }),
      "ABC",
      now,
    );
    assert.equal(r.scoreStatus, "unavailable");
    assert.equal(r.latestDirection, null);
  }
  const preview = stockSentiment({ ...payload(), isPreview: true }, "ABC", now);
  assert.equal(preview.scoreStatus, "unavailable");
  const zero = stockSentiment(
    payload({ sentisenseScore: 0, latestDirection: "Neutral" }),
    "ABC",
    now,
  );
  assert.equal(zero.scoreStatus, "available");
  assert.equal(zero.latestDirection, "Neutral");
});
