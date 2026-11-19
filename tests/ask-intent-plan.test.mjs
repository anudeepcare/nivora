import {
  publicNewsRequest,
  publicNewsEvidence,
} from "../lib/ask-public-news.ts";
import test from "node:test";
import assert from "node:assert/strict";
import * as ask from "../lib/ask-evidence.ts";
test("explicit requested order and focus beat dictionary order; exclusions and earnings calls are respected", () => {
  assert.deepEqual(ask.selectedAskTopics("Options, earnings and news"), [
    "options",
    "earnings",
    "news",
  ]);
  assert.deepEqual(
    ask.selectedAskTopics("News and earnings; focus on options"),
    ["options", "news", "earnings"],
  );
  assert.deepEqual(
    ask.selectedAskTopics("Explain the earnings call, not options or news"),
    ["earnings"],
  );
  assert.deepEqual(ask.selectedAskTopics("Analyst upgrades and downgrades"), [
    "analystChanges",
  ]);
  assert.deepEqual(
    ask.selectedAskTopics("Analyst upgrades and consensus targets"),
    ["analystChanges", "analysts"],
  );
});
test("repeated focus, narrow negation and lowercase explicit subjects are handled", () => {
  assert.deepEqual(
    ask.askEvidencePlan("News, earnings and options; focus on options", "TEST")
      .topics,
    ["options", "news"],
  );
  assert.deepEqual(ask.selectedAskTopics("No news, focus on options"), [
    "options",
  ]);
  assert.deepEqual(ask.selectedAskTopics("Not only news but also earnings"), [
    "news",
    "earnings",
  ]);
  assert.deepEqual(
    ask.selectedAskTopics("earnings were not good and analyst downgrades"),
    ["earnings", "analystChanges"],
  );
  assert.deepEqual(ask.selectedAskTopics("Skip news and options; earnings"), [
    "earnings",
  ]);
  assert.ok(ask.askEvidencePlan("News for $aapl", "TEST").error);
  assert.equal(ask.askEvidencePlan("News for $test", "TEST").error, null);
});
test("focus supports complete analyst phrases and named topic lists", () => {
  assert.deepEqual(
    ask.askEvidencePlan(
      "News earnings options; focus on analyst upgrades",
      "TEST",
    ).topics,
    ["analystChanges", "news"],
  );
  assert.deepEqual(
    ask.askEvidencePlan(
      "News earnings options; focus on analysts downgrades",
      "TEST",
    ).topics,
    ["analystChanges", "news"],
  );
  assert.deepEqual(
    ask.askEvidencePlan(
      "News earnings options; focus on options and earnings",
      "TEST",
    ).topics,
    ["options", "earnings"],
  );
});
test("typed plan keeps selected subject explicit and blocks unsupported or ambiguous subject without guessing", () => {
  assert.equal(typeof ask.askEvidencePlan, "function");
  const plan = ask.askEvidencePlan("Options, earnings and news", "TEST");
  assert.deepEqual(plan.topics, ["options", "earnings"]);
  assert.deepEqual(plan.omitted, ["news"]);
  assert.equal(plan.error, null);
  for (const [q, s] of [
    ["news", ""],
    ["Compare $TEST and $OTHER news", "TEST"],
    ["News for $OTHER", "TEST"],
    ["Analyze my portfolio holdings", "TEST"],
    ["News across all stocks", "TEST"],
  ])
    assert.ok(ask.askEvidencePlan(q, s).error);
  assert.equal(
    ask.askEvidencePlan("How is this company changing?", "TEST").error,
    null,
  );
  assert.deepEqual(
    ask.askEvidencePlan("How is this company changing?", "TEST").topics,
    [],
  );
});
test("analyst-change evidence uses dated published firm actions, not consensus or invented target units", async () => {
  const now = "2026-11-18T12:00:00Z",
    calls = [];
  const result = (dataset, data, patch = {}) => ({
    dataset,
    data,
    symbol: "TEST",
    status: "available",
    isPreview: false,
    retrievedAt: now,
    asOf: null,
    ...patch,
  });
  const run = (patch = {}) =>
    ask.askTopicEvidence("TEST", ["analystChanges"], {
      now: () => now,
      news: async () => {
        throw Error("not requested");
      },
      read: async (s, d) => {
        calls.push(d);
        return d === "profile"
          ? result(d, { kind: "STOCK" })
          : result(
              d,
              [
                {
                  firm: "Example Research",
                  actionDate: "2026-11-17",
                  actionType: "UPGRADE",
                  fromGrade: "Hold",
                  toGrade: "Buy",
                  priceTarget: 999,
                  secret: "DO_NOT_FORWARD",
                },
                {
                  firm: "Future",
                  actionDate: "2026-11-19",
                  actionType: "DOWNGRADE",
                },
                {
                  ticker: "OTHER",
                  firm: "Wrong",
                  actionDate: "2026-11-17",
                  actionType: "UPGRADE",
                },
              ],
              patch,
            );
      },
    });
  const out = await run();
  assert.deepEqual(calls, ["profile", "analystActions"]);
  assert.equal(out.evidence.length, 1);
  assert.equal(out.evidence[0].value, null);
  assert.equal(out.evidence[0].period, "2026-11-17");
  assert.match(out.evidence[0].passage, /Example Research.*UPGRADE.*Hold.*Buy/);
  assert.match(out.evidence[0].url, /analyst-ratings/);
  assert.doesNotMatch(
    JSON.stringify(out.evidence),
    /999|DO_NOT_FORWARD|Future|Wrong/,
  );
  assert.equal(
    (await run({ isPreview: true, status: "preview" })).evidence.length,
    0,
  );
});
import fs from "node:fs";
import ts from "typescript";
import {
  stockQuestion,
  askSchema,
  validateAnswer,
  readAskBody,
  synthesisSchema,
  synthesisReviewSchema,
  validateSynthesis,
  validateSynthesisReview,
} from "../lib/ask-auryn.ts";
import { createAskDeadline, askModelTimeout } from "../lib/ask-deadline.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
function load(file, bindings, name) {
  const source = fs.readFileSync(file, "utf8"),
    ast = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) =>
        n
          .getText(ast)
          .replace(/^export default /, "")
          .replace(/^export /, ""),
      )
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), js + ";return " + name)(
    ...Object.values(bindings),
  );
}
test("actual Ask route enforces selected topics before acquisition and carries dated action citations into escaped UI", async () => {
  const now = new Date().toISOString(),
    calls = [],
    features = [],
    modelInputs = [];
  let researchCalls = 0,
    deny = false,
    reviewSafe = true,
    malicious = false,
    hangResearch = false;
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const result = (dataset, data) => ({
    symbol: "TEST",
    dataset,
    data,
    status: "available",
    isPreview: false,
    retrievedAt: now,
    asOf: now.slice(0, 10),
  });
  const POST = load(
    "app/api/ask/[symbol]/route.ts",
    {
      account: async () => ({
        user: { id: "test-user", email_confirmed_at: now },
        db: { rpc: async () => ({ data: true }) },
      }),
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status || 500 }),
      HttpError,
      limit: async () => {},
      privateJson: Response.json,
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: (_, f) => {
        features.push(f);
        if (deny && f === "analysts") throw new HttpError("locked", 403);
      },
      reserveAccess: async () => {},
      researchSymbol: (s) => s,
      research: async () => {
        researchCalls++;
        if (hangResearch) return new Promise(() => {});
        return {};
      },
      evidenceFor: () => [],
      analystStatus: () => ({ available: true }),
      createAskDeadline: (signal) =>
        createAskDeadline(signal, hangResearch ? 10 : 55000),
      askModelTimeout,
      readAskBody,
      readBoundedMarketJson,
      synthesisSchema,
      synthesisReviewSchema,
      validateSynthesis,
      validateSynthesisReview,
      stockQuestion,
      askSchema,
      validateAnswer,
      ...ask,
      publicNewsRequest,
      publicNewsEvidence,
      readPublicationSearch: async () => {
        throw Error("No public search consent");
      },
      sentisenseRead: async (s, d) => {
        calls.push([s, d]);
        return result(
          d,
          d === "profile"
            ? { kind: "STOCK" }
            : d === "analystActions"
              ? [
                  {
                    firm: "<script>untrusted</script>",
                    actionDate: now.slice(0, 10),
                    actionType: "UPGRADE",
                    fromGrade: "Hold",
                    toGrade: "Buy",
                    priceTarget: 987,
                  },
                ]
              : { latest: { callVol: 0 } },
        );
      },
      eodNews: async () => {
        throw Error("news omitted");
      },
      process: {
        env: { OPENAI_API_KEY: "synthetic", OPENAI_MODEL: "fixture" },
      },
      aiProviderRequest: async (_fetch, _key, _model, body) => {
        const input = JSON.parse(body.input);
        modelInputs.push(input);
        const fact = input.observations.find((e) =>
          e.id.startsWith("T-analystChanges-"),
        );
        return {
          response: Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(
                      input.claims
                        ? {
                            safe: reviewSafe,
                            claims: input.claims.map((_, index) => ({
                              index,
                              supported: reviewSafe,
                            })),
                          }
                        : {
                            answer: [
                              {
                                text: malicious
                                  ? "The chief executive has resigned."
                                  : "A published analyst action is available, but it does not establish a change in company performance.",
                                evidenceIds: [fact.id],
                              },
                            ],
                            interpretation: [],
                            missing: ["causal_evidence"],
                            factIds: [fact.id],
                          },
                    ),
                  },
                ],
              },
            ],
          }),
        };
      },
    },
    "POST",
  );
  const req = (q) =>
      new Request("https://example.test/api/ask/TEST", {
        method: "POST",
        body: JSON.stringify({
          question: q,
        }),
      }),
    context = { params: Promise.resolve({ symbol: "TEST" }) };
  const oversized = new Request("https://example.test/api/ask/TEST", {
    method: "POST",
    body: new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(8193));
      },
    }),
    duplex: "half",
  });
  assert.equal((await POST(oversized, context)).status, 400);
  assert.equal(
    (
      await POST(
        new Request("https://example.test/api/ask/TEST", {
          method: "POST",
          body: JSON.stringify({
            question: "Analyst upgrades",
            portfolio: { private: "SHOULD_NOT_LEAVE" },
          }),
        }),
        context,
      )
    ).status,
    400,
  );
  assert.equal(researchCalls, 0);
  assert.equal(calls.length, 0);
  assert.equal((await POST(req("News for $OTHER"), context)).status, 400);
  assert.equal(researchCalls, 0);
  assert.equal(calls.length, 0);
  deny = true;
  assert.equal((await POST(req("Analyst upgrades"), context)).status, 403);
  assert.equal(calls.length, 0);
  deny = false;
  const response = await POST(
    req("Analyst upgrades then options and news"),
    context,
  );
  assert.equal(response.status, 200);
  const answer = await response.json();
  assert.deepEqual(calls, [
    ["TEST", "profile"],
    ["TEST", "analystActions"],
    ["TEST", "options"],
  ]);
  assert.ok(features.includes("analysts") && features.includes("options"));
  assert.equal(modelInputs.length, 2);
  assert.match(
    answer.limitations.join(" "),
    /Not retrieved in this answer: news/,
  );
  assert.doesNotMatch(JSON.stringify(modelInputs), /SHOULD_NOT_LEAVE|987/);
  assert.match(answer.facts[0].url, /analyst-ratings/);
  assert.equal(answer.facts[0].period, now.slice(0, 10));
  reviewSafe = false;
  malicious = true;
  const rejected = await POST(
    req("Did the chief executive resign? Analyst upgrades"),
    context,
  );
  assert.equal(rejected.status, 503);
  assert.doesNotMatch(
    JSON.stringify(await rejected.json()),
    /chief executive has resigned/,
  );
  assert.doesNotMatch(JSON.stringify(modelInputs), /SHOULD_NOT_LEAVE/);
  hangResearch = true;
  const modelCount = modelInputs.length;
  const timed = await POST(req("What are the earnings?"), context);
  assert.equal(timed.status, 503);
  assert.match(
    JSON.stringify(await timed.json()),
    /exceeded the available time/,
  );
  assert.equal(modelInputs.length, modelCount);
  hangResearch = false;
  const React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  let cursor = 0;
  const states = ["question", false, answer, ""];
  const UI = load(
    "components/AskAurynQuestion.tsx",
    {
      React,
      useState: (initial) => [
        cursor < states.length ? states[cursor++] : initial,
        () => {},
      ],
      useProduct: () => ({ demo: false }),
      api: async () => {},
      styles: new Proxy({}, { get: (_, k) => String(k) }),
    },
    "AskAurynQuestion",
  );
  const html = renderToStaticMarkup(
    React.createElement(UI, { symbol: "TEST" }),
  );
  assert.match(html, /&lt;script&gt;untrusted&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|987/);
  assert.match(html, /Published analyst action/);
});

test("story evidence preserves editorial provenance and never substitutes assembly for event time", async () => {
  const now = "2026-11-18T12:00:00Z";
  const evidence = await ask.askTopicEvidence("TEST", ["news"], {
    now: () => now,
    news: async () => ({ status: "unavailable", articles: [] }),
    read: async (_, dataset) => ({
      dataset,
      symbol: "TEST",
      status: "available",
      isPreview: false,
      retrievedAt: now,
      asOf: null,
      data:
        dataset === "profile"
          ? { kind: "STOCK" }
          : [
              {
                tickers: ["TEST"],
                brokeAt: null,
                cluster: {
                  title: "Undated editorial",
                  clusteredAt: Date.parse(now) / 1000,
                },
              },
              {
                tickers: ["TEST"],
                brokeAt: Date.parse("2026-11-17T12:00:00Z") / 1000,
                cluster: {
                  title: "Dated editorial",
                  clusteredAt: Date.parse(now) / 1000,
                },
              },
            ],
    }),
  });
  assert.equal(evidence.evidence.length, 1);
  assert.equal(evidence.evidence[0].period, "2026-11-17");
  assert.match(evidence.evidence[0].label, /Provider-generated/);
  assert.match(evidence.evidence[0].url, /docs\/api\/documents/);
  assert.match(evidence.limitations.join(" "), /assembly time is not/);
});
