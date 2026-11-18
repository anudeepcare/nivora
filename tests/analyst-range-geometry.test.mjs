import test from "node:test";
import assert from "node:assert/strict";
import { analystRangePosition } from "../lib/analyst-range-geometry.ts";
test("analyst marker uses actual ordered finite endpoints, not synthetic symmetry", () => {
  assert.equal(analystRangePosition(100, 125, 200), 25);
  assert.equal(analystRangePosition(0, 0, 200), 0);
  assert.equal(analystRangePosition(100, 100, 100), 50);
  for (const values of [
    [100, 90, 200],
    [200, 250, 100],
    [null, 2, 3],
    [1, Infinity, 3],
    [-1, 2, 3],
    [1, "2", 3],
  ])
    assert.equal(analystRangePosition(...values), null);
});
