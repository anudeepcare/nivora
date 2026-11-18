import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("lib/market-insider.ts", "utf8");
const { marketInsider } = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
);
const row = {
  ticker: "ABC",
  companyName: "Example",
  tradeCount: 2,
  insiderCount: 1,
  totalShares: 0,
  totalValue: 0,
  latestDate: "2026-11-17",
  latestInsider: "A",
  latestTitle: "Director",
  secret: "not exposed",
};
const payload = (buys = [row], sells = []) => ({
  isPreview: true,
  data: { buys, sells },
});
test("aggregates preserve zero, preview, direction and whitelist", () => {
  const r = marketInsider(payload(), 30, "2026-11-18T00:00:00Z");
  assert.equal(r.buys[0].totalValue, 0);
  assert.equal(r.isPreview, true);
  assert.equal(r.buys[0].secret, undefined);
  assert.deepEqual(r.sells, []);
});
test("reject unsupported envelopes/windows and duplicate company identities", () => {
  assert.equal(marketInsider(payload(), 365, "2026-11-18"), null);
  assert.equal(
    marketInsider(payload([row, { ...row, ticker: "abc" }]), 30, "2026-11-18"),
    null,
  );
  assert.equal(
    marketInsider({ data: { buys: [], sells: [] } }, 30, "2026-11-18"),
    null,
  );
});
test("withhold malformed future/old dates and invalid aggregate counts", () => {
  for (const patch of [
    { latestDate: "2026-11-19" },
    { latestDate: "2026-02-30" },
    { latestDate: "2025-11-17" },
    { totalValue: -1 },
    { insiderCount: 3 },
  ]) {
    const r = marketInsider(payload([{ ...row, ...patch }]), 30, "2026-11-18");
    assert.equal(r.omitted, 1);
    assert.equal(r.buys.length, 0);
  }
});
test("route gates before provider; fixed bounded transport and honest UI", () => {
  const route = fs.readFileSync("app/api/market-insider/route.ts", "utf8"),
    server = fs.readFileSync("lib/market-insider.server.ts", "utf8"),
    ui = fs.readFileSync("components/MarketInsiderActivity.tsx", "utf8");
  assert.match(route, /access.sampleOnly/);
  assert.match(route, /requireFeature\(access,\s*"advanced"\)/);
  assert.ok(
    route.indexOf("reserveAccess(user.id") <
      route.indexOf("await readMarketInsider"),
  );
  assert.match(server, /redirect:\s*"error"/);
  assert.match(server, /2 \* 1024 \* 1024/);
  assert.match(server, /insider\/activity\?lookbackDays=/);
  assert.match(ui, /code F/);
  assert.match(ui, /code D/);
  assert.match(ui, /may be older/);
  assert.match(ui, /up to five/);
});
function route({ sample = false, advanced = true } = {}) {
  const calls = [];
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const src = fs.readFileSync("app/api/market-insider/route.ts", "utf8"),
    ast = ts.createSourceFile("r.ts", src, ts.ScriptTarget.Latest, true);
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const bindings = {
    HttpError,
    account: async () => ({ user: { id: "fixture" } }),
    requestAccess: async () => ({ sampleOnly: sample }),
    requireFeature: (_, f) => {
      calls.push(f);
      if (f === "advanced" && !advanced) throw new HttpError("Forbidden", 403);
    },
    limit: async () => calls.push("limit"),
    reserveAccess: async () => calls.push("reserve"),
    readMarketInsider: async (days) => {
      calls.push("provider");
      return { days };
    },
    privateJson: (x) => x,
    failure: (e) => ({ status: e.status }),
  };
  return {
    calls,
    get: providerFixtureFunction(...Object.keys(bindings), js + ";return GET")(
      ...Object.values(bindings),
    ),
  };
}
test("actual route rejects absent advanced and sample mode before provider or reservation", async () => {
  for (const opts of [{ sample: true }, { advanced: false }]) {
    const h = route(opts);
    assert.equal(
      (await h.get(new Request("https://test/api/market-insider"))).status,
      403,
    );
    assert.ok(!h.calls.includes("provider"));
    assert.ok(!h.calls.includes("reserve"));
  }
  for (const query of ["days=365", "days=30&days=90", "ticker=ABC"]) {
    const h = route();
    assert.equal(
      (await h.get(new Request("https://test/api/market-insider?" + query)))
        .status,
      400,
    );
    assert.ok(!h.calls.includes("provider"));
  }
  const h = route();
  assert.deepEqual(
    await h.get(new Request("https://test/api/market-insider?days=30")),
    { days: 30 },
  );
  assert.deepEqual(h.calls, [
    "overview",
    "advanced",
    "limit",
    "reserve",
    "provider",
  ]);
});
test("actual server cache preserves receipt; transport is bounded and errors neutral", async () => {
  const { createHash } = await import("node:crypto");
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const src = fs.readFileSync("lib/market-insider.server.ts", "utf8"),
    ast = ts.createSourceFile("s.ts", src, ts.ScriptTarget.Latest, true);
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const read = providerFixtureFunction(
    "createHash",
    "marketInsider",
    "readBoundedMarketJson",
    "HttpError",
    "limit",
    js + ";return readMarketInsider",
  )(
    createHash,
    marketInsider,
    readBoundedMarketJson,
    HttpError,
    async () => {},
  );
  let calls = 0;
  const fetcher = async (url, opts) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/insider/activity?lookbackDays=30",
    );
    assert.equal(opts.redirect, "error");
    assert.equal(opts.cache, "no-store");
    return new Response(JSON.stringify(payload([], [])));
  };
  const a = await read(30, { key: "fixture", fetcher }),
    b = await read(30, { key: "fixture", fetcher });
  assert.equal(calls, 1);
  assert.equal(a.receivedAt, b.receivedAt);
  await assert.rejects(
    read(30, {
      key: "denied",
      fetcher: async () => new Response("SECRET", { status: 403 }),
    }),
    (e) => e.status === 403 && !e.message.includes("SECRET"),
  );
  await assert.rejects(
    read(30, {
      key: "large",
      fetcher: async () => new Response("x".repeat(2100000)),
    }),
    (e) => e.status === 502,
  );
});
