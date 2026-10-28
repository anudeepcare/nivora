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
import { researchAccumulation } from "../lib/accumulation-policy-v5.ts";
import { evaluateAccumulation } from "../lib/accumulation-evaluation.ts";
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
test("Strategy Lab uses the displayed Pace policy and the same completed-period accounting", () => {
  const input = Array.from({ length: 1460 }, (_, i) => {
    const price = i < 500 ? 100 : i < 620 ? 350 : 60;
    return {
      time: new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 100,
    };
  });
  const result = compareDca(input, "2024-05-01", 50, "crypto");
  const live = researchAccumulation(input, "2024-05-01", "crypto");
  assert.equal(result.policy, live.version);
  const evaluation = evaluateAccumulation(input, "2024-05-01", 50, "crypto");
  assert.equal(evaluation.available, true);
  assert.equal(result.months, evaluation.months);
  assert.equal(result.adaptive.value, evaluation.adaptive.value);
  assert.equal(result.fixed.value, evaluation.fixed.value);
  for (const row of result.history) {
    const prior = new Date(`${row.month}-01T00:00:00Z`);
    prior.setUTCDate(0);
    const month = prior.toISOString().slice(0, 7);
    assert.equal(
      row.multiplier,
      live.history.find((s) => s.month === month).multiplier,
    );
  }
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
