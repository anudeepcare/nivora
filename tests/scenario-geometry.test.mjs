import test from "node:test";
import assert from "node:assert/strict";
import { scenarioGeometry } from "../lib/scenario-geometry.ts";

test("sensitivity endpoints share a bounded vertical price scale", () => {
  const scale = { min: 0, max: 200 };
  const low = scenarioGeometry(50, 100, scale);
  const mid = scenarioGeometry(100, 100, scale);
  const high = scenarioGeometry(150, 100, scale);
  assert.equal(low.referenceY, high.referenceY);
  assert.ok(low.targetY > mid.targetY && mid.targetY > high.targetY);
  assert.equal(mid.referenceY, mid.targetY);
  for (const value of [-1e12, 0, 200, 1e12]) {
    const graph = scenarioGeometry(value, 100, scale);
    assert.ok(graph.targetY >= 16 && graph.targetY <= 100);
  }
});

test("diagram area encodes only reference and true target, with no invented observations", () => {
  const graph = scenarioGeometry(150, 100, { min: 0, max: 200 });
  assert.equal(
    graph.area,
    `18,${graph.referenceY} 282,${graph.targetY} 282,${graph.referenceY}`,
  );
  assert.equal(scenarioGeometry(NaN, 100, { min: 0, max: 200 }), null);
  assert.equal(scenarioGeometry(100, 100, { min: 100, max: 100 }), null);
});
