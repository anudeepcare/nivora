import test from "node:test";
import assert from "node:assert/strict";
const module = await import("../lib/price-reference.ts").catch(() => ({}));
const candle = (time, close) => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume: 100,
});
const fixture = () => ({
  company: {
    symbol: "TEST",
    assetType: "stock",
    currency: "USD",
    exchange: "NASDAQ",
  },
  quote: {
    price: 120,
    previousClose: 100,
    changePct: 20,
    currency: "USD",
    asOf: "2026-10-26T13:23:00Z",
    session: "Live · premarket",
    source: "test",
    stale: false,
  },
  history: [
    candle("2026-10-23", 100),
    candle("2026-10-26", 110),
    candle("2026-10-27", 115),
  ],
});
const select = (r, now) => {
  assert.equal(typeof module.selectPriceReference, "function");
  return module.selectPriceReference(r, Date.parse(now));
};
test("fresh positive quote is selected against the supplied wall clock", () => {
  assert.deepEqual(select(fixture(), "2026-10-26T13:24:00Z"), {
    price: 120,
    asOf: "2026-10-26T13:23:00Z",
    basis: "quote",
    currency: "USD",
  });
});
test("an expired quote selects the newest settled daily close, never the forming bar", () => {
  assert.deepEqual(select(fixture(), "2026-10-27T13:24:00Z"), {
    price: 110,
    asOf: "2026-10-26",
    basis: "settled-close",
    currency: "USD",
  });
});
test("US history only includes the same-day close after 17:00 New York", () => {
  assert.equal(select(fixture(), "2026-10-27T20:59:00Z").price, 110);
  assert.equal(select(fixture(), "2026-10-27T21:00:00Z").price, 115);
});
test("settled references expire after four calendar days and invalid clocks produce none", () => {
  assert.equal(select(fixture(), "2026-11-02T13:00:00Z"), null);
  assert.equal(select(fixture(), "invalid"), null);
});
test("currency conflicts do not produce a quote or historical reference", () => {
  const r = fixture();
  r.quote.currency = "EUR";
  assert.equal(select(r, "2026-10-26T13:24:00Z"), null);
});
test("invalid OHLC, future bars and conflicting duplicate dates cannot win by order", () => {
  const r = fixture();
  r.history = [
    candle("2026-10-26", 100),
    { ...candle("2026-10-23", 110), high: 1 },
    candle("2026-10-27", 115),
    candle("2026-10-27", 116),
    candle("2030-01-01", 1),
  ];
  assert.equal(select(r, "2026-10-27T21:00:00Z").price, 100);
  r.history.reverse();
  assert.equal(select(r, "2026-10-27T21:00:00Z").price, 100);
});
test("crypto closes settle only after their UTC date ends", () => {
  const r = fixture();
  r.company.assetType = "crypto";
  assert.equal(select(r, "2026-10-27T23:59:00Z").price, 110);
  assert.equal(select(r, "2026-10-28T00:00:00Z").price, 115);
});
test("unknown international exchange clocks use a conservative daily settlement delay", () => {
  const r = fixture();
  r.company.foreignListing = true;
  r.company.exchange = "UNKNOWN";
  assert.equal(select(r, "2026-10-27T11:59:00Z"), null);
  assert.equal(select(r, "2026-10-27T12:00:00Z").price, 110);
});
test("a newer settled close takes precedence over an older quote still inside its overnight age limit", () => {
  const r = fixture();
  r.quote = {
    ...r.quote,
    asOf: "2026-10-23T20:00:00Z",
    session: "Last available quote",
    source: "test",
    stale: false,
  };
  assert.deepEqual(select(r, "2026-10-27T01:00:00Z"), {
    price: 110,
    asOf: "2026-10-26",
    basis: "settled-close",
    currency: "USD",
  });
});
test("a foreign issuer on a verified US exchange uses that exchange session clock", () => {
  const r = fixture();
  r.company.foreignListing = true;
  r.company.exchange = "NYSE";
  assert.equal(select(r, "2026-10-27T21:00:00Z").price, 115);
});
test("a same-date intraday quote cannot outrank the subsequently completed US close", () => {
  const r = fixture();
  r.quote = {
    ...r.quote,
    price: 90,
    asOf: "2026-10-26T17:00:00Z",
    session: "Last available quote",
  };
  assert.deepEqual(select(r, "2026-10-27T01:00:00Z"), {
    price: 110,
    asOf: "2026-10-26",
    basis: "settled-close",
    currency: "USD",
  });
});
test("a genuinely later quote after the US close is preserved", () => {
  const r = fixture();
  r.quote = {
    ...r.quote,
    price: 112,
    asOf: "2026-10-26T20:30:00Z",
    session: "Last available quote",
  };
  assert.equal(select(r, "2026-10-27T01:00:00Z").price, 112);
  assert.equal(select(r, "2026-10-27T01:00:00Z").basis, "quote");
});
test("same-date close precedence follows New York winter time", () => {
  const r = fixture();
  r.history = [candle("2026-01-12", 110)];
  r.quote = {
    ...r.quote,
    price: 90,
    asOf: "2026-01-12T20:30:00Z",
    session: "Last available quote",
  };
  assert.equal(select(r, "2026-01-13T02:00:00Z").price, 110);
  r.quote.asOf = "2026-01-12T21:30:00Z";
  assert.equal(select(r, "2026-01-13T02:00:00Z").price, 90);
});
