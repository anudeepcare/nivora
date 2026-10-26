import test from "node:test";
import assert from "node:assert/strict";
import { movementContext } from "../lib/movement-context.ts";
import { demoData } from "./fixtures/demo.ts";
const fixture = () => ({
  ...structuredClone(demoData.research.MSFT),
  priceObservedAt: "2026-10-26T13:24:00Z",
  retrievedAt: "2026-10-26T13:24:00Z",
  quote: {
    price: 120,
    previousClose: 100,
    changePct: null,
    currency: "USD",
    asOf: "2026-10-26T13:23:00Z",
    session: "Live · premarket",
    source: "test",
    stale: false,
  },
});
test("invalid prices cannot reappear in the movement summary", () => {
  const r = fixture();
  r.quote.price = -5;
  r.quote.changePct = 20;
  const m = movementContext(r, []);
  assert.equal(m.price, null);
  assert.equal(m.change, null);
});
test("missing change is derived only from an explicit positive prior close", () => {
  const r = fixture();
  assert.equal(movementContext(r, []).change, 20);
  r.quote.previousClose = null;
  assert.equal(movementContext(r, []).change, null);
  r.quote.previousClose = 0;
  assert.equal(movementContext(r, []).change, null);
});
test("an older or stale quote is never called today’s move", () => {
  const r = fixture();
  assert.equal(movementContext(r, []).today, true);
  r.quote.stale = true;
  assert.equal(movementContext(r, []).today, false);
  r.quote.stale = false;
  r.quote.asOf = "2026-10-23T20:00:00Z";
  assert.equal(movementContext(r, []).today, false);
});
test("coverage excludes future, old, duplicate and unsafe links without claiming a cause", () => {
  const r = fixture(),
    item = {
      date: "2026-10-26",
      title: "Company update",
      url: "https://example.com/update",
    };
  const m = movementContext(r, [
    item,
    item,
    { ...item, url: "javascript:alert(1)" },
    { ...item, date: "2026-11-01", url: "https://example.com/future" },
    { ...item, date: "2026-10-01", url: "https://example.com/old" },
  ]);
  assert.deepEqual(m.headlines, [{ ...item, publisher: "example.com" }]);
  assert.equal(m.verifiedCause, null);
});
test("next earnings excludes already reported events and invalid calendar dates", () => {
  const r = fixture();
  r.evidence = {
    ...r.evidence,
    earnings: [
      { date: "2026-10-26", actual: 1, time: "BeforeMarket" },
      { date: "2026-10-27", actual: null, time: "AfterMarket" },
      { date: "2026-02-30", actual: null, time: "" },
    ],
  };
  assert.equal(movementContext(r, []).earnings.date, "2026-10-27");
});
