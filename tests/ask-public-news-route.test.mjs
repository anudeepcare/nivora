import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as ask from "../lib/ask-auryn.ts";
import * as intents from "../lib/ask-evidence.ts";
import * as news from "../lib/ask-public-news.ts";
import * as deadline from "../lib/ask-deadline.ts";
import * as search from "../lib/publication-search.ts";
import { readBoundedMarketJson } from "../lib/market-response.ts";
import {
  createProviderFetch,
  providerConfig,
} from "../lib/sentisense-provider-core.ts";
function load(file, bindings) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", "React", code)(
    (name) => {
      if (name in bindings) return bindings[name];
      throw Error("Missing " + name);
    },
    module,
    module.exports,
    React,
  );
  return module.exports;
}
class HttpError extends Error {
  constructor(m, status) {
    super(m);
    this.status = status;
  }
}
function harness(overrides = {}) {
  let calls = [],
    feature = "";
  const route = load("app/api/ask/[symbol]/route.ts", {
    "@/lib/ask-deadline": deadline,
    "@/lib/market-response": { readBoundedMarketJson },
    "@/lib/server": {
      HttpError,
      account: async () => ({
        user: { id: "u", email_confirmed_at: "yes" },
        db: {
          rpc: async () => {
            return { data: true, error: null };
          },
        },
      }),
      failure: (e) => ({ status: e.status || 503, error: e.message }),
      limit: async () => {},
      privateJson: (x) => x,
    },
    "@/lib/access-server": {
      requestAccess: async () => ({ sampleOnly: false }),
      requireFeature: (_, f) => {
        calls.push(["gate", f]);
        if (f === feature) throw new HttpError("denied", 403);
      },
      reserveAccess: async () => {},
    },
    "@/lib/providers": {
      research: async () => {
        calls.push(["research"]);
        return {};
      },
      researchSymbol: (s) => s,
    },
    "@/lib/report": { evidenceFor: () => [] },
    "@/lib/analyst-status": { analystStatus: () => ({ available: true }) },
    "@/lib/ai-provider-request": {
      aiProviderRequest:
        overrides.ai ??
        (async () => {
          throw Error("No model expected");
        }),
    },
    "@/lib/ask-auryn": ask,
    "@/lib/ask-evidence": {
      ...intents,
      askTopicEvidence: async (_s, topics) => {
        calls.push(["topics", topics]);
        return { evidence: [], limitations: [] };
      },
    },
    "@/lib/eodhd": { eodNews: async () => {} },
    "@/lib/sentisense-api": { sentisenseRead: async () => {} },
    "@/lib/ask-public-news": news,
    "@/lib/publication-search.server": {
      readPublicationSearch: async (q, options) => {
        calls.push(["search", q]);
        assert.ok(options.signal);
        if (overrides.search) return overrides.search(q, options);
        return {
          rows: [],
          preview: false,
          receivedAt: new Date().toISOString(),
        };
      },
    },
  });
  return {
    calls,
    deny: (f) => {
      feature = f;
    },
    run: (body) =>
      route.POST(
        new Request("https://example.test/api/ask/TEST", {
          method: "POST",
          body: JSON.stringify(body),
        }),
        { params: Promise.resolve({ symbol: "TEST" }) },
      ),
  };
}
test("route default never searches; opted-in search replaces news and never forwards private question", async () => {
  const h = harness();
  const question = "News and earnings; my private question";
  await h.run({ question });
  assert.equal(h.calls.filter((x) => x[0] === "search").length, 0);
  h.calls.length = 0;
  const out = await h.run({
    question,
    publicNewsSearch: { enabled: true, topic: "public earnings", days: 7 },
  });
  assert.deepEqual(h.calls.find((x) => x[0] === "search")?.[1], {
    query: "TEST public earnings",
    kind: "stories",
    days: 7,
  });
  assert.deepEqual(h.calls.find((x) => x[0] === "topics")[1], ["earnings"]);
  assert.equal(out.publicNewsSearch.status, "empty");
  assert.ok(
    !JSON.stringify(h.calls.filter((x) => x[0] === "search")).includes(
      question,
    ),
  );
});
test("news gate and invalid consent fail before research and search", async () => {
  const h = harness();
  h.deny("news");
  const out = await h.run({
    question: "Explain growth",
    publicNewsSearch: { enabled: true, topic: "earnings", days: 7 },
  });
  assert.equal(out.status, 403);
  assert.ok(!h.calls.some((x) => ["research", "search"].includes(x[0])));
  h.deny("");
  const bad = await h.run({
    question: "Explain growth",
    publicNewsSearch: {
      enabled: true,
      topic: "earnings",
      days: 7,
      portfolio: ["private"],
    },
  });
  assert.equal(bad.status, 400);
  assert.ok(!h.calls.some((x) => x[0] === "search"));
});
test("Ask renders explicit unchecked public search opt-in, no prefilled topic", () => {
  const View = load("components/AskAurynQuestion.tsx", {
    react: React,
    "@/lib/client": { api: async () => {} },
    "./Session": { useProduct: () => ({ demo: false }) },
    "./AskAurynQuestion.module.css": { default: {} },
  }).default;
  const html = renderToStaticMarkup(
    React.createElement(View, { symbol: "TEST" }),
  );
  assert.match(html, /Search SentiSense/);
  assert.match(html, /type="checkbox"/);
  assert.doesNotMatch(html, /checked=""/);
  assert.doesNotMatch(html, /name="public-topic"/);
});

test("Ask route through actual guarded search projects exact ticker evidence into bounded synthesis", async () => {
  let wire = [],
    permits = 0,
    modelCalls = 0;
  const guarded = createProviderFetch({
    config: () => providerConfig({}),
    reserve: async () => {
      permits++;
      return { allowed: true, retryAfterSeconds: 60 };
    },
    cooldown: async () => {},
  });
  const read = load("lib/publication-search.server.ts", {
    "server-only": {},
    "./sentisense-provider.server": { sentisenseFetch: guarded },
    "./server": { HttpError, limit: async () => {} },
    "./market-response": { readBoundedMarketJson },
    "./publication-search": search,
  }).readPublicationSearch;
  const h = harness({
    search: (q, options) =>
      read(q, {
        ...options,
        key: "fixture-key",
        fetcher: async (url, init) => {
          wire.push(String(url));
          assert.ok(init.signal);
          return Response.json([
            {
              id: "news",
              cluster: {
                title: "A product launch was announced",
                storySource: "ORIGINAL",
                clusteredAt: Math.floor(Date.now() / 1000),
              },
              tickers: ["TEST"],
              brokeAt: Math.floor(Date.now() / 1000) - 60,
            },
          ]);
        },
      }),
    ai: async (_f, _key, _model, payload) => {
      modelCalls++;
      const input = JSON.parse(payload.input);
      assert.ok(
        JSON.stringify(input).includes("A product launch was announced"),
      );
      const value =
        modelCalls === 1
          ? {
              answer: [
                {
                  text: "The editorial story describes a product launch.",
                  evidenceIds: ["T-publicNews-1"],
                },
              ],
              interpretation: [],
              factIds: ["T-publicNews-1"],
              missing: ["causal_evidence"],
            }
          : { safe: true, claims: [{ index: 0, supported: true }] };
      return {
        response: Response.json({
          status: "completed",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: JSON.stringify(value) }],
            },
          ],
        }),
      };
    },
  });
  const out = await h.run({
    question: "Explain the public launch evidence",
    publicNewsSearch: { enabled: true, topic: "product launch", days: 14 },
  });
  assert.equal(out.publicNewsSearch?.status, "available", JSON.stringify(out));
  assert.equal(
    out.sources[0].label,
    "Editorial story title · public-topic search",
  );
  assert.equal(out.facts[0].value, null);
  assert.equal(modelCalls, 2);
  assert.equal(permits, 1);
  assert.equal(wire.length, 1);
  const url = new URL(wire[0]);
  assert.equal(url.pathname, "/api/v1/documents/stories/search");
  assert.deepEqual(
    [...url.searchParams],
    [
      ["query", "TEST product launch"],
      ["days", "14"],
      ["limit", "20"],
    ],
  );
  assert.ok(!wire[0].includes("Explain"));
});
test("opt-in topic starts empty, is never copied from question and resets on company change", async () => {
  const state = [];
  let index = 0,
    sent;
  const hooks = {
    ...React,
    useState: (initial) => {
      const i = index++;
      if (!(i in state)) state[i] = initial;
      return [
        state[i],
        (value) => {
          state[i] = typeof value === "function" ? value(state[i]) : value;
        },
      ];
    },
  };
  const View = load("components/AskAurynQuestion.tsx", {
    react: hooks,
    "@/lib/client": {
      api: async (path, body) => {
        sent = { path, body };
        return {
          claims: [],
          sources: [],
          facts: [],
          limitations: [],
          generatedAt: new Date().toISOString(),
        };
      },
    },
    "./Session": { useProduct: () => ({ demo: false }) },
    "./AskAurynQuestion.module.css": { default: {} },
  }).default;
  const render = (symbol) => {
    index = 0;
    return View({ symbol });
  };
  const find = (node, predicate) => {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    for (const c of React.Children.toArray(node.props?.children)) {
      const n = find(c, predicate);
      if (n) return n;
    }
    return null;
  };
  let tree = render("TEST");
  find(tree, (n) => n.type === "textarea").props.onChange({
    target: { value: "My private question about growth" },
  });
  tree = render("TEST");
  find(tree, (n) => n.props?.type === "checkbox").props.onChange({
    target: { checked: true },
  });
  tree = render("TEST");
  assert.equal(
    find(tree, (n) => n.props?.name === "public-topic").props.value,
    "",
  );
  find(tree, (n) => n.props?.name === "public-topic").props.onChange({
    target: { value: "earnings" },
  });
  tree = render("TEST");
  await find(tree, (n) => n.type === "form").props.onSubmit({
    preventDefault() {},
  });
  assert.deepEqual(sent.body.publicNewsSearch, {
    enabled: true,
    topic: "earnings",
    days: 7,
  });
  tree = render("OTHER");
  assert.equal(
    find(tree, (n) => n.props?.type === "checkbox").props.checked,
    false,
  );
  assert.equal(
    find(tree, (n) => n.props?.name === "public-topic"),
    null,
  );
});
