import test from "node:test";
import assert from "node:assert/strict";
import { portfolioPaceFilter } from "../lib/portfolio-pace-filter.ts";
const input = {
  filter: "3",
  eligible: true,
  level: undefined,
  hasSignal: false,
};
test("Pace filter retains not-checked, pending and failed holdings", () => {
  assert.equal(portfolioPaceFilter(input), true);
});
test("only actual known nonmatching signals are filtered out", () => {
  assert.equal(
    portfolioPaceFilter({ ...input, hasSignal: true, level: 3 }),
    true,
  );
  assert.equal(
    portfolioPaceFilter({ ...input, hasSignal: true, level: 2 }),
    false,
  );
  assert.equal(
    portfolioPaceFilter({ ...input, hasSignal: true, level: null }),
    false,
  );
});
test("cash and unsupported assets do not pretend to qualify for a Pace level", () => {
  assert.equal(portfolioPaceFilter({ ...input, eligible: false }), false);
  assert.equal(
    portfolioPaceFilter({ ...input, eligible: false, filter: "all" }),
    true,
  );
});
