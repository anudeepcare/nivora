import test from "node:test";
import assert from "node:assert/strict";
import { demoData } from "./fixtures/demo.ts";
import {
  opportunityMap,
  opportunityRow,
  matchesOpportunity,
  emptyOpportunityFilters,
} from "../lib/opportunity-map.ts";

test("map denominator is explicit unique selected universe; unrelated research cannot inflate coverage", () => {
  const map = opportunityMap(
    [demoData.research.AAPL, demoData.research.MSFT],
    ["AAPL", "AAPL.US", "MISSING"],
    Date.parse(demoData.research.AAPL.retrievedAt),
  );
  assert.equal(map.requested, 2);
  assert.equal(map.covered, 1);
  assert.deepEqual(
    map.rows.map((r) => r.symbol),
    ["AAPL"],
  );
  assert.equal(
    map.sectors.reduce((sum, s) => sum + s.total, 0),
    1,
  );
  assert.equal(map.oldest, demoData.research.AAPL.retrievedAt);
});
test("missing metadata is unclassified rather than an inferred sector or investment theme", () => {
  const source = demoData.research.AAPL;
  const row = opportunityRow(
    {
      ...source,
      company: { ...source.company, sector: undefined },
      evidence: undefined,
    },
    Date.parse(source.retrievedAt),
  );
  assert.equal(row.sector, "Sector unavailable");
});
test("positive evidence filters exclude missing, nonfinite, zero and negative values", () => {
  const source = opportunityRow(demoData.research.AAPL);
  for (const [quality, field] of [
    ["cash", "cash"],
    ["growth", "growth"],
    ["profit", "profit"],
  ]) {
    for (const value of [null, NaN, Infinity, 0, -1])
      assert.equal(
        matchesOpportunity(
          { ...source, [field]: value },
          { ...emptyOpportunityFilters, quality },
        ),
        false,
      );
    assert.equal(
      matchesOpportunity(
        { ...source, [field]: 1 },
        { ...emptyOpportunityFilters, quality },
      ),
      true,
    );
  }
});
test("sector, exact Pace and business evidence compose; reset includes missing evidence", () => {
  const row = {
    sector: "Technology",
    pace: "P3",
    cash: 10,
    growth: null,
    profit: null,
  };
  assert.equal(
    matchesOpportunity(row, {
      sector: "Technology",
      pace: "P3",
      quality: "cash",
    }),
    true,
  );
  assert.equal(
    matchesOpportunity(row, { sector: "Energy", pace: "P3", quality: "cash" }),
    false,
  );
  assert.equal(
    matchesOpportunity(row, {
      sector: "Technology",
      pace: "P2",
      quality: "cash",
    }),
    false,
  );
  assert.equal(
    matchesOpportunity(
      { ...row, pace: "unavailable", cash: null },
      emptyOpportunityFilters,
    ),
    true,
  );
});
test("empty map preserves selected denominator and has no fabricated date", () => {
  const map = opportunityMap([], ["AAPL", "MSFT"]);
  assert.equal(map.covered, 0);
  assert.equal(map.requested, 2);
  assert.equal(map.oldest, undefined);
  assert.deepEqual(map.sectors, []);
});

test("known price zones survive business gates, including watch and pause zones", async () => {
  const { workspaceGuidance } = await import("../lib/edge-research.ts");
  for (const research of Object.values(demoData.research)) {
    const now = Date.parse(research.retrievedAt);
    const view = workspaceGuidance(research, false, now).view;
    const row = opportunityRow(research, now);
    assert.equal(
      row.pace,
      view.rawLevel == null ? "unavailable" : `P${view.rawLevel}`,
    );
    assert.equal(row.permitted, view.permitted);
    assert.equal(
      row.businessReview,
      view.rawLevel != null && view.rawLevel >= 2 && !view.permitted,
    );
  }
});
test('share-class aliases count as one requested company',()=>{const map=opportunityMap([],['BRK.B','BRK-B']);assert.equal(map.requested,1);});
