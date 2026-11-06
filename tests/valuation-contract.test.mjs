import test from "node:test";
import assert from "node:assert/strict";
import {
  validateValuationOutput,
} from "../lib/valuation-contract.ts";

const valid = () => ({
  symbol: "AAPL",
  asOf: "2026-10-28",
  status: "ok",
  family: "profitable-growth",
  routeRule: 13,
  methods: [{ id: "dcf-3stage", weight: 1, confidence: 72, value: 180 }],
  price: 170,
  cases: {
    bear: { value: 140, vsPrice: -17.6, g0: 8, margin: 18, rate: 11, gT: 2 },
    base: { value: 180, vsPrice: 5.9, g0: 15, margin: 22, rate: 9.5, gT: 2.5 },
    bull: { value: 230, vsPrice: 35.3, g0: 21, margin: 26, rate: 8.5, gT: 3 },
  },
  impliedGrowth: 18,
  deliveredGrowth: 15,
  confidence: 72,
  dataQuality: 90,
  flags: [],
  refusalReason: null,
  facts: { netCash: 1_000_000, runwayMonths: null, dilution3y: 0.5, cashPerShare: 4 },
  audit: { rf: 4.3, betaAdj: 1, erp: 4.75, sizePremium: 0, wacc: 9.5, tvShare: 0.7 },
  traceId: "trace-aapl-1",
  modelVersion: "valuation@1.0.0",
  configHash: "sha256:abc",
});

test("accepts a complete finite valuation output", () => {
  const errors = validateValuationOutput(valid());
  assert.deepEqual(errors, []);
});

test("rejects an unsupported status and missing trace identity", () => {
  const output = valid();
  output.status = "buy";
  output.traceId = "";
  const errors = validateValuationOutput(output);
  assert.ok(errors.some((x) => x.includes("status")));
  assert.ok(errors.some((x) => x.includes("traceId")));
});

test("rejects non-finite numeric output", () => {
  const output = valid();
  output.cases.base.value = Number.NaN;
  const errors = validateValuationOutput(output);
  assert.ok(errors.some((x) => x.includes("cases.base.value")));
});

test("accepts legitimate unavailable growth fields as null", () => {
  const output = valid();
  output.impliedGrowth = null;
  output.deliveredGrowth = null;
  assert.deepEqual(validateValuationOutput(output), []);
});

test("requires the complete facts and audit key sets", () => {
  const output = valid();
  delete output.facts.cashPerShare;
  delete output.audit.tvShare;
  const errors = validateValuationOutput(output);
  assert.ok(errors.some((x) => x.includes("facts.cashPerShare")));
  assert.ok(errors.some((x) => x.includes("audit.tvShare")));
});

