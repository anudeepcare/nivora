import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { projectRating, ratingSymbol } from "../lib/provider-rating.ts";
const now = Date.parse("2026-11-18T14:00:00Z");
const keys = [
  "crowd",
  "smart_money",
  "options",
  "analysts",
  "fundamentals",
  "earnings",
  "technicals",
];
const fixture = () => ({
  ticker: "AAPL",
  rated: true,
  score: 85.6,
  letter: "B",
  percentile: 100,
  penaltyPoints: 14.4,
  riskAdjustments: [
    { condition: "weak_dimension", points: 2.4 },
    { condition: "high_leverage", points: 12 },
  ],
  riskConditions: ["weak_dimension", "high_leverage"],
  bucketLetter: "A",
  composite: 0.19,
  ratedCount: 1000,
  asOf: "2026-11-18",
  methodologyVersion: "synthetic-v1",
  dimensions: keys.map((key) => ({
    key,
    label: key,
    percentile: 50,
    raw: key === "smart_money" ? null : 0,
    rawLabel: null,
    present: true,
    ...(key === "smart_money"
      ? {
          subLegs: [
            { key: "inst_13f", label: "13F net change", raw: 4, unit: "%" },
          ],
        }
      : {}),
  })),
  flags: [
    {
      key: "unusual_options_flow",
      label: "Unusual options flow",
      active: false,
    },
  ],
  disclaimer: "Synthetic disclaimer, not a trade instruction.",
  betaNotice: "Synthetic beta notice.",
});
const unrated = () => ({
  ticker: "AAPL",
  rated: false,
  reason: "not_rated_today",
  asOf: "2026-11-18",
  presentDimensions: [],
  dimensions: keys.map((key) => ({
    key,
    label: key,
    present: false,
    percentile: null,
    raw: null,
    rawLabel: null,
  })),
  flags: [],
  disclaimer: "Synthetic disclaimer.",
});
test("rating separates score/letter from pre-adjustment rank and retains raw-null present dimensions", () => {
  const p = projectRating(fixture(), "AAPL", now);
  assert.equal(p.score, 85.6);
  assert.equal(p.percentile, 100);
  assert.equal(p.letter, "B");
  assert.equal(p.dimensions[1].present, true);
  assert.equal(p.dimensions[1].raw, null);
  assert.equal(p.dimensions[1].subLegs[0].raw, 4);
  assert.equal(p.flags.length, 1);
  assert.equal(p.flags[0].active, false);
  assert.equal(p.betaNotice, "Synthetic beta notice.");
});
test("unrated is evidence absence not a default C/zero, optional count allowed", () => {
  const p = projectRating(unrated(), "AAPL", now);
  assert.equal(p.rated, false);
  assert.equal(p.score, null);
  assert.equal(p.letter, null);
  assert.equal(p.presentCount, 0);
  assert.equal(p.reason, "not_rated_today");
  const x = unrated();
  x.dimensionsPresent = 1;
  assert.equal(projectRating(x, "AAPL", now), null);
});
test("reject mismatched identity, future/invalid dates, coerced metrics and contradictory letter", () => {
  for (const alter of [
    (x) => (x.ticker = "GOOGL"),
    (x) => (x.asOf = "2026-02-30"),
    (x) => (x.asOf = "2027-01-01"),
    (x) => (x.score = [85.6]),
    (x) => (x.letter = "A"),
    (x) => (x.dimensions[0].percentile = 101),
    (x) => (x.flags[0].active = "false"),
    (x) => x.dimensions.push(x.dimensions[0]),
  ]) {
    const x = fixture();
    alter(x);
    assert.equal(projectRating(x, "AAPL", now), null);
  }
  assert.equal(ratingSymbol("../AAPL"), null);
  assert.equal(ratingSymbol("AAPL"), "AAPL");
});
test("unknown future adjustment names retained without interpreting them as fixed 12 point penalties", () => {
  const x = fixture();
  x.riskAdjustments[0].condition = "new_condition";
  x.riskConditions[0] = "new_condition";
  assert.equal(projectRating(x, "AAPL", now).adjustments[0].points, 2.4);
});

import fs from "node:fs";
import ts from "typescript";
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

test("fixed rating transport validates source identity and body bounds without leaking failures", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const run = load(
    "lib/provider-rating.server.ts",
    {
      HttpError,
      limit: async () => {},
      ratingSymbol,
      projectRating,
      readBoundedMarketJson,
    },
    "readProviderRating",
  );
  let calls = 0;
  const fetcher = async (url, opt) => {
    calls++;
    assert.equal(url, "https://app.sentisense.ai/api/v1/rating/AAPL");
    assert.equal(opt.redirect, "error");
    return new Response(JSON.stringify(fixture()));
  };
  assert.equal(
    (await run("AAPL", { key: "synthetic", fetcher, now })).score,
    85.6,
  );
  await assert.rejects(
    run("../AAPL", { key: "synthetic", fetcher, now }),
    (e) => e.status === 400,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    run("AAPL", {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
      now,
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
  await assert.rejects(
    run("AAPL", {
      key: "synthetic",
      fetcher: async () => new Response(" ".repeat(2000001)),
      now,
    }),
    (e) => e.status === 502,
  );
  await assert.rejects(
    run("AAPL", {
      key: "synthetic",
      fetcher: async () =>
        new Response(JSON.stringify({ ...fixture(), ticker: "GOOGL" })),
      now,
    }),
    (e) => e.status === 502,
  );
});
test("rating route requires account, deployment permission, feature and quota before read", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/provider-rating/route.ts",
    {
      HttpError,
      ratingSymbol,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "test" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: (_, name) => {
        assert.equal(name, "advanced");
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readProviderRating: async () => {
        calls++;
        return {};
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    new Request(
      "https://local.test/api/provider-rating" + (q ?? "?symbol=AAPL"),
    );
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
    "?symbol=../AAPL",
    "?symbol=AAPL&symbol=GOOGL",
    "?symbol=AAPL&url=https://evil",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(calls, 1);
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function ui(enabled, data) {
  const file = "components/ProviderRating.tsx";
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace("export default function", "function"))
    .join("\n");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  let requested;
  const Component = providerFixtureFunction(
    "React",
    "useState",
    "useResource",
    "s",
    code + ";return ProviderRating;",
  )(
    React,
    () => [enabled, () => {}],
    (url) => {
      requested = url;
      return { data, error: null, loading: false, refresh: () => {} };
    },
    {},
  );
  return {
    html: renderToStaticMarkup(
      React.createElement(Component, { symbol: "AAPL" }),
    ),
    requested,
  };
}
test("rating UI loads only on request, labels score vs rank, no Pace or trade verdict", () => {
  assert.equal(ui(false, null).requested, null);
  const data = {
    ...projectRating(fixture(), "AAPL", now),
    retrievedAt: new Date(now).toISOString(),
  };
  const shown = ui(true, data);
  assert.equal(shown.requested, "provider-rating?symbol=AAPL");
  assert.match(shown.html, /85.6/);
  assert.match(shown.html, /Rank before adjustments/);
  assert.match(shown.html, /100/);
  assert.match(shown.html, /14.4/);
  assert.match(shown.html, /Synthetic beta notice/);
  assert.match(shown.html, /Synthetic disclaimer/);
  assert.match(shown.html, /Not assessable/);
  assert.doesNotMatch(ui(true, { ...data, symbol: "GOOGL" }).html, /85.6/);
  assert.match(
    ui(true, { ...projectRating(unrated(), "AAPL", now) }).html,
    /Not rated/,
  );
});
test("route to real transport and projection to UI preserves provider score not percentile", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = load(
    "lib/provider-rating.server.ts",
    {
      HttpError,
      limit: async () => {},
      ratingSymbol,
      projectRating,
      readBoundedMarketJson,
    },
    "readProviderRating",
  );
  const get = load(
    "app/api/provider-rating/route.ts",
    {
      HttpError,
      ratingSymbol,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readProviderRating: (s) =>
        read(s, {
          key: "synthetic",
          now,
          fetcher: async () => new Response(JSON.stringify(fixture())),
        }),
      privateJson: (x) => x,
      failure: (e) => {
        throw e;
      },
    },
    "GET",
  );
  const result = await get(
    new Request("https://local.test/api/provider-rating?symbol=AAPL"),
  );
  assert.equal(result.score, 85.6);
  assert.equal(result.percentile, 100);
  assert.match(ui(true, result).html, /85.6/);
});
test("rated result below documented count or weight coverage is rejected, never repaired", () => {
  for (const present of [
    ["crowd", "fundamentals", "technicals"],
    ["crowd", "options", "analysts", "earnings"],
  ]) {
    const x = fixture();
    x.dimensions = x.dimensions.map((d) =>
      present.includes(d.key)
        ? d
        : { ...d, present: false, percentile: null, raw: null, subLegs: [] },
    );
    x.percentile = 10;
    x.penaltyPoints = 12;
    x.riskAdjustments = [{ condition: "thin_coverage", points: 12 }];
    x.riskConditions = ["thin_coverage"];
    x.score = 10;
    x.letter = "D";
    x.bucketLetter = "D";
    assert.equal(projectRating(x, "AAPL", now), null);
  }
  const x = fixture();
  x.dimensions = x.dimensions.map((d) =>
    ["fundamentals", "crowd", "options", "earnings"].includes(d.key)
      ? d
      : { ...d, present: false, percentile: null, raw: null, subLegs: [] },
  );
  assert.equal(projectRating(x, "AAPL", now).rated, true);
});
