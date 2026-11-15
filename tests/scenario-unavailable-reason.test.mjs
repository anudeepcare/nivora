import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stockPillars } from "../lib/stock-pillars.ts";
import { aurynDecision } from "../lib/auryn-decision.ts";
import { researchOutlook } from "../lib/outlook.ts";
import { universe } from "./helpers/market-universe.mjs";

const missing = () => ({
  ...universe(1)[0].research,
  facts: [],
  evidence: undefined,
  history: [],
});
const decide = (r) => aurynDecision(r, { now: Date.parse(r.retrievedAt) });
test("missing scenario cells carry the actual forecast rejection instead of a generic placeholder", () => {
  const r = missing();
  const view = stockPillars(r, decide(r));
  assert.equal(view.cases, null);
  assert.ok(view.casesUnavailableReason?.includes(researchOutlook(r).reason));
});
test("available ranges do not carry an unavailable explanation", () => {
  for (const { research } of universe(4)) {
    const view = stockPillars(research, decide(research));
    if (view?.cases) assert.equal(view.casesUnavailableReason, null);
  }
});
test("shared overview and valuation cells render their specific missing-evidence explanation", () => {
  const source = readFileSync(
    new URL("../components/StockPillars.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /view\.casesUnavailableReason/);
  assert.doesNotMatch(
    source,
    /More company evidence is needed for a supported scenario range/,
  );
});

test("short-history stock keeps supplied targets, and partial consensus explains absent bounds", () => {
  const r = missing();
  r.retrievedAt = r.priceObservedAt = "2026-11-12T01:00:00Z";
  r.quote = {
    ...r.quote,
    price: 21,
    asOf: "2026-11-11T23:00:00Z",
    stale: false,
  };
  r.evidence = {
    updatedAt: "2026-11-11",
    estimates: [],
    consensus: { low: 23, target: 56.69, high: 139 },
  };
  const d = decide(r);
  const complete = stockPillars(r, d);
  assert.deepEqual(
    [complete.cases.bear, complete.cases.base, complete.cases.bull],
    [23, 56.69, 139],
  );
  assert.equal(complete.casesUnavailableReason, null);
  r.evidence.consensus = { target: 56.69 };
  const partial = stockPillars(r, decide(r));
  assert.equal(partial.cases, null);
  assert.match(
    partial.casesUnavailableReason,
    /consensus is available separately.*complete low-to-high target range was not supplied/,
  );
});

test("supplied inconsistent analyst bounds are described as invalid rather than missing", () => {
  const r = missing();
  r.retrievedAt = r.priceObservedAt = "2026-11-12T01:00:00Z";
  r.quote = {
    ...r.quote,
    price: 21,
    asOf: "2026-11-11T23:00:00Z",
    stale: false,
  };
  r.evidence = {
    updatedAt: "2026-11-11",
    estimates: [],
    consensus: { low: 80, target: 56.69, high: 139 },
  };
  const view = stockPillars(r, decide(r));
  assert.equal(view.cases, null);
  assert.match(
    view.casesUnavailableReason,
    /supplied low\/high bounds are inconsistent/,
  );
  assert.doesNotMatch(view.casesUnavailableReason, /not supplied/);
});
