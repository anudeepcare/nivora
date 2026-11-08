import test from "node:test";
import assert from "node:assert/strict";
import { crystalFacets } from "../lib/evidence-crystal.ts";
test("crystal distinguishes missing evidence from a measured zero and clamps invalid scores", () => {
  const f = crystalFacets([null, 0, 10, -1, 15, NaN, 5, 7.5]);
  assert.equal(f.length, 8);
  assert.equal(f[0].measured, false);
  assert.equal(f[1].measured, true);
  assert.equal(f[1].score, 0);
  assert.equal(f[3].score, 0);
  assert.equal(f[4].score, 10);
  assert.equal(f[5].measured, false);
  assert.ok(f.every((x) => x.points.every((p) => p.every(Number.isFinite))));
  assert.ok(f[2].radius > f[1].radius);
});
test("empty evidence remains eight frosted facets, never a fabricated score", () => {
  assert.ok(crystalFacets([]).every((x) => !x.measured && x.score === null));
});
