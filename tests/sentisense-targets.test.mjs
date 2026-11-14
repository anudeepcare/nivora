import test from "node:test";
import assert from "node:assert/strict";
import { consensusOutlook } from "../lib/outlook.ts";
import { researchVisitSnapshot } from "../lib/research-changes.ts";
import { projectResearch, resolveAccess } from "../lib/access-policy.ts";
const api = await import("../lib/sentisense-targets.ts").catch(() => ({}));
const now = Date.parse("2026-11-14T00:00:00Z");
const consensus = () => ({
  isPreview: true,
  data: {
    ticker: "IREN",
    targetLow: 23,
    targetMean: 56.6874,
    targetHigh: 139,
    numberOfAnalysts: 19,
    updatedAt: "2026-11-13T23:37:41Z",
    updatedAtEpoch: 1794613061,
    currentPrice: 18.17,
    upsidePercent: 999,
    strongBuy: 0,
    buy: 0,
    hold: 0,
    sell: 0,
    strongSell: 0,
  },
});
const profile = () => ({
  ticker: "IREN",
  currency: "usd",
  primaryExchange: "XNAS",
  country: "United States",
});
const normalized = () => {
  assert.equal(typeof api.normalizeSentiSenseTargets, "function");
  return api.normalizeSentiSenseTargets(consensus(), profile(), "IREN", now);
};
const research = () => ({
  company: {
    symbol: "IREN",
    assetType: "stock",
    currency: "USD",
    exchange: "NASDAQ",
  },
  quote: { price: 21, currency: "USD", asOf: "2026-11-13T23:00:00Z" },
  history: [
    {
      time: "2026-11-13",
      open: 20.84,
      high: 20.84,
      low: 20.84,
      close: 20.84,
      volume: 10,
    },
  ],
  retrievedAt: "2026-11-14T00:00:00Z",
  facts: [],
  filings: [],
  issues: [],
  evidence: {
    source: "EODHD",
    updatedAt: "2026-11-13",
    consensus: {
      target: 40,
      currency: "USD",
      low: null,
      high: null,
      strongBuy: 5,
      buy: 3,
    },
  },
});

test("normalizer retains only explicit independent targets and ignores withheld rating zeros and provider price", () => {
  const value = normalized();
  assert.equal(value.symbol, "IREN");
  assert.equal(value.source, "SentiSense");
  assert.equal(value.updatedAt, "2026-11-13T23:37:41Z");
  assert.deepEqual(
    [value.low, value.target, value.high, value.analysts, value.currency],
    [23, 56.6874, 139, 19, "USD"],
  );
  for (const key of [
    "strongBuy",
    "buy",
    "hold",
    "sell",
    "strongSell",
    "currentPrice",
    "upsidePercent",
  ])
    assert.equal(key in value, false);
});

test("share-class, USD listing, finite positive ordered band and supplied analyst count are checked", () => {
  normalized();
  for (const mutate of [
    (c) => (c.ticker = "BRK.B"),
    (c) => (c.targetLow = null),
    (c) => delete c.targetHigh,
    (c) => (c.targetLow = 60),
    (c) => (c.targetMean = 0),
    (c) => (c.targetHigh = NaN),
    (c) => (c.targetMean = "56"),
    (c) => (c.numberOfAnalysts = 0),
    (c) => (c.numberOfAnalysts = 1.5),
  ]) {
    const c = consensus();
    mutate(c.data);
    assert.equal(
      api.normalizeSentiSenseTargets(c, profile(), "IREN", now),
      null,
    );
  }
  for (const mutate of [
    (p) => (p.ticker = "BRK.B"),
    (p) => (p.currency = "eur"),
    (p) => delete p.currency,
    (p) => (p.primaryExchange = "XLON"),
    (p) => delete p.primaryExchange,
  ]) {
    const p = profile();
    mutate(p);
    assert.equal(
      api.normalizeSentiSenseTargets(consensus(), p, "IREN", now),
      null,
    );
  }
  for (const n of [null, undefined]) {
    const c = consensus();
    c.data.numberOfAnalysts = n;
    assert.equal(
      api.normalizeSentiSenseTargets(c, { data: profile() }, "IREN", now)
        .analysts,
      null,
    );
  }
  const c = consensus();
  c.data.ticker = "BRK.B";
  assert.equal(
    api.normalizeSentiSenseTargets(
      c,
      { ...profile(), ticker: "BRK.B" },
      "BRK.A",
      now,
    ),
    null,
  );
});

test("target refresh requires a real ISO calendar date, consistent epoch and no future or stale evidence", () => {
  normalized();
  for (const date of [
    null,
    "2026-02-30T12:00:00Z",
    "2026-11-14T00:02:00Z",
    "2026-11-06T23:59:59Z",
    "2026-13-01T00:00:00Z",
    "2026-11-13",
  ]) {
    const c = consensus();
    c.data.updatedAt = date;
    delete c.data.updatedAtEpoch;
    assert.equal(
      api.normalizeSentiSenseTargets(c, profile(), "IREN", now),
      null,
    );
  }
  const c = consensus();
  c.data.updatedAtEpoch++;
  assert.equal(api.normalizeSentiSenseTargets(c, profile(), "IREN", now), null);
  delete c.data.updatedAtEpoch;
  assert.ok(api.normalizeSentiSenseTargets(c, profile(), "IREN", now));
});

test("fresh independent range survives stale EOD evidence and uses AURYN settled close without mutating fundamentals", () => {
  const r = research();
  r.analystTargets = normalized();
  r.evidence.updatedAt = "2020-01-01";
  const before = structuredClone(r.evidence),
    c = consensusOutlook(r);
  assert.deepEqual([c.low, c.target, c.high], [23, 56.6874, 139]);
  assert.equal(c.referencePrice, 20.84);
  assert.equal(c.referenceBasis, "settled-close");
  assert.equal(c.source, "SentiSense");
  assert.equal(c.asOf, "2026-11-13T23:37:41Z");
  assert.equal(c.analysts, 19);
  assert.deepEqual(r.evidence, before);
});

test("invalid independent evidence falls back atomically to EOD mean, source and date", () => {
  for (const mutate of [
    (t) => (t.symbol = "BRK.B"),
    (t) => (t.currency = "EUR"),
    (t) => (t.updatedAt = "2020-01-01T00:00:00Z"),
    (t) => (t.high = 10),
    (t) => (t.low = null),
  ]) {
    const r = research();
    r.analystTargets = normalized();
    mutate(r.analystTargets);
    const c = consensusOutlook(r);
    assert.equal(c.target, 40);
    assert.equal(c.source, "EODHD");
    assert.equal(c.asOf, "2026-11-13");
    assert.equal(c.low, undefined);
    assert.equal(c.high, undefined);
    assert.equal(c.analysts, null);
  }
});

test("owner projection retains optional targets but never returns them to a nonowner, even with access enforcement disabled", () => {
  const r = research();
  r.analystTargets = normalized();
  for (const enabled of [true, false]) {
    const owner = resolveAccess({
      enabled,
      owner: true,
      licensed: true,
      now: new Date(now).toISOString(),
    });
    assert.equal(projectResearch(r, owner).analystTargets, r.analystTargets);
    const other = resolveAccess({
      enabled,
      owner: false,
      licensed: true,
      now: new Date(now).toISOString(),
    });
    assert.equal(projectResearch(r, other).analystTargets, undefined);
    assert.ok(r.analystTargets);
  }
});

test("an explicit target currency cannot contradict the matching listing profile", () => {
  normalized();
  const c = consensus();
  c.data.currency = "EUR";
  assert.equal(api.normalizeSentiSenseTargets(c, profile(), "IREN", now), null);
  c.data.currency = "usd";
  assert.ok(api.normalizeSentiSenseTargets(c, profile(), "IREN", now));
});

test("visit snapshots keep target provider and refresh separate from financial dataset metadata", () => {
  const r = research();
  r.analystTargets = normalized();
  r.evidence.updatedAt = "2020-01-01";
  const snapshot = researchVisitSnapshot(r, null, now);
  assert.deepEqual(snapshot.targetDataset, {
    source: "SentiSense",
    date: "2026-11-13T23:37:41Z",
  });
  assert.deepEqual(snapshot.dataset, { source: "EODHD", date: "2020-01-01" });
  assert.equal(snapshot.target, 56.6874);
});
