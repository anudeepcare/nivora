import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {
  indexIds,
  indexCatalog,
  indexDetail,
  indexHistory,
} from "../lib/alternative-indexes.ts";
const now = Date.parse("2026-11-18T12:00:00Z");
const detail = () => ({
  indexId: "fed-sentiment",
  displayName: "Fed",
  scale: "SENTIMENT",
  asOf: "2026-11-16",
  value: 0,
  coverage: 1,
  basketSize: 2,
  totalMentions: 5,
  methodologyNote: "Synthetic fixture",
  constituents: [
    {
      displayName: "Example",
      role: "Chair",
      weight: 3,
      value: 0,
      mentionsCount: 5,
      staleness: "CARRIED_FORWARD",
      contribution: null,
      link: "javascript:bad",
      secret: "never",
    },
  ],
});
test("catalog closed IDs and scales never execute canonical URLs", () => {
  const row = {
    indexId: "fed-sentiment",
    displayName: "Fed",
    description: "Example",
    scale: "SENTIMENT",
    accessTier: "free",
    canonicalUrl: "https://evil.test",
  };
  assert.equal(indexCatalog({ indexes: [row] })[0].scale, "SENTIMENT");
  assert.ok(!JSON.stringify(indexCatalog({ indexes: [row] })).includes("evil"));
  assert.deepEqual(
    indexCatalog({ indexes: [{ ...row, indexId: "../secret" }] }),
    [],
  );
  assert.equal(indexCatalog({ indexes: [row, row] }), null);
  assert.equal(indexCatalog({ indexes: [{ ...row, scale: "GUESS" }] }), null);
});
test("detail preserves carry states and zero; rejects bad dates identity bounds and mutable leaves", () => {
  const v = indexDetail(detail(), "fed-sentiment", now);
  assert.equal(v.value, 0);
  assert.equal(v.constituents[0].state, "CARRIED_FORWARD");
  assert.ok(!JSON.stringify(v).includes("never"));
  assert.ok(!JSON.stringify(v).includes("javascript"));
  for (const mutate of [
    (x) => (x.indexId = "ai-sentiment"),
    (x) => (x.asOf = "2030-01-01"),
    (x) => (x.asOf = "2026-02-30"),
    (x) => (x.value = 2),
    (x) => (x.coverage = 3),
    (x) => (x.constituents[0].value = [0]),
    (x) => (x.constituents[0].staleness = "LIVE"),
  ]) {
    const x = detail();
    mutate(x);
    assert.equal(indexDetail(x, "fed-sentiment", now), null);
  }
  const x = detail();
  x.asOf = null;
  x.value = null;
  assert.equal(indexDetail(x, "fed-sentiment", now).value, null);
});
test("composite null coverage is not missing basket or zero; scales remain separate", () => {
  const x = {
    ...detail(),
    indexId: "market-mood",
    scale: "PERCENT_0_100",
    value: 75,
    coverage: null,
    basketSize: null,
    totalMentions: null,
    constituents: null,
  };
  const r = indexDetail(x, "market-mood", now);
  assert.equal(r.coverage, null);
  assert.equal(r.value, 75);
  assert.equal(indexDetail({ ...x, value: 101 }, "market-mood", now), null);
  assert.equal(indexDetail({ ...x, coverage: 0 }, "market-mood", now), null);
});
test("history keeps elapsed-date gaps without interpolation, rejects unordered duplicates and future", () => {
  const x = {
    indexId: "fed-sentiment",
    displayName: "Fed",
    scale: "SENTIMENT",
    days: 180,
    history: [
      { date: "2026-10-05", value: 0 },
      { date: "2026-11-16", value: null },
    ],
  };
  assert.deepEqual(indexHistory(x, "fed-sentiment", now).points, x.history);
  for (const history of [
    [...x.history, x.history[0]],
    [{ date: "2030-01-01", value: 0 }],
    [{ date: "2026-11-16", value: Infinity }],
  ])
    assert.equal(indexHistory({ ...x, history }, "fed-sentiment", now), null);
  assert.equal(indexHistory({ ...x, days: 365 }, "fed-sentiment", now), null);
});
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
  return providerFixtureFunction(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
test("server fixed paths, bounded one request, no redirects or exception secrets", async () => {
  const run = load(
    "lib/alternative-indexes.server.ts",
    {
      indexIds,
      indexCatalog,
      indexDetail,
      indexHistory,
      HttpError,
      limit: async () => {},
    },
    "readAlternativeIndex",
  );
  let calls = 0;
  const fetcher = async (url, opts) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/indexes/fed-sentiment/history?days=180",
    );
    assert.equal(opts.redirect, "error");
    return new Response(
      JSON.stringify({
        indexId: "fed-sentiment",
        displayName: "Fed",
        scale: "SENTIMENT",
        days: 180,
        history: [],
      }),
    );
  };
  await run("fed-sentiment", "history", { key: "synthetic", fetcher });
  assert.equal(calls, 1);
  for (const [id, mode] of [
    ["../x", "detail"],
    [null, "history"],
    ["fed-sentiment", "evil"],
  ])
    await assert.rejects(
      run(id, mode, { key: "synthetic", fetcher }),
      (e) => e.status === 400,
    );
  assert.equal(calls, 1);
  await assert.rejects(
    run("fed-sentiment", "detail", {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
  await assert.rejects(
    run("fed-sentiment", "detail", {
      key: "synthetic",
      fetcher: async () => new Response("x".repeat(2000001)),
    }),
    (e) => e.status === 502,
  );
});
test("route prevents unauthorized sample feature quota and malformed requests before provider", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/alternative-indexes/route.ts",
    {
      HttpError,
      indexIds,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "synthetic" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: () => {
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readAlternativeIndex: async () => {
        calls++;
        return {};
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    new Request("https://local.test/api/alternative-indexes" + (q ?? ""));
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
    "?id=evil",
    "?id=fed-sentiment&id=ai-sentiment",
    "?mode=history",
    "?id=fed-sentiment&mode=x",
    "?canonicalUrl=https://evil.test",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req("?id=fed-sentiment&mode=history"))).status, 200);
  assert.equal(calls, 1);
});
test("UI requests one selected mode, draws dated points not gap-bridging lines, preserves carry disclosure", () => {
  const ui = fs.readFileSync("components/AlternativeIndexes.tsx", "utf8");
  assert.match(ui, /selected\s*\?\s*`alternative-indexes/);
  assert.doesNotMatch(ui, /setInterval|useEffect|<polyline|<path/);
  assert.match(ui, /Date.parse\(p.date\)/);
  assert.match(ui, /Carried-forward readings are not fresh/);
  assert.match(ui, /constituents === null/);
  assert.match(ui, /Missing dates are absent/);
});

test("unexpected flat previews are withheld rather than treated as full readings", () => {
  assert.equal(
    indexDetail({ ...detail(), isPreview: true }, "fed-sentiment", now),
    null,
  );
  assert.equal(
    indexHistory(
      {
        indexId: "fed-sentiment",
        displayName: "Fed",
        scale: "SENTIMENT",
        days: 180,
        history: [],
        isPreview: true,
      },
      "fed-sentiment",
      now,
    ),
    null,
  );
});
