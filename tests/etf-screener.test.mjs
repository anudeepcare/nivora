import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
async function load() {
  assert.ok(fs.existsSync("lib/etf-screener.ts"), "ETF projection exists");
  return import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpileModule(fs.readFileSync("lib/etf-screener.ts", "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString("base64")
  );
}
test("ETF screen permits only bounded factual fields and numeric comparisons", async () => {
  const { etfScreenInput } = await load();
  assert.deepEqual(
    etfScreenInput({ field: "EXPENSE_RATIO", op: "LTE", value: 0.1 }),
    { field: "EXPENSE_RATIO", op: "LTE", value: 0.1 },
  );
  for (const x of [
    { field: "PRICE", op: "GTE", value: 0 },
    { field: "EXPENSE_RATIO", op: "LTE", value: -1 },
    { field: "HOLDINGS_COUNT", op: "GTE", value: 1.5 },
    { field: "WEIGHT_COVERED_PCT", op: "GTE", value: 101 },
    { field: "MARKET_CAP", op: "EQ", value: 1 },
    { field: "MARKET_CAP", op: "GTE", value: 1, url: "evil" },
  ])
    assert.equal(etfScreenInput(x), null);
});
test("ETF rows preserve fee percentage points zero/null partial and timestamps without invented price age", async () => {
  const { etfScreenRows } = await load();
  const r = etfScreenRows(
    {
      matched: 120,
      limit: 100,
      results: [
        {
          ticker: "SPY",
          name: "Fund",
          expenseRatio: 0.09,
          marketCap: 0,
          weightCoveredPct: 80,
          partial: true,
          lastUpdated: 1794960000,
          secret: "x",
        },
      ],
    },
    1795000000000,
  );
  assert.equal(r.results[0].expenseRatio, 0.09);
  assert.equal(r.results[0].marketCap, 0);
  assert.equal(r.results[0].partial, true);
  assert.equal(r.results[0].currentPrice, null);
  assert.equal(r.results[0].priceAsOf, undefined);
  assert.equal(r.results[0].secret, undefined);
  assert.equal(r.matched, 120);
  assert.equal(
    etfScreenRows({ matched: 0, results: [{ ticker: "SPY" }] }),
    null,
  );
  assert.equal(
    etfScreenRows({
      matched: 2,
      results: [{ ticker: "SPY" }, { ticker: "spy" }],
    }),
    null,
  );
});
function compiled(path) {
  assert.ok(fs.existsSync(path), path + " exists");
  const s = fs.readFileSync(path, "utf8"),
    ast = ts.createSourceFile(path, s, ts.ScriptTarget.Latest, true);
  return ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
test("ETF execution sends fixed bounded plan and preserves percent-point threshold", async () => {
  const js = compiled("lib/etf-screener.server.ts"),
    { etfScreenInput, etfScreenRows } = await load(),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const run = providerFixtureFunction(
    "etfScreenInput",
    "etfScreenRows",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return runEtfScreen",
  )(
    etfScreenInput,
    etfScreenRows,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  const input = { field: "EXPENSE_RATIO", op: "LTE", value: 0.09 };
  const r = await run(input, {
    key: "fixture",
    fetcher: async (u, o) => {
      assert.equal(u, "https://app.sentisense.ai/api/v1/screener/etfs/execute");
      assert.equal(o.method, "POST");
      assert.equal(o.redirect, "error");
      assert.equal(o.cache, "no-store");
      const b = JSON.parse(o.body);
      assert.equal(b.limit, 100);
      assert.equal(b.plan.filters[0].value, 0.09);
      assert.equal(b.plan.filters[0].fieldName, "EXPENSE_RATIO");
      return new Response(JSON.stringify({ matched: 0, results: [] }));
    },
  });
  assert.equal(r.matched, 0);
  await assert.rejects(
    run(input, {
      key: "fixture",
      fetcher: async () => new Response("secret", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("secret"),
  );
  await assert.rejects(
    run(input, {
      key: "fixture",
      fetcher: async () => new Response("x".repeat(2100000)),
    }),
    (e) => e.status === 502,
  );
});
test("ETF route authenticates and rejects unauthorized or unsafe inputs before provider", async () => {
  const js = compiled("app/api/etf-screener/route.ts"),
    { etfScreenInput } = await load(),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  for (const deny of ["sample", "advanced", null]) {
    const calls = [],
      bindings = {
        HttpError,
        etfScreenInput,
        readBoundedMarketJson,
        account: async () => ({ user: { id: "fixture" } }),
        requestAccess: async () => ({ sampleOnly: deny === "sample" }),
        requireFeature: (_, f) => {
          if (f === deny) throw new HttpError("Forbidden", 403);
        },
        limit: async () => {},
        reserveAccess: async () => {},
        runEtfScreen: async () => {
          calls.push("provider");
          return { matched: 0, results: [] };
        },
        privateJson: (x) => x,
        failure: (e) => ({ status: e.status }),
      };
    const post = providerFixtureFunction(...Object.keys(bindings), js + ";return POST")(
      ...Object.values(bindings),
    );
    const req = (body) =>
      new Request("https://app.test/api/etf-screener", {
        method: "POST",
        body,
      });
    const r = await post(
      req(JSON.stringify({ field: "MARKET_CAP", op: "GTE", value: 0 })),
    );
    if (deny) {
      assert.equal(r.status, 403);
      assert.equal(calls.length, 0);
    } else {
      assert.equal(r.matched, 0);
      assert.equal((await post(req("x".repeat(3000)))).status, 400);
    }
  }
});
test("ETF UI runs on submit only, discloses snapshot age and fee units, pages locally", () => {
  assert.ok(fs.existsSync("components/EtfScreener.tsx"), "ETF UI exists");
  const s = fs.readFileSync("components/EtfScreener.tsx", "utf8");
  assert.match(s, /onSubmit=/);
  assert.match(s, /ETF snapshot prices/);
  assert.match(s, /0\.09 means 0\.09%/);
  assert.match(s, /slice\(page \* 25/);
  assert.match(s, /No matching funds/);
  assert.ok(!s.includes("useEffect"));
});
test("ETF submit flows through actual route, server DTO and React render with safe units and pagination", async () => {
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const { etfFields, etfScreenInput, etfScreenRows } = await load(),
    { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const events = [];
  const run = providerFixtureFunction(
    "etfScreenInput",
    "etfScreenRows",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    compiled("lib/etf-screener.server.ts") + ";return runEtfScreen",
  )(
    etfScreenInput,
    etfScreenRows,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  const providerRows = Array.from({ length: 26 }, (_, i) => ({
    ticker: `F${i}`,
    name: i === 0 ? "<script>fixture</script>" : `Fund ${i}`,
    expenseRatio: i === 1 ? null : 0.09,
    marketCap: 0,
    holdingsCount: 100,
    weightCoveredPct: 80,
    partial: true,
    lastUpdated: 1794960000,
    secret: "NEVER_RENDER",
  }));
  const bindings = {
    HttpError,
    etfScreenInput,
    readBoundedMarketJson,
    account: async () => {
      events.push("account");
      return { user: { id: "test" } };
    },
    requestAccess: async () => ({ sampleOnly: false }),
    requireFeature: (_, f) => events.push(f),
    limit: async () => {},
    reserveAccess: async () => events.push("reserve"),
    runEtfScreen: (input) =>
      run(input, {
        key: "fixture",
        fetcher: async (u, o) => {
          events.push("provider");
          const request = JSON.parse(o.body);
          assert.equal(request.plan.filters[0].value, 0.09);
          assert.deepEqual(request.plan.filters[1], {
            fieldName: "WEIGHT_COVERED_PCT",
            op: "GTE",
            value: 80,
          });
          assert.equal(request.plan.filters.length, 2);
          assert.equal(request.plan.sort.fieldName, "EXPENSE_RATIO");
          return new Response(
            JSON.stringify({ matched: 150, limit: 100, results: providerRows }),
          );
        },
      }),
    privateJson: (x) => Response.json(x),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
  };
  const post = providerFixtureFunction(
    ...Object.keys(bindings),
    compiled("app/api/etf-screener/route.ts") + ";return POST",
  )(...Object.values(bindings));
  const state = [],
    useState = (initial) => {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [
        state[i],
        (next) => {
          state[i] = typeof next === "function" ? next(state[i]) : next;
        },
      ];
    };
  let cursor = 0;
  const src = fs.readFileSync("components/EtfScreener.tsx", "utf8"),
    ast = ts.createSourceFile(
      "ui.tsx",
      src,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  const api = async (path, input) => {
    assert.equal(path, "etf-screener");
    const response = await post(
      new Request("https://test/api/etf-screener", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    if (!response.ok) throw new Error("screen failed");
    return response.json();
  };
  const Component = providerFixtureFunction(
    "dynamic",
    "React",
    "useState",
    "Link",
    "api",
    "etfFields",
    "etfScreenInput",
    "s",
    js + ";return EtfScreener",
  )(
    () => () => null,
    React,
    useState,
    (props) => React.createElement("a", props),
    api,
    etfFields,
    etfScreenInput,
    new Proxy({}, { get: (_, k) => k }),
  );
  const tree = () => {
    cursor = 0;
    return Component();
  };
  const find = (node, predicate) => {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return null;
  };
  let view = tree();
  assert.equal(events.length, 0);
  const input = find(view, (n) => n.type === "input");
  input.props.onChange({ target: { value: "0.09" } });
  view = tree();
  find(
    view,
    (n) => n.type === "button" && n.props.children === "Add another condition",
  ).props.onClick();
  view = tree();
  const secondGroup = find(
    view,
    (n) => n.props?.["aria-label"] === "Additional condition",
  );
  find(secondGroup, (n) => n.type === "input").props.onChange({
    target: { value: "80" },
  });
  view = tree();
  await find(view, (n) => n.type === "form").props.onSubmit({
    preventDefault() {},
  });
  view = tree();
  let html = renderToStaticMarkup(view);
  assert.match(html, /AND Constituent data coverage \(%\)/);
  assert.match(html, /80/);
  assert.deepEqual(events, [
    "account",
    "overview",
    "advanced",
    "reserve",
    "provider",
  ]);
  assert.match(html, /0\.09%/);
  assert.match(html, /Not supplied/);
  assert.match(html, /26 returned of 150 matching funds/);
  assert.match(html, /Partial holdings/);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("NEVER_RENDER"));
  assert.ok(!html.includes("Fund 25"));
  assert.match(html, /href="\/research\/F0"/);
  find(
    view,
    (n) => n.type === "button" && n.props.children === "Next",
  ).props.onClick();
  html = renderToStaticMarkup(tree());
  assert.match(html, /Fund 25/);
  assert.equal(events.filter((x) => x === "provider").length, 1);
});
