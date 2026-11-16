import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSentiSenseEstimates as normalize } from "../lib/sentisense-estimates.ts";
const row = {
  periodLabel: "0y",
  periodType: "CURRENT_YEAR",
  fiscalPeriodEnd: "2026-12-31",
  estimateLow: -2,
  estimateMean: 0,
  estimateHigh: 2,
  numberOfAnalysts: 7,
  revenueLow: 1e9,
  revenueMean: 2e9,
  revenueHigh: 3e9,
  numberOfAnalystsRevenue: 11,
};
const payload = (rows = [row], extra = {}) => ({
  isPreview: false,
  data: { ticker: "IREN", estimates: rows },
  ...extra,
});
test("documented USD contract preserves losses, zero, absolute revenue and separate counts", () => {
  const r = normalize(payload(), "IREN");
  assert.equal(r.estimates[0].currency, "USD");
  assert.equal(r.estimates[0].eps, 0);
  assert.equal(r.estimates[0].epsLow, -2);
  assert.equal(r.estimates[0].revenue, 2e9);
  assert.equal(r.estimates[0].analysts, 7);
  assert.equal(r.estimates[0].revenueAnalysts, 11);
  assert.equal(r.asOf, null);
});
test("report label never substitutes for unknown fiscal date; annual frequency is explicit", () => {
  const r = normalize(
    payload([{ ...row, periodLabel: "2026-11-15", fiscalPeriodEnd: null }]),
    "IREN",
  );
  assert.equal(r.estimates[0].date, null);
  assert.equal(r.estimates[0].frequency, "annual");
});
test("preview, malformed envelopes and different per-share listings are rejected", () => {
  assert.equal(normalize(payload([], { isPreview: true }), "IREN"), null);
  assert.equal(normalize(payload(), "NBIS"), null);
  assert.equal(
    normalize({ data: { ticker: "IREN", estimates: [] } }, "IREN"),
    null,
  );
  assert.equal(
    normalize(
      { isPreview: false, data: { ticker: "BRK.B", estimates: [row] } },
      "BRK.A",
    ),
    null,
  );
});
test("empty estimates are valid empty coverage, not fabricated zero rows", () => {
  assert.deepEqual(normalize(payload([]), "IREN").estimates, []);
  assert.equal(
    normalize(
      payload([
        {
          ...row,
          estimateLow: null,
          estimateMean: null,
          estimateHigh: null,
          revenueLow: null,
          revenueMean: null,
          revenueHigh: null,
        },
      ]),
      "IREN",
    ).estimates.length,
    0,
  );
});
test("partial EPS-only and revenue-only observations retain nulls", () => {
  let r = normalize(
    payload([
      {
        ...row,
        revenueLow: null,
        revenueMean: null,
        revenueHigh: null,
        numberOfAnalystsRevenue: null,
      },
    ]),
    "IREN",
  ).estimates[0];
  assert.equal(r.revenue, null);
  assert.equal(r.revenueAnalysts, null);
  r = normalize(
    payload([
      {
        ...row,
        estimateLow: null,
        estimateMean: null,
        estimateHigh: null,
        numberOfAnalysts: null,
      },
    ]),
    "IREN",
  ).estimates[0];
  assert.equal(r.eps, null);
  assert.equal(r.analysts, null);
});
test("invalid ranges are rejected, missing bounds are not fabricated", () => {
  assert.equal(
    normalize(payload([{ ...row, estimateLow: 4 }]), "IREN").estimates.length,
    0,
  );
  assert.equal(
    normalize(payload([{ ...row, revenueMean: -3 }]), "IREN").estimates.length,
    0,
  );
  assert.equal(
    normalize(payload([{ ...row, estimateLow: null }]), "IREN").estimates[0]
      .epsLow,
    null,
  );
});
test("strict dates/counts and numeric types do not silently coerce", () => {
  const r = normalize(
    payload([
      {
        ...row,
        fiscalPeriodEnd: "2026-02-30",
        numberOfAnalysts: 1.2,
        numberOfAnalystsRevenue: "11",
        estimateMean: "0",
      },
    ]),
    "IREN",
  ).estimates[0];
  assert.equal(r.date, null);
  assert.equal(r.analysts, null);
  assert.equal(r.revenueAnalysts, null);
  assert.equal(r.eps, null);
});
test("duplicate periods are ambiguous; unknown periods are not guessed", () => {
  assert.equal(normalize(payload([row, row]), "IREN"), null);
  assert.equal(
    normalize(payload([{ ...row, periodType: "ANNUAL" }]), "IREN").rejectedRows,
    1,
  );
});

test("all-zero unsupported books do not become a zero valuation forecast", () => {
  const r = normalize(
    payload([
      {
        ...row,
        estimateLow: 0,
        estimateMean: 0,
        estimateHigh: 0,
        revenueLow: 0,
        revenueMean: 0,
        revenueHigh: 0,
        numberOfAnalysts: 0,
        numberOfAnalystsRevenue: 0,
      },
    ]),
    "IREN",
  );
  assert.equal(r.estimates.length, 0);
  assert.equal(r.rejectedRows, 1);
});
