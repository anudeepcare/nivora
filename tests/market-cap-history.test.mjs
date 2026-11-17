import test from "node:test";
import assert from "node:assert/strict";
import { marketCapHistory } from "../lib/market-cap-history.ts";
import { eodCallCost } from "../lib/market-policy.ts";
test("weekly indexed-object observations retain dates and dollars, sorted without interpolation", () => {
  assert.deepEqual(
    marketCapHistory(
      {
        1: { date: "2026-11-13", value: 200 },
        0: { date: "2026-11-06", value: 100 },
      },
      "2025-11-17",
      "2026-11-17",
    ),
    [
      { date: "2026-11-06", value: 100 },
      { date: "2026-11-13", value: 200 },
    ],
  );
  assert.equal(eodCallCost("historical-market-cap/AAPL.US"), 10);
});
test("malformed, duplicate conflicting, future and nonpositive observations fail closed", () => {
  for (const raw of [
    { error: "denied" },
    { 0: { date: "2026-02-30", value: 10 } },
    { 0: { date: "2026-11-18", value: 10 } },
    { 0: { date: "2026-11-10", value: 0 } },
    {
      0: { date: "2026-11-10", value: 10 },
      1: { date: "2026-11-10", value: 20 },
    },
    [{ date: "2026-11-10", value: 10 }],
  ])
    assert.equal(marketCapHistory(raw, "2025-11-17", "2026-11-17"), null);
  assert.deepEqual(marketCapHistory({}, "2025-11-17", "2026-11-17"), []);
});

test("route is authenticated, access-gated and makes one fixed cached request", async () => {
  const fs = await import("node:fs"),
    ts = (await import("typescript")).default;
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/market-cap/[symbol]/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const calls = [];
  let auth = true,
    allowed = true;
  class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const bindings = {
    HttpError,
    marketCapHistory,
    account: async () => {
      if (!auth) throw new HttpError("No session", 401);
      return { user: { id: "owner" } };
    },
    requestAccess: async () => ({
      enabled: true,
      features: { financials: allowed },
    }),
    limit: async (...a) => calls.push(["limit", ...a]),
    reserveAccess: async (...a) => calls.push(["reserve", ...a]),
    eodRequest: async (...a) => {
      calls.push(["provider", ...a]);
      return {};
    },
    privateJson: (r) => r,
    failure: (e) => ({ error: e.message, status: e.status }),
  };
  const GET = new Function(...Object.keys(bindings), code + ";return GET;")(
    ...Object.values(bindings),
  );
  const run = (s) =>
    GET(new Request("https://example.test/api"), {
      params: Promise.resolve({ symbol: s }),
    });
  const result = await run("AAPL");
  assert.equal(result.symbol, "AAPL");
  assert.deepEqual(result.rows, []);
  const call = calls.find((c) => c[0] === "provider");
  assert.equal(call[1], "historical-market-cap/AAPL.US");
  assert.equal(call[3], 86400000);
  assert.ok(
    Date.parse(call[2].to) - Date.parse(call[2].from) <= 366 * 86400000,
  );
  assert.equal(calls.find((c) => c[0] === "limit")[2], 6);
  calls.length = 0;
  for (const symbol of ["BTC/USD", "VOD.L", "SHOP.TO", "../../AAPL"])
    assert.equal((await run(symbol)).status, 400);
  assert.equal(
    calls.some((c) => c[0] === "provider"),
    false,
  );
  allowed = false;
  assert.equal((await run("AAPL")).status, 403);
  auth = false;
  assert.equal((await run("AAPL")).status, 401);
});

test("trend is lazy, dated, accessible and preserves weekly samples", async () => {
  const fs = await import("node:fs"),
    ts = (await import("typescript")).default,
    React = (await import("react")).default,
    { renderToStaticMarkup } = await import("react-dom/server");
  const ast = ts.createSourceFile(
    "chart.tsx",
    fs.readFileSync("components/MarketCapHistory.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  let open = false,
    call = 0,
    key,
    demo = false;
  const rows = [
    { date: "2026-11-06", value: 100e9 },
    { date: "2026-11-13", value: 110e9 },
  ];
  const bindings = {
    React,
    useState: () => [call++ % 2 === 0 ? open : null, () => {}],
    useProduct: () => ({ demo }),
    useResource: (k) => {
      key = k;
      return { data: { symbol: "AAPL", rows } };
    },
    s: new Proxy({}, { get: (_, k) => k }),
  };
  const View = new Function(
    ...Object.keys(bindings),
    code + ";return MarketCapHistory;",
  )(...Object.values(bindings));
  let html = renderToStaticMarkup(
    React.createElement(View, { symbol: "AAPL" }),
  );
  assert.equal(key, null);
  assert.doesNotMatch(html, /<svg/);
  open = true;
  html = renderToStaticMarkup(React.createElement(View, { symbol: "AAPL" }));
  assert.equal(key, "market-cap/AAPL");
  assert.match(html, /aria-valuetext="2026-11-13: \$110B USD"/);
  assert.match(html, /2026-11-13/);
  assert.match(html, /\$110B/);
  assert.equal((html.match(/<circle/g) || []).length, 2);
  assert.doesNotMatch(html, /<polyline|<path/);
  assert.match(html, /aria-label="Market capitalization observation"/);
  demo = true;
  html = renderToStaticMarkup(React.createElement(View, { symbol: "AAPL" }));
  assert.equal(key, null);
  assert.equal(html, "");
});

test("active Research Business workspace mounts market-cap history", async () => {
  const fs = await import("node:fs");
  const research = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(
    research,
    /const Financials = dynamic\(\(\) => import\("\.\/FinancialPicture"\)/,
  );
  const active = fs.readFileSync("components/FinancialPicture.tsx", "utf8");
  assert.match(active, /import MarketCapHistory from "\.\/MarketCapHistory"/);
  assert.match(active, /<MarketCapHistory[\s\S]*?symbol=\{r.company.symbol\}/);
});
