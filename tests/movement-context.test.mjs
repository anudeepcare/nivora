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
  const m = movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") });
  assert.equal(m.price, null);
  assert.equal(m.change, null);
});
test("missing change is derived only from an explicit positive prior close", () => {
  const r = fixture();
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).change,
    20,
  );
  r.quote.previousClose = null;
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).change,
    null,
  );
  r.quote.previousClose = 0;
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).change,
    null,
  );
});
test("an older or stale quote is never called today’s move", () => {
  const r = fixture();
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).today,
    true,
  );
  r.quote.stale = true;
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).today,
    false,
  );
  r.quote.stale = false;
  r.quote.asOf = "2026-10-23T20:00:00Z";
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).today,
    false,
  );
});
test("coverage excludes future, old, duplicate and unsafe links without claiming a cause", () => {
  const r = fixture(),
    item = {
      date: "2026-10-26",
      title: "Company update",
      url: "https://example.com/update",
    };
  const m = movementContext(
    r,
    [
      item,
      item,
      { ...item, url: "javascript:alert(1)" },
      { ...item, date: "2026-11-01", url: "https://example.com/future" },
      { ...item, date: "2026-10-01", url: "https://example.com/old" },
    ],
    { now: Date.parse("2026-10-26T13:24:00Z") },
  );
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
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).earnings
      .date,
    "2026-10-27",
  );
});

test("a cached page uses the wall clock after reopening, not its retrieval date", () => {
  const r = fixture();
  assert.equal(
    movementContext(r, [], { now: Date.parse("2026-10-26T13:24:00Z") }).today,
    true,
  );
  const m = movementContext(r, [], { now: Date.parse("2026-10-27T13:24:00Z") });
  assert.equal(m.today, false);
  assert.equal(m.stale, true);
});
test("news and earnings expire against the wall clock", () => {
  const r = fixture();
  r.evidence = {
    ...r.evidence,
    earnings: [{ date: "2026-10-27", actual: null, time: "AfterMarket" }],
  };
  const m = movementContext(
    r,
    [
      {
        date: "2026-10-26",
        title: "Old update",
        url: "https://example.com/old",
      },
    ],
    { now: Date.parse("2026-11-04T13:24:00Z") },
  );
  assert.equal(m.earnings, null);
  assert.equal(m.headlines.length, 0);
});
test("a settled fallback has its own price and prior available close change", () => {
  const r = fixture();
  r.history = [
    {
      time: "2026-10-23",
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 100,
    },
    {
      time: "2026-10-26",
      open: 110,
      high: 110,
      low: 110,
      close: 110,
      volume: 100,
    },
  ];
  const m = movementContext(r, [], { now: Date.parse("2026-10-27T13:24:00Z") });
  assert.equal(m.price, 110);
  assert.equal(m.change, 10);
  assert.equal(m.asOf, "2026-10-26");
  assert.equal(m.priceBasis, "settled-close");
  assert.equal(m.today, false);
  assert.equal(m.changeFrom, "2026-10-23");
});
test("future-dated quotes and invalid clocks cannot appear as a dated move", () => {
  const r = fixture();
  r.quote.asOf = "2030-01-01T12:00:00Z";
  const m = movementContext(r, [], { now: Date.parse("2026-10-27T13:24:00Z") });
  assert.equal(m.price, null);
  assert.equal(m.change, null);
  assert.equal(movementContext(fixture(), [], { now: NaN }).price, null);
});
test("settled volume uses its actual date and ages independently from retrieval", () => {
  const r = fixture();
  r.history = Array.from({ length: 30 }, (_, i) => {
    const time = new Date(Date.UTC(2026, 8, 20 + i)).toISOString().slice(0, 10);
    return { time, open: 100, high: 100, low: 100, close: 100, volume: 100 };
  }).filter(
    (b) => ![0, 6].includes(new Date(`${b.time}T12:00:00Z`).getUTCDay()),
  );
  r.history.push({
    time: "2026-10-26",
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    volume: 200,
  });
  const recent = movementContext(r, [], {
    now: Date.parse("2026-10-27T13:24:00Z"),
  });
  assert.equal(recent.relativeVolume, 2);
  assert.equal(recent.volumeDate, "2026-10-26");
  const old = movementContext(r, [], {
    now: Date.parse("2026-11-07T13:24:00Z"),
  });
  assert.equal(old.relativeVolume, null);
  assert.match(old.volumeStatus, /older than 10 days/);
});
