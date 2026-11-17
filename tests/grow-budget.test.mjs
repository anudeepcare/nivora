import test from "node:test";
import assert from "node:assert/strict";
import { createCreditBudget } from "../lib/credit-budget.ts";
test("Grow weights share 55 credits, reset on minute boundaries and preserve foreground capacity", () => {
  const take = createCreditBudget();
  assert.equal(take(20, false, 1000), true);
  assert.equal(take(20, false, 1000), true);
  assert.equal(take(20, false, 1000), false);
  assert.equal(take(15, false, 1000), true);
  assert.equal(take(1, false, 1000), false);
  assert.equal(take(55, false, 60000), true);
  const bg = createCreditBudget();
  assert.equal(bg(42, true, 1000), true);
  assert.equal(bg(1, true, 1000), false);
  assert.equal(bg(13, false, 1000), true);
  assert.equal(bg(-1, false, 1000), false);
  assert.equal(bg(0.5, false, 1000), false);
});
