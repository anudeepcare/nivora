import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  etfAggregateRequest,
  projectEtfAggregate,
} from "../lib/etf-aggregate-evidence.ts";
const now = Date.parse("2026-11-18T14:00:00Z");
const coverage = () => ({
  holdingsCount: 10,
  holdingsCovered: 5,
  weightCovered: 60,
  partial: true,
  totalKnownHoldings: 100,
});
const insider = () => ({
  isPreview: false,
  previewReason: null,
  data: {
    ticker: "QQQ",
    asOfDate: "2026-11-17",
    computedAt: now / 1000 - 10,
    lookbackDays: 30,
    coverage: coverage(),
    weightedNetFlow: {
      netDollars: -50,
      buyDollars: 50,
      sellDollars: 100,
      buyTradeCount: 2,
      sellTradeCount: 3,
      distinctInsiderCount: 4,
    },
    topContributors: [
      {
        ticker: "AAPL",
        weightPct: 20,
        netDollars: -250,
        weightedNetDollars: -50,
        tradeCount: 5,
      },
    ],
  },
});
const sentiment = () => ({
  isPreview: false,
  previewReason: null,
  data: {
    ticker: "QQQ",
    asOfDate: null,
    computedAt: now / 1000 - 10,
    coverage: coverage(),
    constituentsWeighted: {
      sentiSenseScore: 12.5,
      scoreLabel: "BULLISH",
      asOfTimestamp: now / 1000 - 86400,
    },
    direct: null,
  },
});
test("ETF insider preserves weighted dollar flow versus unweighted trade counts and coverage", () => {
  const p = projectEtfAggregate(insider(), "QQQ", "insider30", now);
  assert.equal(p.flow.netDollars, -50);
  assert.equal(p.flow.buyTradeCount, 2);
  assert.equal(p.contributors[0].weightedNetDollars, -50);
  assert.equal(p.coverage.weightCovered, 60);
  assert.equal(p.coverage.partial, true);
  assert.equal(p.lookbackDays, 30);
});
test("ETF sentiment signed Score is unbounded, direct absence remains missing and metric date separate", () => {
  const p = projectEtfAggregate(sentiment(), "QQQ", "sentiment", now);
  assert.equal(p.weighted.score, 12.5);
  assert.equal(p.direct, null);
  assert.equal(p.asOfDate, null);
  assert.notEqual(p.weighted.asOf, p.computedAt);
  const x = sentiment();
  x.data.constituentsWeighted.sentiSenseScore = -120;
  assert.equal(
    projectEtfAggregate(x, "QQQ", "sentiment", now).weighted.score,
    -120,
  );
});
test("identity, future timestamps, boolean numbers, impossible coverage and requested window fail closed", () => {
  for (const change of [
    (x) => (x.data.ticker = "SPY"),
    (x) => (x.data.computedAt = now / 1000 + 1),
    (x) => (x.data.lookbackDays = 90),
    (x) => (x.data.coverage.holdingsCovered = 11),
    (x) => (x.data.coverage.weightCovered = 101),
    (x) => (x.data.weightedNetFlow.netDollars = false),
  ]) {
    const x = insider();
    change(x);
    assert.equal(projectEtfAggregate(x, "QQQ", "insider30", now), null);
  }
  assert.equal(etfAggregateRequest("../QQQ", "sentiment"), null);
  assert.equal(etfAggregateRequest("QQQ", "user"), null);
  assert.equal(
    etfAggregateRequest("QQQ", "insider90").path,
    "/QQQ/aggregates/insider?lookbackDays=90",
  );
});
test("preview is retained and missing metrics never zero-filled", () => {
  const x = insider();
  x.isPreview = true;
  x.previewReason = "LIMITED";
  x.data.weightedNetFlow.netDollars = null;
  const p = projectEtfAggregate(x, "QQQ", "insider30", now);
  assert.equal(p.preview, true);
  assert.equal(p.flow.netDollars, null);
  assert.equal(p.previewReason, "LIMITED");
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

test("fixed ETF aggregate transport, identity and body bounds", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const run = load(
    "lib/etf-aggregate-evidence.server.ts",
    {
      HttpError,
      limit: async () => {},
      etfAggregateRequest,
      projectEtfAggregate,
      readBoundedMarketJson,
    },
    "readEtfAggregate",
  );
  let calls = 0;
  const fetcher = async (url, opt) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/etfs/QQQ/aggregates/insider?lookbackDays=30",
    );
    assert.equal(opt.redirect, "error");
    return new Response(JSON.stringify(insider()));
  };
  assert.equal(
    (await run("QQQ", "insider30", { key: "synthetic", fetcher, now })).flow
      .netDollars,
    -50,
  );
  await assert.rejects(
    run("QQQ", "user", { key: "synthetic", fetcher, now }),
    (e) => e.status === 400,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    run("QQQ", "sentiment", {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
      now,
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
  await assert.rejects(
    run("QQQ", "sentiment", {
      key: "synthetic",
      fetcher: async () => new Response(" ".repeat(2000001)),
      now,
    }),
    (e) => e.status === 502,
  );
});
test("route auth, deployment, advanced feature and quota before provider call", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const features = [];
  const get = load(
    "app/api/etf-aggregate-evidence/route.ts",
    {
      HttpError,
      etfAggregateRequest,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "test" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: (_, name) => {
        features.push(name);
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readEtfAggregate: async () => {
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
      "https://local.test/api/etf-aggregate-evidence" +
        (q ?? "?symbol=QQQ&mode=insider30"),
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
    "?symbol=../QQQ&mode=insider30",
    "?symbol=QQQ&symbol=SPY&mode=insider30",
    "?symbol=QQQ&mode=user",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(features.at(-1), "advanced");
  assert.equal((await get(req("?symbol=QQQ&mode=sentiment"))).status, 200);
  assert.equal(features.at(-1), "advanced");
  assert.equal(calls, 2);
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function ui(mode, data) {
  const file = "components/EtfAggregateEvidence.tsx";
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
    code + ";return EtfAggregateEvidence;",
  )(
    React,
    () => [mode, () => {}],
    (url) => {
      requested = url;
      return { data, error: null, loading: false, refresh: () => {} };
    },
    {},
  );
  return {
    html: renderToStaticMarkup(
      React.createElement(Component, { symbol: "QQQ" }),
    ),
    requested,
  };
}
test("UI is lazy and explains constituent flow, unweighted counts, partial coverage and missing direct score", () => {
  assert.equal(ui(null, null).requested, null);
  const p = {
    ...projectEtfAggregate(insider(), "QQQ", "insider30", now),
    retrievedAt: new Date(now).toISOString(),
  };
  const shown = ui("insider30", p);
  assert.equal(
    shown.requested,
    "etf-aggregate-evidence?symbol=QQQ&mode=insider30",
  );
  assert.match(shown.html, /Weighted net USD/);
  assert.match(shown.html, /Unweighted buy trades/);
  assert.match(shown.html, /Partial composition/);
  assert.match(shown.html, /not fund inflows/);
  assert.match(
    ui("sentiment", projectEtfAggregate(sentiment(), "QQQ", "sentiment", now))
      .html,
    /Direct fund mentions/,
  );
  assert.match(
    ui("sentiment", projectEtfAggregate(sentiment(), "QQQ", "sentiment", now))
      .html,
    /Not supplied/,
  );
  assert.doesNotMatch(
    ui("insider30", { ...p, symbol: "SPY" }).html,
    /Weighted net USD/,
  );
});
test("route through real transport/projector to UI preserves signed insider flow and sentiment units", async () => {
  const { readBoundedMarketJson } = await import("../lib/market-response.ts");
  const read = load(
    "lib/etf-aggregate-evidence.server.ts",
    {
      HttpError,
      limit: async () => {},
      etfAggregateRequest,
      projectEtfAggregate,
      readBoundedMarketJson,
    },
    "readEtfAggregate",
  );
  const get = load(
    "app/api/etf-aggregate-evidence/route.ts",
    {
      HttpError,
      etfAggregateRequest,
      account: async () => ({ user: { id: "test" } }),
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: () => {},
      limit: async () => {},
      reserveAccess: async () => {},
      readEtfAggregate: (s, m) =>
        read(s, m, {
          key: "synthetic",
          now,
          fetcher: async () =>
            new Response(
              JSON.stringify(m === "sentiment" ? sentiment() : insider()),
            ),
        }),
      privateJson: (x) => x,
      failure: (e) => {
        throw e;
      },
    },
    "GET",
  );
  for (const mode of ["insider30", "sentiment"]) {
    const result = await get(
      new Request(
        "https://local.test/api/etf-aggregate-evidence?symbol=QQQ&mode=" + mode,
      ),
    );
    const html = ui(mode, result).html;
    assert.match(html, mode === "sentiment" ? /12.5/ : /-50/);
  }
});
