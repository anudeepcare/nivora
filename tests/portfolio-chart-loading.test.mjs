import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as resourceCache from "../lib/resource-cache.ts";
import * as workspace from "../lib/approved-workspace.ts";
import * as comparison from "../lib/portfolio-comparison.ts";
import * as range from "../lib/portfolio-range.ts";
import * as format from "../lib/format.ts";
import * as language from "../lib/customer-language.ts";
import * as batch from "../lib/history-batch.ts";

// Exercise the real component's effect cleanup and real shared-cache pending promises.
function harness(modules) {
  const slots = [],
    effects = [];
  let cursor = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots))
        slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (v) => {
          slots[i] = typeof v === "function" ? v(slots[i]) : v;
        },
      ];
    },
    useRef(value) {
      const i = cursor++;
      slots[i] ??= { current: value };
      return slots[i];
    },
    useMemo(fn) {
      return fn();
    },
    useId() {
      return "test-gradient";
    },
    useEffect(fn, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (
        !previous ||
        !deps ||
        deps.some((v, j) => !Object.is(v, previous.deps[j]))
      ) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => {
          slots[i].cleanup?.();
          slots[i].cleanup = fn();
        });
      }
    },
  };
  const output = ts.transpileModule(
    fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => {
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
      if (name.endsWith(".module.css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      if (name === "./PortfolioRange")
        return { __esModule: true, default: () => null };
      if (name in modules) return modules[name];
      throw Error(`Unexpected dependency ${name}`);
    },
    mod,
    mod.exports,
  );
  return {
    render(props) {
      cursor = 0;
      const tree = mod.exports.default(props);
      while (effects.length) effects.shift()();
      return tree;
    },
  };
}
function find(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((node) => find(node, predicate));
  if (!tree || typeof tree !== "object") return [];
  return [
    ...(predicate(tree) ? [tree] : []),
    ...find(tree.props?.children, predicate),
  ];
}
const turn = () => new Promise((resolve) => setImmediate(resolve));
function portfolioHarness() {
  const cache = new Map();
  const pending = [];
  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const app = harness({
    "@/lib/history-batch": batch,
    "@/lib/customer-language": language,
    "@/lib/approved-workspace": workspace,
    "@/lib/resource-cache": resourceCache,
    "@/lib/format": format,
    "@/lib/portfolio-comparison": comparison,
    "@/lib/portfolio-range": range,
    "./Session": {
      useProduct: () => ({ cache, owner: "fixture", demo: undefined }),
    },
    "@/lib/client": {
      ApiError,
      api: (path, _options, signal) =>
        new Promise((resolve, reject) => {
          pending.push({ path, resolve, reject });
          signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    },
  });
  return { app, cache, pending, ApiError };
}
test("switching market references during a pending holding fetch retains shared history", async () => {
  const { app, pending } = portfolioHarness();
  const positions = [
    { symbol: "A", quantity: 2, cost: 50, currency: "USD", assetType: "stock" },
  ];
  const props = {
    positions,
    quotes: { A: { quote: { currency: "USD", price: 110 } } },
  };
  let tree = app.render(props);
  await turn();
  assert.equal(
    pending[0].path,
    "chart/SPY?range=6M",
    "the displayed benchmark must not wait behind every holding",
  );
  assert.equal(pending.length, 1, "history loading keeps one active request");
  pending[0].resolve({
    candles: [
      { time: "2026-10-01", close: 200 },
      { time: "2026-10-02", close: 210 },
    ],
    source: "Fixture benchmark",
  });
  await turn();
  assert.equal(pending[1].path, "chart/A?range=6M");
  find(tree, (node) => node.type === "select")[0].props.onChange({
    target: { value: "QQQ" },
  });
  tree = app.render(props);
  await turn();
  pending[1].resolve({
    candles: [
      { time: "2026-10-01", close: 100 },
      { time: "2026-10-02", close: 110 },
    ],
    source: "Fixture",
  });
  await turn();
  await turn();
  for (const request of pending.slice(2))
    request.resolve({
      candles: [
        { time: "2026-10-01", close: 200 },
        { time: "2026-10-02", close: 210 },
      ],
      source: "Fixture",
    });
  await turn();
  tree = app.render(props);
  assert.equal(
    pending.filter((p) => p.path === "chart/A?range=6M").length,
    1,
    "shared request is not duplicated",
  );
  const slider = find(tree, (node) => node.props?.role === "slider")[0];
  assert.ok(slider, "switching benchmark must not lose the holding history");
  assert.match(slider.props["aria-valuetext"], /QQQ/);
});

const holdingProps = (symbol = "A") => ({
  positions: [
    { symbol, quantity: 2, cost: 50, currency: "USD", assetType: "stock" },
  ],
  quotes: { [symbol]: { quote: { currency: "USD", price: 110 } } },
});
const historyReply = {
  candles: [
    { time: "2026-10-01", close: 100 },
    { time: "2026-10-02", close: 110 },
  ],
  source: "Fixture",
};
test("an unavailable benchmark does not block or discard usable holdings history", async () => {
  const { app, pending } = portfolioHarness();
  const props = holdingProps();
  app.render(props);
  await turn();
  assert.equal(pending[0].path, "chart/SPY?range=6M");
  pending[0].reject(new Error("Source temporarily unavailable"));
  await turn();
  assert.equal(pending[1].path, "chart/A?range=6M");
  pending[1].resolve(historyReply);
  await turn();
  const tree = app.render(props);
  assert.ok(
    find(tree, (node) => node.props?.role === "slider").length,
    "the available holding series is still interactive",
  );
  assert.equal(
    find(
      tree,
      (node) =>
        node.type === "button" &&
        node.props?.children === "Retry missing history",
    ).length,
    1,
  );
});
for (const status of [401, 403, 429]) {
  test(`history queue stops after ${status} without requesting additional holdings`, async () => {
    const { app, pending, ApiError } = portfolioHarness();
    app.render(holdingProps());
    await turn();
    pending[0].reject(new ApiError("Access or budget unavailable", status));
    await turn();
    assert.equal(pending.length, 1);
  });
}
test("a held benchmark is loaded once and reused for both series", async () => {
  const { app, pending } = portfolioHarness();
  const props = holdingProps("SPY");
  app.render(props);
  await turn();
  assert.equal(pending[0].path, "chart/SPY?range=6M");
  pending[0].resolve(historyReply);
  await turn();
  const tree = app.render(props);
  assert.equal(pending.length, 1);
  const slider = find(tree, (node) => node.props?.role === "slider")[0];
  assert.ok(slider);
  assert.match(slider.props["aria-valuetext"], /SPY/);
});
test("cached benchmarks bypass network and an empty portfolio requests no histories", async () => {
  const { app, pending, cache } = portfolioHarness();
  cache.set("chart/SPY?range=6M", { at: Date.now(), value: historyReply });
  app.render(holdingProps());
  await turn();
  assert.deepEqual(
    pending.map((r) => r.path),
    ["chart/A?range=6M"],
  );
  pending[0].resolve(historyReply);
  await turn();
  const empty = portfolioHarness();
  empty.app.render({ positions: [], quotes: {} });
  await turn();
  assert.equal(empty.pending.length, 0);
});

test("history uses two workers after access check and publishes each partial result", async () => {
  const { app, pending } = portfolioHarness();
  const symbols = ["A", "B", "C", "D"];
  const props = {
    positions: symbols.map((symbol) => ({
      symbol,
      quantity: 1,
      cost: 50,
      currency: "USD",
      assetType: "stock",
    })),
    quotes: Object.fromEntries(
      symbols.map((symbol) => [
        symbol,
        { quote: { currency: "USD", price: 110 } },
      ]),
    ),
  };
  app.render(props);
  await turn();
  assert.equal(pending.length, 1);
  pending[0].resolve(historyReply);
  await turn();
  assert.equal(pending.length, 3, "exactly two holdings start after benchmark");
  pending[1].resolve(historyReply);
  await turn();
  assert.equal(pending.length, 4, "completed worker takes the next holding");
  const partial = app.render(props);
  assert.ok(
    find(partial, (node) => node.props?.role === "slider").length,
    "partial valid chart renders before queue completes",
  );
  pending[2].resolve(historyReply);
  pending[3].resolve(historyReply);
  await turn();
  pending[4].resolve(historyReply);
  await turn();
});

test("aggregate history deadline exits loading with a truthful timeout status", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.now() });
  const { app, pending } = portfolioHarness();
  const props = holdingProps();
  app.render(props);
  await turn();
  pending[0].resolve(historyReply);
  await turn();
  t.mock.timers.tick(20000);
  await turn();
  const tree = app.render(props);
  assert.ok(
    find(
      tree,
      (node) =>
        node.props?.role === "status" &&
        /timed out/.test(String(node.props.children)),
    ).length,
  );
  const retry = find(
    tree,
    (node) =>
      node.type === "button" &&
      node.props?.children === "Retry missing history",
  )[0];
  assert.ok(retry);
  assert.equal(retry.props.disabled, false);
});
