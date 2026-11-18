import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { normalizeOptions } from "../lib/options-analysis.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
function adapter(fetcher, budget = 40, pageBudget = 12000) {
  const ast = ts.createSourceFile(
    "x.ts",
    fs.readFileSync("lib/alpaca-options.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export /, ""))
    .join("\n")
    .replace(
      "const OPTIONS_BUDGET_MS = 45000",
      "const OPTIONS_BUDGET_MS = " + budget,
    )
    .replace(
      "AbortSignal.timeout(12000)",
      `AbortSignal.timeout(${pageBudget})`,
    );
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(
    "fetch",
    "process",
    "normalizeOptions",
    "readBoundedMarketJson",
    js + ";return alpacaOptions",
  )(
    fetcher,
    {
      env: {
        AURYN_OPTIONS_ENABLED: "true",
        ALPACA_PAPER_API_KEY: "test",
        ALPACA_PAPER_API_SECRET: "test",
      },
    },
    normalizeOptions,
    readBoundedMarketJson,
  );
}
const id = "APP281215C00100000";
const page = () => ({
  snapshots: {
    [id]: { latestQuote: { t: new Date().toISOString(), bp: 1, ap: 2 } },
  },
  next_page_token: null,
});
test("already cancelled caller does not start provider acquisition", async () => {
  let n = 0;
  const read = adapter(async () => {
    n++;
    return Response.json(page());
  });
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(read("APP", null, abort.signal));
  assert.equal(n, 0);
});
test("overall deadline aborts stalled snapshot fetch without waiting for per-page renewal", async () => {
  let signal;
  const read = adapter(async (_u, init) => {
    signal = init.signal;
    return new Promise(() => {});
  });
  const start = Date.now();
  await assert.rejects(read("APP", null));
  assert.ok(Date.now() - start < 1000);
  assert.equal(signal.aborted, true);
});
test("one cancelled waiter does not cancel another caller sharing the same chain", async () => {
  let finish,
    signal,
    calls = 0;
  const read = adapter(async (u, init) => {
    calls++;
    signal = init.signal;
    if (String(u).includes("snapshots"))
      return new Promise(
        (resolve) => (finish = () => resolve(Response.json(page()))),
      );
    return Response.json({ option_contracts: [], next_page_token: null });
  }, 1000);
  const a = new AbortController();
  const p1 = read("APP", null, a.signal),
    p2 = read("APP", null);
  a.abort();
  await assert.rejects(p1);
  assert.equal(signal.aborted, false);
  finish();
  const result = await p2;
  assert.equal(result.contracts.length, 1);
  assert.equal(calls, 2);
});
test("metadata deadline retains usable quotes as incomplete, not fabricated open interest", async () => {
  const read = adapter(async (u) =>
    String(u).includes("snapshots")
      ? Response.json(page())
      : new Promise(() => {}),
  );
  const result = await read("APP", null);
  assert.equal(result.contracts.length, 1);
  assert.equal(result.complete, false);
  assert.equal(result.contracts[0].oi, null);
});
test("oversized snapshot response fails before cache publication", async () => {
  let calls = 0;
  const read = adapter(async () => {
    calls++;
    return new Response("x", { headers: { "content-length": "3000000" } });
  }, 1000);
  await assert.rejects(read("APP", null));
  await assert.rejects(read("APP", null));
  assert.equal(calls, 2);
});
test("last cancelled waiter aborts upstream and prevents later metadata acquisition", async () => {
  let upstream,
    calls = 0;
  const read = adapter(async (_url, init) => {
    calls++;
    upstream = init.signal;
    return new Promise(() => {});
  }, 1000);
  const a = new AbortController();
  const result = read("APP", null, a.signal);
  a.abort();
  await assert.rejects(result);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(upstream.aborted, true);
  assert.equal(calls, 1);
});
test("chunked response without declared length is bounded", async () => {
  let cancelled = false;
  const read = adapter(
    async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(2000001));
          },
          cancel() {
            cancelled = true;
          },
        }),
      ),
    1000,
  );
  await assert.rejects(read("APP", null));
  assert.equal(cancelled, true);
});
test("route and provider selection forward the exact caller cancellation signal", async () => {
  function load(file, b, name) {
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
    return new Function(...Object.keys(b), code + ";return " + name)(
      ...Object.values(b),
    );
  }
  class HttpError extends Error {}
  const controller = new AbortController();
  const request = new Request("https://local.test/api/options/APP", {
    signal: controller.signal,
  });
  let observed;
  const selected = load(
    "lib/options-source.ts",
    {
      HttpError,
      process: { env: { AURYN_OPTIONS_ENABLED: "true" } },
      alpacaOptions: async (t, e, s) => {
        observed = s;
        return { contracts: [] };
      },
    },
    "loadOptionChain",
  );
  const route = load(
    "app/api/options/[symbol]/route.ts",
    {
      HttpError,
      account: async () => ({ user: { id: "u" } }),
      requestAccess: async () => ({}),
      requireFeature: () => {},
      reserveAccess: async () => {},
      limit: async () => {},
      privateJson: (x) => x,
      failure: (e) => {
        throw e;
      },
      loadOptionChain: selected,
    },
    "GET",
  );
  await route(request, { params: Promise.resolve({ symbol: "APP" }) });
  assert.equal(observed, request.signal);
});

test("metadata page timeout before overall deadline never caches incomplete result", async () => {
  let calls = 0;
  const read = adapter(
    async (url) => {
      calls++;
      return String(url).includes("snapshots")
        ? Response.json(page())
        : new Promise(() => {});
    },
    1000,
    20,
  );
  const first = await read("APP", null);
  assert.equal(first.contracts.length, 1);
  assert.equal(first.paginationComplete, false);
  assert.equal(calls, 2);
  const second = await read("APP", null);
  assert.equal(second.contracts.length, 1);
  assert.equal(calls, 4);
  assert.notEqual(first, second);
});
