import test from "node:test";
import assert from "node:assert/strict";
import { consensusOutlook } from "../lib/outlook.ts";

// User-provided November 11 screenshots; fixture observations, not live feed values.
const examples = [
  {
    symbol: "NFLX",
    close: 64.54,
    quote: 64.3,
    low: 57,
    target: 84.76,
    high: 126,
    percentages: [-12, 31, 95],
  },
  {
    symbol: "IREN",
    close: 20.84,
    quote: 21,
    low: 23,
    target: 56.69,
    high: 139,
    percentages: [10, 172, 567],
  },
  {
    symbol: "NBIS",
    close: 154.69,
    quote: 148.45,
    low: 84,
    target: 278.05,
    high: 410,
    percentages: [-46, 80, 165],
  },
  {
    symbol: "NOW",
    close: 102.76,
    quote: 103,
    low: 72,
    target: 155.82,
    high: 266,
    percentages: [-30, 52, 159],
  },
];
for (const x of examples)
  test(`${x.symbol} analyst targets use settled close despite a later quote`, () => {
    const r = {
      company: {
        symbol: x.symbol,
        assetType: "stock",
        currency: "USD",
        exchange: "NASDAQ",
      },
      quote: {
        price: x.quote,
        currency: "USD",
        stale: false,
        asOf: "2026-11-11T23:00:00Z",
      },
      retrievedAt: "2026-11-12T01:00:00Z",
      history: [
        {
          time: "2026-11-11",
          open: x.close,
          high: x.close,
          low: x.close,
          close: x.close,
          volume: 100,
        },
      ],
      evidence: {
        updatedAt: "2026-11-11",
        consensus: { low: x.low, target: x.target, high: x.high },
      },
    };
    const c = consensusOutlook(r);
    assert.ok(c);
    assert.equal(c.referencePrice, x.close);
    assert.equal(c.referenceBasis, "settled-close");
    assert.equal(c.referenceAsOf, "2026-11-11");
    assert.deepEqual([c.low, c.target, c.high], [x.low, x.target, x.high]);
    assert.deepEqual(
      [c.low, c.target, c.high].map((t) =>
        Math.round((t / c.referencePrice - 1) * 100),
      ),
      x.percentages,
    );
    assert.equal(Math.round(c.change), x.percentages[1]);
  });
