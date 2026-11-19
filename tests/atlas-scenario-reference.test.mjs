import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { referenceAtlas } from "../lib/reference-atlas.ts";
import { scenarioHeadline } from "../lib/scenario-headline.ts";
import { universe } from "./helpers/market-universe.mjs";

const examples = universe(8);
const pick = (kind) => examples.find((m) => m.kind === kind).research;
const historic = {
  ...pick("large-cap"),
  facts: [],
  filings: [],
  evidence: undefined,
  snapshot: undefined,
};

test("Atlas displays the exact Scenarios historical fallback with the model left unavailable", () => {
  const model = referenceAtlas(historic);
  const range = scenarioHeadline(historic);
  assert.equal(range.source, "history");
  assert.deepEqual(model.cases, []);
  assert.equal(model.referenceRange.source, "history");
  assert.match(model.referenceRange.title, /one.year/i);
  assert.ok(Number.isFinite(Date.parse(model.referenceRange.asOf)));
  assert.deepEqual(model.referenceRange.values, [
    range.bear,
    range.base,
    range.bull,
  ]);
  assert.match(model.referenceRange.note, /not a valuation/i);
});

test("a published target range remains separate from modeled scenarios", () => {
  const src = pick("analyst-full");
  const r = {
    ...src,
    facts: [],
    filings: [],
    snapshot: undefined,
    evidence: {
      updatedAt: src.evidence.updatedAt,
      consensus: src.evidence.consensus,
    },
  };
  const model = referenceAtlas(r);
  assert.deepEqual(model.cases, []);
  assert.equal(model.referenceRange.source, "analyst");
  assert.deepEqual(model.referenceRange.labels, [
    "Low target",
    "Consensus",
    "High target",
  ]);
  assert.match(model.referenceRange.note, /not AURYN fair value/i);
  assert.equal(
    referenceAtlas({ ...r, company: { ...r.company, foreignListing: true } })
      .referenceRange,
    null,
  );
});

test("no model and no valid reference range still render explicit missingness", () => {
  const r = {
    ...historic,
    history: [],
    quote: { ...historic.quote, price: null },
  };
  assert.equal(referenceAtlas(r).referenceRange, null);
  const rendered = readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.match(rendered, /referenceRange\.values\.map/);
  assert.match(rendered, /referenceRange\.note/);
  assert.match(rendered, /Not available/);
});

test("Atlas maps every range through one styled card grid with source-specific captions", () => {
  const rendered = readFileSync("components/ReferenceAtlas.tsx", "utf8");
  assert.equal((rendered.match(/className=\{s\.caseGrid\}/g) ?? []).length, 1);
  assert.match(rendered, /rangeCards\.map/);
  assert.match(rendered, /data-tone=\{card\.tone\}/);
  assert.match(rendered, /<small>\{card\.caption\}<\/small>/);
  assert.match(rendered, /Lower bound.*Historical base.*Upper bound/s);
  assert.match(rendered, /Published target/);
  assert.match(rendered, /annualized/);
});
