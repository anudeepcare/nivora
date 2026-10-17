import test from "node:test";
import assert from "node:assert/strict";
import { canonical } from "../lib/canonical.ts";
import { perspective } from "../lib/analysis.ts";

function sample({
  loss = false,
  burn = false,
  declining = false,
  stale = false,
  extended = false,
  weak = false,
} = {}) {
  const facts = [];
  for (const year of [2024, 2025])
    for (const [metric, value] of Object.entries({
      revenue: year === 2024 ? 1000 : declining ? 800 : 1200,
      netIncome: loss ? -100 : 100,
      operatingCashFlow: burn ? -100 : 200,
      capex: 50,
    }))
      facts.push({
        id: metric + year,
        metric,
        value,
        scope: "annual",
        start: `${year}-01-01`,
        end: `${year}-12-31`,
        filed: `${year + 1}-02-01`,
        currency: "USD",
        unit: "USD",
        basis: "GAAP",
        accession: String(year),
        sourceUrl: "https://example.com/filing",
        form: "10-K",
      });
  facts.push({
    id: "shares",
    metric: "shares",
    value: 100,
    scope: "instant",
    end: "2026-06-30",
    filed: "2026-08-01",
    currency: null,
    unit: "shares",
    basis: "GAAP",
    form: "10-Q",
  });
  const history = [];
  for (let i = 0; i < 1100; i++) {
    const date = new Date(Date.UTC(2024, 0, 1 + i));
    if (date.toISOString().slice(0, 10) >= "2026-10-17") break;
    if ([0, 6].includes(date.getUTCDay())) continue;
    const close = weak
      ? 150 - i * 0.08
      : 100 + i * 0.01 + (extended && i > 800 ? (i - 800) * 1.5 : 0);
    history.push({
      time: date.toISOString().slice(0, 10),
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: 100,
    });
  }
  return {
    company: {
      symbol: "TEST",
      name: "Test",
      assetType: "stock",
      currency: "USD",
      sector: "Technology",
    },
    quote: {
      price: history.at(-1).close,
      changePct: 1,
      currency: "USD",
      asOf: "2026-10-16T20:00:00Z",
      stale,
      source: "fixture",
      session: "closed",
    },
    facts,
    history,
    filings: [],
    issues: [],
    retrievedAt: "2026-10-17T00:00:00Z",
  };
}
test("positive current business and trend create a conditional buy candidate, not asserted fair value", () => {
  const d = canonical(sample()).decision;
  assert.equal(d?.buying.code, "candidate");
  assert.equal(d?.owning.code, "hold");
  assert.equal(d?.valuationEstablished, false);
});
test("missing or stale prices cannot create a current buy candidate", () => {
  for (const quote of [
    { stale: true },
    { price: null },
    { price: 0 },
    { asOf: null },
    { asOf: "2026-10-18T00:00:00Z" },
  ]) {
    const r = sample();
    r.quote = { ...r.quote, ...quote };
    assert.equal(canonical(r).decision?.buying.code, "data");
  }
});
test("a reported loss with positive cash generation does not imply funding distress or a sell", () => {
  const r = sample({ loss: true });
  assert.doesNotMatch(perspective(r).heading, /funding/);
  assert.equal(canonical(r).decision?.owning.code, "review");
  assert.notEqual(canonical(r).decision?.buying.code, "candidate");
});
test("persistent losses and cash outflows with declining revenue prompt an exit review, not an automatic order", () => {
  const d = canonical(
    sample({ loss: true, burn: true, declining: true, weak: true }),
  ).decision;
  assert.equal(d?.owning.code, "exit");
  assert.equal(d?.buying.code, "wait");
});
test("an extended confirmed monthly price zone prompts trim review, without marking a healthy company broken", () => {
  const r = sample({ extended: true });
  const d = canonical(r).decision;
  assert.equal(d?.owning.code, "trim");
  assert.equal(d?.buying.code, "wait");
  assert.equal(perspective(r).business, "Profitable");
});
test("crypto and a bank do not inherit an ordinary-company buy or exit signal", () => {
  const r = sample();
  r.company = { ...r.company, symbol: "BTC/USD", assetType: "crypto" };
  assert.equal(canonical(r).decision?.buying.code, "technical");
  r.company = {
    ...r.company,
    symbol: "JPM",
    assetType: "stock",
    sector: "Financial Services",
  };
  assert.equal(canonical(r).decision?.buying.code, "specialist");
});
test("classification evidence affects canonical identity because it can change the applicable model", () => {
  const r = sample();
  const a = canonical(r);
  const b = canonical({
    ...r,
    evidence: {
      profile: { sector: "Financial Services", industry: "Banks - Regional" },
    },
  });
  assert.notEqual(a.evidenceId, b.evidenceId);
});
test("a current quote cannot turn an obsolete trend into a buy candidate", () => {
  const r = sample();
  r.history = r.history.filter((b) => b.time <= "2025-12-31");
  assert.equal(canonical(r).decision?.buying.code, "data");
  assert.notEqual(canonical(r).decision?.owning.code, "trim");
});
test("an unidentified business model cannot receive operating-company action labels", () => {
  const r = sample();
  delete r.company.sector;
  assert.equal(canonical(r).decision?.buying.code, "specialist");
  assert.equal(canonical(r).decision?.owning.code, "review");
});
