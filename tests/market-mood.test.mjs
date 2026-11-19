import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { moodSnapshot } from "../lib/market-mood.ts";
const now = Date.parse("2026-11-18T12:00:00Z");
test("market composite uses0–100, preserves null and exact dated history, omits arbitrary fields", () => {
  const r = moodSnapshot(
    {
      market: {
        currentScore: 0,
        phase: "Extreme Fear",
        weeklyChange: null,
        history: [
          { date: "2026-11-17", timestamp: Date.parse("2026-11-17"), score: 0 },
          { date: "2026-11-19", score: 99 },
        ],
        signals: [
          { key: "social_sentiment", label: "Social", value: null, change: 1 },
          { key: "injected", value: 100 },
        ],
        secret: "notreturned",
      },
      sectors: {},
    },
    "mood",
    now,
  );
  assert.equal(r.mood.score, 0);
  assert.equal(r.mood.weeklyChange, null);
  assert.equal(r.mood.signals.length, 1);
  assert.equal(r.mood.signals[0].value, null);
  assert.equal(r.asOf, "2026-11-17");
  assert.equal(r.partial, true);
  assert.doesNotMatch(JSON.stringify(r), /notreturned|injected/);
});
test("sector gap and open score retain distinct units; generatedAt is epoch seconds", () => {
  const r = moodSnapshot(
    {
      asOf: "2026-11-17",
      generatedAt: now / 1000 - 10,
      marketConsensusRatio: 0.3,
      sectors: [
        {
          sector: "Technology",
          meanSentiment: 0.2,
          meanScore: 123.4,
          consensusRatio: 0.25,
          consensusVsMarket: -0.05,
          stockCount: 0,
          totalMentions: null,
          secret: 1,
        },
      ],
    },
    "sectors",
    now,
  );
  assert.equal(r.generatedAt, "2026-11-18T11:59:50.000Z");
  assert.equal(r.sectors.rows[0].meanScore, 123.4);
  assert.equal(r.sectors.rows[0].consensusVsMarket, -0.05);
  assert.equal(r.sectors.rows[0].stockCount, 0);
  assert.equal(r.sectors.rows[0].totalMentions, null);
});
test("breadth stock and mention weights remain separate; contradictory counts are withheld", () => {
  const point = {
    date: "2026-11-17",
    coveredStocks: 10,
    bullish: 5,
    neutral: 2,
    bearish: 3,
    bullishPct: 50,
    bullishMentionPct: 80,
  };
  const r = moodSnapshot(
    {
      asOf: "2026-11-17",
      latest: point,
      series: [point, { ...point, date: "2026-11-16", bullish: 9 }],
    },
    "breadth",
    now,
  );
  assert.equal(r.breadth.latest.bullishPct, 50);
  assert.equal(r.breadth.latest.bullishMentionPct, 80);
  assert.equal(r.breadth.series.length, 1);
  assert.equal(r.partial, true);
  assert.equal(r.breadth.latest.netBreadth, null);
});
test("empty and preview payloads remain explicit, history bounded", () => {
  assert.equal(
    moodSnapshot({ sectors: [] }, "sectors", now).status,
    "no-coverage",
  );
  assert.equal(
    moodSnapshot({ isPreview: true, data: { series: [] } }, "breadth", now)
      .status,
    "preview",
  );
  assert.equal(
    moodSnapshot({ market: { history: [], currentScore: null } }, "mood", now)
      .status,
    "no-coverage",
  );
  assert.equal(moodSnapshot({ surprise: "shape" }, "breadth", now), null);
});
function server(fetcher) {
  const source = fs.readFileSync("lib/market-mood.server.ts", "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  const require = (id) =>
    id === "./sentisense-provider.server"
      ? {sentisenseFetch:(input,init,transport=fetcher)=>transport(input,init)}
      : id === "server-only"
      ? {}
      : id === "./server"
        ? {
            HttpError: class extends Error {
              constructor(m, s) {
                super(m);
                this.status = s;
              }
            },
            limit: async () => {},
          }
        : id === "./market-response"
          ? {
              readBoundedMarketJson: async (r, cap) => {
                assert.equal(cap, 2000000);
                return r.json();
              },
            }
          : { moodKinds: ["mood", "sectors", "breadth"], moodSnapshot };
  new Function("require", "exports", "process", "fetch", code)(
    require,
    exports,
    { env: { SENTISENSE_API_KEY: "test" } },
    fetcher,
  );
  return exports.readMarketMood;
}
test("server fixed v2path, redirection denial and concurrent dedupe preserve acquisition timestamp", async () => {
  let calls = 0;
  const read = server(async (url, options) => {
    calls++;
    assert.equal(url, "https://app.sentisense.ai/api/v2/market-mood?days=90");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    return Response.json({ market: { history: [], currentScore: null } });
  });
  const [a, b] = await Promise.all([read("mood"), read("mood")]);
  assert.equal(calls, 1);
  assert.equal(a.retrievedAt, b.retrievedAt);
  await read("mood");
  assert.equal(calls, 1);
  await assert.rejects(() => read("arbitrary"));
});
test("source429 establishes cooldown without retry fanout", async () => {
  let calls = 0;
  const read = server(async () => {
    calls++;
    return new Response("", { status: 429, headers: { "Retry-After": "120" } });
  });
  await assert.rejects(() => read("sectors"));
  await assert.rejects(() => read("breadth"));
  assert.equal(calls, 1);
});
test("route gates before provider, UI selects exactly one lazy view", () => {
  const route = fs.readFileSync("app/api/market-mood/route.ts", "utf8");
  for (const token of [
    "account(",
    "access.sampleOnly",
    "requireFeature(access,",
    "reserveAccess",
    "privateJson",
  ])
    assert.ok(route.includes(token));
  assert.ok(
    route.indexOf("requireFeature") < route.lastIndexOf("await readMarketMood"),
  );
  const ui = fs.readFileSync("components/MarketMood.tsx", "utf8");
  assert.match(ui, /kind&&!demo|kind && !demo/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
  assert.match(ui, /not live prices/);
  assert.match(ui, /not necessarily bearish/);
  assert.match(ui, /mention-volume weighting/);
});
test("future snapshot metadata and contradictory weighted percentages never look available", () => {
  assert.equal(
    moodSnapshot({ asOf: "2026-11-19", sectors: [] }, "sectors", now),
    null,
  );
  assert.equal(
    moodSnapshot({ generatedAt: now / 1000 + 60, series: [] }, "breadth", now),
    null,
  );
  const r = moodSnapshot(
    {
      series: [],
      latest: {
        date: "2026-11-17",
        coveredStocks: 10,
        bullishPct: 80,
        neutralPct: 40,
        bearishPct: 20,
      },
    },
    "breadth",
    now,
  );
  assert.equal(r.breadth.latest, null);
  assert.equal(r.partial, true);
});

test("breadth rejects contradictory stock percentages, preserves rounded and missing evidence", () => {
  const point = {
    date: "2026-11-17",
    coveredStocks: 10,
    bullish: 8,
    neutral: 1,
    bearish: 1,
    bullishPct: 10,
    neutralPct: 10,
    bearishPct: 80,
    netBreadth: -70,
  };
  const read = (p) => moodSnapshot({ latest: p, series: [p] }, "breadth", now);
  assert.equal(read(point).breadth.latest, null);
  assert.deepEqual(read(point).breadth.series, []);
  assert.equal(read(point).partial, true);
  assert.equal(
    read({ ...point, bullishPct: 80, bearishPct: 10, netBreadth: 70 }).breadth
      .latest.bullishPct,
    80,
  );
  assert.equal(
    read({ date: point.date, coveredStocks: 3, bullish: 1, bullishPct: 33.33 })
      .breadth.latest.bullishPct,
    33.33,
  );
  assert.equal(
    read({ date: point.date, coveredStocks: 0, bullishPct: 1 }).breadth.latest,
    null,
  );
  assert.equal(
    read({ date: point.date, coveredStocks: 0, bullishPct: 0 }).breadth.latest
      .bullishPct,
    0,
  );
  assert.equal(
    read({ date: point.date, coveredStocks: 10, bullish: 11 }).breadth.latest,
    null,
  );
  assert.equal(
    read({ date: point.date, coveredStocks: 10 }).breadth.latest.bullishPct,
    null,
  );
  assert.equal(
    read({ date: point.date, bullishPct: 10 }).breadth.latest.coveredStocks,
    null,
  );
});
test("explicit nonboolean preview metadata fails closed", () => {
  for (const isPreview of ["", "false", null, 0])
    assert.equal(
      moodSnapshot({ isPreview, data: { series: [] } }, "breadth", now),
      null,
    );
});
