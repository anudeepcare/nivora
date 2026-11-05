import test from "node:test";
import assert from "node:assert/strict";
import { blackScholesVanna, modelVannaMap } from "../lib/options-vanna.ts";
const contract = (x = {}) => ({
  id: "c",
  type: "call",
  strike: 100,
  expiry: "2026-12-18",
  observed: "2026-11-05",
  bid: 2,
  ask: 3,
  oi: 10,
  volume: 30,
  iv: 0.3,
  delta: 0.5,
  gamma: 0.02,
  theta: -0.1,
  vega: 0.1,
  multiplier: 100,
  standard: true,
  ...x,
});
const asOf = "2026-11-05T16:00:00Z";
// Independent numerical integration of the normal density avoids reusing the vanna formula.
function cdf(x) {
  const n = 4000,
    a = -10,
    h = (x - a) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const z = a + i * h;
    s +=
      ((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.exp((-z * z) / 2)) /
      Math.sqrt(2 * Math.PI);
  }
  return (s * h) / 3;
}
function delta(
  { spot, strike, iv, years, riskFree, dividendYield },
  isCall = true,
) {
  const d1 =
    (Math.log(spot / strike) +
      (riskFree - dividendYield + (iv * iv) / 2) * years) /
    (iv * Math.sqrt(years));
  return Math.exp(-dividendYield * years) * (cdf(d1) - (isCall ? 0 : 1));
}
test("analytic vanna agrees with finite-difference call and put delta including dividends", () => {
  for (const strike of [80, 100, 120])
    for (const dividendYield of [0, 0.025]) {
      const p = {
        spot: 100,
        strike,
        iv: 0.3,
        years: 0.4,
        riskFree: 0.04,
        dividendYield,
      };
      for (const isCall of [true, false]) {
        const h = 1e-5,
          numeric =
            (delta({ ...p, iv: p.iv + h }, isCall) -
              delta({ ...p, iv: p.iv - h }, isCall)) /
            (2 * h);
        assert.ok(Math.abs(blackScholesVanna(p) - numeric) < 1e-7);
      }
    }
});
test("vanna rejects missing, non-finite, non-positive and expired inputs", () => {
  const p = { spot: 100, strike: 100, iv: 0.3, years: 0.5 };
  for (const field of ["spot", "strike", "iv", "years"])
    for (const value of [null, undefined, 0, -1, NaN, Infinity])
      assert.equal(blackScholesVanna({ ...p, [field]: value }), null);
  assert.equal(blackScholesVanna({ ...p, riskFree: Infinity }), null);
});
test("cell units use 100 shares, spot and one percentage-point IV; put sign is a convention", () => {
  const map = modelVannaMap(
    [contract(), contract({ id: "p", type: "put", oi: 4 })],
    100,
    asOf,
  );
  const years =
    (Date.parse("2026-12-18T21:00:00Z") - Date.parse(asOf)) /
    (365.25 * 86400000);
  const v = blackScholesVanna({ spot: 100, strike: 100, iv: 0.3, years });
  assert.equal(map.cells[0].call, v * 10 * 100 * 100 * 0.01);
  assert.equal(map.cells[0].put, -v * 4 * 100 * 100 * 0.01);
  assert.equal(map.cells[0].net, map.cells[0].call + map.cells[0].put);
  assert.equal(map.coverage, 1);
});
test("zero open interest is valid zero; absent IV or OI is unavailable", () => {
  assert.equal(modelVannaMap([contract({ oi: 0 })], 100, asOf).cells[0].net, 0);
  for (const change of [{ oi: null }, { iv: null }, { iv: 0 }, { oi: -1 }])
    assert.equal(
      modelVannaMap([contract(change)], 100, asOf).cells[0].net,
      null,
    );
});
test("missing inputs cannot silently become a partial net cell", () => {
  const m = modelVannaMap(
    [contract(), contract({ id: "p", type: "put", oi: null })],
    100,
    asOf,
  );
  assert.equal(m.cells[0].net, null);
  assert.equal(m.coverage, 0.5);
  assert.equal(m.cells[0].modeled, 1);
});
test("mixed source dates invalidate a cell but remain visible in provenance", () => {
  const m = modelVannaMap(
    [contract(), contract({ id: "p", type: "put", observed: "2026-11-04" })],
    100,
    asOf,
  );
  assert.equal(m.cells[0].net, null);
  assert.deepEqual(m.cells[0].observedDates, ["2026-11-04", "2026-11-05"]);
  assert.match(m.cells[0].reason, /source dates/i);
  assert.equal(m.coverage, 0);
});
test("strict dates, valid as-of and positive spot are required", () => {
  for (const change of [
    { expiry: "2026-02-30" },
    { observed: "2026-02-30" },
    { observed: "2026-11-06" },
    { expiry: "2026-11-04" },
  ])
    assert.equal(
      modelVannaMap([contract(change)], 100, asOf).cells[0].net,
      null,
    );
  for (const clock of ["bad", "2026-02-30T16:00:00Z"])
    assert.equal(modelVannaMap([contract()], 100, clock).cells[0].net, null);
  assert.equal(modelVannaMap([contract()], 0, asOf).cells[0].net, null);
});
test("expiry clock is explicitly 21 UTC and zero remaining time is unavailable", () => {
  assert.notEqual(
    modelVannaMap([contract()], 100, "2026-12-18T20:59:00Z").cells[0].net,
    null,
  );
  assert.equal(
    modelVannaMap([contract()], 100, "2026-12-18T21:00:00Z").cells[0].net,
    null,
  );
});
test("adjusted contracts are excluded and configurable model assumptions affect results", () => {
  const m = modelVannaMap(
    [contract(), contract({ id: "adj", standard: false, multiplier: 10 })],
    100,
    asOf,
    { riskFree: 0.02, dividendYield: 0.03 },
  );
  assert.equal(m.excluded, 1);
  assert.equal(m.eligible, 1);
  assert.deepEqual(m.assumptions, { riskFree: 0.02, dividendYield: 0.03 });
  assert.notEqual(
    m.cells[0].net,
    modelVannaMap([contract()], 100, asOf).cells[0].net,
  );
  assert.equal(
    modelVannaMap([contract({ multiplier: 10 })], 100, asOf).cells.length,
    0,
  );
});
