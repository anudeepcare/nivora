import test from "node:test";
import assert from "node:assert/strict";
import * as h from "../lib/holdings-brief.ts";
const p = (symbol, quantity, assetType = "stock") => ({
  symbol,
  quantity,
  assetType,
  cost: 10,
  id: symbol,
  currency: "USD",
});
const q = (price, changePct = 0) => ({
  price,
  changePct,
  currency: "USD",
  stale: false,
  asOf: "2026-10-18T12:00:00Z",
  source: "test",
  session: "closed",
});
test("portfolio exposure uses actual priced holdings, explicit unknown sectors and missing quotes", () => {
  const r = h.holdingsContext(
    [p("APP", 2), p("SAP", 1), p("USD", 50, "cash")],
    { APP: q(100) },
    { APP: "Technology" },
  );
  assert.equal(r.pricedValue, 250);
  assert.equal(r.missing, 1);
  assert.equal(r.sectors.find((s) => s.name === "Technology").value, 200);
  assert.equal(r.sectors.find((s) => s.name === "Cash").value, 50);
  assert.equal(r.largest.symbol, "APP");
});
test("portfolio daily estimate excludes stale prices and does not label returns on deposits", () => {
  const r = h.holdingsContext(
    [p("APP", 2), p("SAP", 1)],
    { APP: q(110, 10), SAP: { ...q(100), stale: true } },
    {},
  );
  assert(Math.abs(r.observedChange - 20) < 1e-8);
  assert.equal(r.stale, 1);
});
test("research changes report only comparable observed facts and distinguish first observation", () => {
  const current = {
    price: 110,
    period: "2025-12-31",
    revenue: 120,
    monthly: 2,
    observedAt: "2026-10-18",
  };
  assert.deepEqual(h.observedChanges(null, current), []);
  assert(
    h
      .observedChanges({ ...current, monthly: 1, price: 100 }, current)
      .some((x) => x.includes("1× → 2×")),
  );
  assert(
    !h
      .observedChanges(
        { ...current, period: "2024-12-31", revenue: 100 },
        current,
      )
      .some((x) => x.includes("Revenue changed")),
  );
});
test("estimate revisions compare the same future period and currency only", () => {
  const a = {
    price: 10,
    period: null,
    revenue: null,
    monthly: 1,
    observedAt: "2026-10-17",
    estimate: {
      date: "2027-12-31",
      currency: "USD",
      frequency: "Annual",
      eps: 2,
      revenue: 100,
    },
  };
  assert(
    h
      .observedChanges(a, { ...a, estimate: { ...a.estimate, eps: 2.2 } })
      .some((x) => x.includes("EPS estimate")),
  );
  assert(
    !h
      .observedChanges(a, {
        ...a,
        estimate: { ...a.estimate, currency: "EUR", eps: 2.2 },
      })
      .some((x) => x.includes("EPS estimate")),
  );
});
test("concentration combines multiple lots of the same instrument", () => {
  const r = h.holdingsContext(
    [p("APP", 6), p("APP", 6), p("SAP", 10)],
    { APP: q(1), SAP: q(1) },
    {},
  );
  assert.deepEqual(r.largest, { symbol: "APP", value: 12 });
});
test('exposure total reconciles with headline valuation when quotes are stale or costs invalid',async()=>{const {portfolioTotals}=await import('../lib/engine.ts');const positions=[p('APP',2),p('SAP',1),p('USD',50,'cash'),{...p('BAD',1),cost:-1}];const quotes={APP:q(100),SAP:{...q(90),stale:true},BAD:q(100)};const c=h.holdingsContext(positions,quotes,{});assert.equal(c.pricedValue,portfolioTotals(positions,quotes).knownValue);assert.equal(c.pricedValue,340);assert.equal(c.stale,1);assert.equal(c.missing,1);});
