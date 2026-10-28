import test from "node:test";
import assert from "node:assert/strict";
import {
  compareDca,
  parseHoldingsCsv,
  tradePreview,
  stressPortfolio,
} from "../lib/planning.ts";
import { evaluateAlert } from "../lib/alert-policy.ts";
import { cleanDocument } from "../lib/documents.ts";
const bars = Array.from({ length: 850 }, (_, i) => {
  const t = new Date(Date.UTC(2022, 0, 1 + i));
  return {
    time: t.toISOString().slice(0, 10),
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    volume: 1,
  };
});
test("DCA comparison uses equal contributions and never spends unavailable cash", () => {
  const r = compareDca(bars, "2024-05-01", 10, "crypto");
  assert.ok(r.months > 0);
  assert.equal(r.fixed.contributed, r.adaptive.contributed);
  assert.ok(r.adaptive.cash >= 0);
  assert.ok(r.adaptive.value <= r.adaptive.contributed);
  assert.equal(r.costBps, 10);
});
test("CSV import validates all rows and supports quoted commas without replacing holdings", () => {
  const r = parseHoldingsCsv(
    "symbol,quantity,cost,currency\nMSFT,2,100,USD\nBTC/USD,0.1,50000,USD",
  );
  assert.equal(r.length, 2);
  assert.throws(() =>
    parseHoldingsCsv("symbol,quantity,cost,currency\nMSFT,-2,1,USD"),
  );
  assert.throws(() =>
    parseHoldingsCsv("symbol,quantity,cost,currency\nMSFT,2,1,EUR"),
  );
});
test("portfolio preview respects cash and exposure caps", () => {
  assert.equal(tradePreview(1000, 50, 200, 100, 50).allowed, false);
  assert.equal(tradePreview(1000, 400, 200, 100, 50).allowed, true);
  assert.equal(
    stressPortfolio([{ symbol: "MSFT", value: 1000 }], -30).change,
    -300,
  );
});
test("alerts reject stale price triggers and use deterministic event identities", () => {
  const rule = {
      symbol: "MSFT",
      type: "price-below",
      threshold: 100,
      enabled: true,
      name: "",
    },
    state = {
      snapshotId: "a",
      price: 90,
      stale: true,
      monthly: 2,
      month: "2026-09",
      filings: [],
    };
  assert.equal(evaluateAlert(rule, state, "2026-10-01"), null);
  const event = evaluateAlert(rule, { ...state, stale: false }, "2026-10-01");
  assert.equal(
    event.event_key,
    evaluateAlert(
      rule,
      { ...state, stale: false, snapshotId: "b" },
      "2026-10-01",
    ).event_key,
  );
});
test("saved research validates links, symbols and bounded content", () => {
  assert.throws(() =>
    cleanDocument("note", { sourceUrl: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    cleanDocument("alert", {
      symbol: "MSFT",
      type: "price-below",
      threshold: null,
    }),
  );
  assert.equal(
    cleanDocument("note", { thesis: "x".repeat(4000) }).thesis.length,
    3000,
  );
});
test("earnings reminders use upcoming report dates and stable dedup keys", () => {
  const rule = {
    symbol: "APP",
    type: "earnings-soon",
    threshold: 7,
    enabled: true,
    name: "",
  };
  const state = {
    snapshotId: "x",
    price: 100,
    stale: false,
    monthly: 1,
    month: "2026-09",
    filings: [],
    asOf: "2026-10-18T12:00:00Z",
    earnings: [{ date: "2026-10-20", period: "2026-06-30" }],
  };
  const e = evaluateAlert(rule, state, "2026-10-01");
  assert.equal(e.event_key, "earnings:2026-10-20");
  assert.equal(
    evaluateAlert(rule, { ...state, asOf: "2026-10-21" }, "2026-10-01"),
    null,
  );
  assert.equal(cleanDocument("alert", rule).threshold, 7);
  assert.throws(() => cleanDocument("alert", { ...rule, threshold: 100 }));
});
test("DCA history excludes a month missing its final required session", () => {
  const r = compareDca(bars, "2024-05-01", 10, "crypto");
  assert(!r.history.some((x) => x.month === "2024-04"));
});
