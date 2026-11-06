import test from "node:test";
import assert from "node:assert/strict";
import { demoData } from "./fixtures/demo.ts";
import {
  loadComparison,
  comparisonCompatibility,
  verifiedResearch,
} from "../lib/comparison.ts";
test("one failed symbol preserves successful comparison peers and names the failed selection", async () => {
  const result = await loadComparison(["MSFT", "APPL", "AAPL"], async (s) => {
    if (s === "APPL") throw Error("Provider unavailable");
    return demoData.research[s];
  });
  assert.deepEqual(
    result.rows.map((r) => r.company.symbol),
    ["MSFT", "AAPL"],
  );
  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0], /APPL/);
});
test("a blank provider placeholder is not a verified comparison company", async () => {
  const blank = {
    ...demoData.research.MSFT,
    company: {
      symbol: "APPL",
      name: "APPL",
      exchange: "",
      currency: "USD",
      assetType: "stock",
    },
    quote: { price: null },
    facts: [],
    history: [],
    filings: [],
    evidence: undefined,
    coverage: undefined,
  };
  const result = await loadComparison(["APPL"], async () => blank);
  assert.equal(result.rows.length, 0);
  assert.match(result.issues[0], /confirm/i);
});
test("a provider cannot substitute a different company into the comparison", async () => {
  const result = await loadComparison(
    ["MSFT"],
    async () => demoData.research.AAPL,
  );
  assert.equal(result.rows.length, 0);
});
test("comparison warns when periods and currencies differ without converting or ranking values", () => {
  const messages = comparisonCompatibility([
    { currency: "USD", end: "2026-06-30", basis: "TTM" },
    { currency: "EUR", end: "2025-12-31", basis: "Annual" },
  ]);
  assert.equal(messages.length, 3);
});

test("supported US suffixes and class aliases verify without accepting a foreign listing", async () => {
  const requests = [];
  const rows = await loadComparison(["AAPL.US", "MSFT"], async (s) => {
    requests.push(s);
    return demoData.research[s.replace(/\.US$/, "")];
  });
  assert.deepEqual(requests, ["AAPL", "MSFT"]);
  assert.equal(rows.rows.length, 2);
  assert.deepEqual(rows.issues, []);
  assert.equal(verifiedResearch(demoData.research.AAPL, "NASDAQ:AAPL"), true);
  assert.equal(verifiedResearch(demoData.research.AAPL, "AAPL.L"), false);
  assert.equal(
    verifiedResearch(
      {
        ...demoData.research.MSFT,
        company: { ...demoData.research.MSFT.company, symbol: "BRK-B" },
      },
      "BRK.B.US",
    ),
    true,
  );
});
