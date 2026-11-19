import test from "node:test";
import assert from "node:assert/strict";
import { cashFlowValuation } from "../lib/auryn-decision.ts";
test("reported contraction lowers cash-flow scenarios instead of becoming flat growth", () => {
  const flat = cashFlowValuation({ cashPerShare: 10, growth: 0, dilution: 0 });
  const declining = cashFlowValuation({
    cashPerShare: 10,
    growth: -15,
    dilution: 0,
  });
  assert.ok(flat && declining);
  assert.equal(declining.growth, -15);
  for (const key of ["bear", "base", "bull"])
    assert.ok(declining[key] < flat[key], key);
  assert.ok(
    declining.bear <= declining.base && declining.base <= declining.bull,
  );
});
test("impossible cash-flow growth is rejected rather than rewritten as zero", () => {
  for (const growth of [-100, -120])
    assert.equal(
      cashFlowValuation({ cashPerShare: 10, growth, dilution: 0 }),
      null,
    );
});
