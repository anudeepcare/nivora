import test from "node:test";
import assert from "node:assert/strict";
import {
  storyListView,
  storyDetailView,
  safeCitation,
} from "../lib/sentisense-stories-view.ts";
test("story dates distinguish publication from assembly; AI titles never become publisher headlines", () => {
  const rows = storyListView([
    {
      id: "s1",
      brokeAt: 1794873600,
      cluster: {
        title: "Provider generated title",
        clusteredAt: 1794960000,
        storySource: "AI",
        clusterSize: 5,
      },
      tickers: ["AAPL"],
    },
  ]);
  assert.equal(rows[0].id, "s1");
  assert.notEqual(rows[0].brokeAt, rows[0].assembledAt);
  assert.equal(rows[0].authorship, "AI-written story");
  assert.equal(rows[0].title, "Provider generated title");
});
test("unsafe/credential-bearing citations are excluded and escaped text is not executable", () => {
  for (const u of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://u:p@example.com/x",
  ])
    assert.equal(safeCitation(u), null);
  const d = storyDetailView({
    id: "s1",
    title: "<script>x</script>",
    narrativeBody:
      "Read [article](https://example.com) [doc1]. ![chart](https://example.com/x.png)",
    citationLinks: { doc1: "https://example.com/story", doc2: "javascript:x" },
    bullishView: "",
    bearishView: "",
  });
  assert.equal(d.citations.length, 1);
  assert.match(d.narrative, /article \[doc1\]/);
  assert.doesNotMatch(d.narrative, /!\[chart\]/);
  assert.equal(d.bullish, null);
  assert.equal(d.bearish, null);
});
test("timeline uses documented milliseconds and never substitutes retrieval time", () => {
  const d = storyDetailView({
    timeline: [
      {
        publishedAt: 1794873600000,
        updateType: "CORRECTION",
        content: "Corrected text",
      },
    ],
  });
  assert.match(d.timeline[0].date, /2026-/);
  assert.equal(d.timeline[0].type, "CORRECTION");
  assert.equal(storyDetailView({}).timeline.length, 0);
});
test("story models omit raw sentiment confidence and score fields", () => {
  const raw = {
    id: "s",
    title: "Title",
    averageSentiment: 0.9,
    momentumScore: 80,
    aiConfidence: 0.95,
  };
  assert.doesNotMatch(
    JSON.stringify(storyDetailView(raw)),
    /0.9|80|sentiment|confidence/,
  );
});
