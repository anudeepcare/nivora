import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createHash } from "node:crypto";
import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
function compile(path) {
  const ast = ts.createSourceFile(
    path,
    fs.readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
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
for (const kind of ["Summary", "Insider"]) {
  const slug = kind.toLowerCase();
  function fixture() {
    let clock = Date.now(),
      limits = 0;
    const FakeDate = class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [clock]));
      }
      static now() {
        return clock;
      }
    };
    const project = providerFixtureFunction(
      "Date",
      compile(`lib/market-${slug}.ts`) + `;return market${kind};`,
    )(FakeDate);
    const read = providerFixtureFunction(
      "Date",
      "createHash",
      "HttpError",
      "limit",
      `market${kind}`,
      "readBoundedMarketJson",
      compile(`lib/market-${slug}.server.ts`) + `;return readMarket${kind};`,
    )(
      FakeDate,
      createHash,
      HttpError,
      async () => {
        limits++;
      },
      project,
      async (r) => r.json(),
    );
    return {
      read: (key, fetcher, days = 30) =>
        kind === "Summary"
          ? read({ key, fetcher })
          : read(days, { key, fetcher }),
      advance: (ms) => (clock += ms),
      limits: () => limits,
      payload: () =>
        kind === "Summary"
          ? {
              headline: "H",
              expandedContent: null,
              generatedAt: null,
              lastUpdated: clock,
            }
          : { isPreview: false, data: { buys: [], sells: [] } },
    };
  }
  test(`${kind} coalesces cold callers, retains completion TTL and separates credentials/query`, async () => {
    const f = fixture();
    let calls = 0,
      release;
    const gate = new Promise((r) => (release = r));
    const fetcher = async () => {
      calls++;
      await gate;
      return Response.json(f.payload());
    };
    const pending = [f.read("A", fetcher), f.read("A", fetcher)];
    await new Promise((r) => setImmediate(r));
    assert.equal(calls, 1);
    assert.equal(f.limits(), 1);
    f.advance(1000);
    release();
    const [a, b] = await Promise.all(pending);
    assert.strictEqual(a, b);
    await f.read("A", fetcher);
    assert.equal(calls, 1);
    await f.read("B", fetcher);
    assert.equal(calls, 2);
    if (kind === "Insider") {
      await f.read("A", fetcher, 90);
      assert.equal(calls, 3);
    }
    const before = calls;
    f.advance(899999);
    await f.read("A", fetcher);
    assert.equal(calls, before);
    f.advance(1);
    await f.read("A", fetcher);
    assert.equal(calls, before + 1);
  });
  test(`${kind} clears rejected shared operation so next request retries without caching failure`, async () => {
    const f = fixture();
    let calls = 0;
    const fetcher = async () => {
      calls++;
      await new Promise((r) => setImmediate(r));
      return new Response("SECRET", { status: 503 });
    };
    const result = await Promise.allSettled([
      f.read("A", fetcher),
      f.read("A", fetcher),
    ]);
    assert.equal(calls, 1);
    for (const r of result) {
      assert.equal(r.status, "rejected");
      assert.equal(r.reason.status, 503);
      assert.doesNotMatch(r.reason.message, /SECRET/);
    }
    await f.read("A", async () => {
      calls++;
      return Response.json(f.payload());
    });
    assert.equal(calls, 2);
  });
}
