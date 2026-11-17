import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs
  .readFileSync(new URL("../lib/alpaca-options.ts", import.meta.url), "utf8")
  .replace(
    "'./options-analysis'",
    JSON.stringify(new URL("../lib/options-analysis.ts", import.meta.url).href),
  )
  .replace(
    '"./options-analysis"',
    JSON.stringify(new URL("../lib/options-analysis.ts", import.meta.url).href),
  );
const { joinAlpacaOptions, alpacaOptions } = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
);
const id = "APP280121C00100000",
  now = Date.parse("2026-10-23T18:00:00Z");
const snap = {
  [id]: {
    latestQuote: { t: "2026-10-22T20:00:00Z", bp: 10, ap: 11 },
    latestTrade: { t: "2026-10-23T15:00:00Z", s: 5 },
    greeks: { gamma: 0.02, delta: 0.5 },
    impliedVolatility: 0.4,
  },
};
test("Alpaca joins dated open interest without treating trade size as volume", () => {
  const [c] = joinAlpacaOptions(
    snap,
    [
      {
        symbol: id,
        open_interest: "200",
        open_interest_date: "2026-10-22",
        size: "100",
      },
    ],
    now,
  );
  assert.equal(c.oi, 200);
  assert.equal(c.volume, null);
  assert.equal(c.observed, "2026-10-22");
  assert.equal(c.gamma, 0.02);
  assert.equal(c.strike, 100);
});
test("Alpaca withholds stale or absent OI and excludes adjusted contract sizing", () => {
  assert.equal(joinAlpacaOptions(snap, [], now)[0].oi, null);
  assert.equal(
    joinAlpacaOptions(
      snap,
      [
        {
          symbol: id,
          open_interest: 200,
          open_interest_date: "2026-10-01",
          size: 10,
        },
      ],
      now,
    )[0].standard,
    false,
  );
  assert.equal(
    joinAlpacaOptions(
      snap,
      [{ symbol: id, open_interest: 200, open_interest_date: "2026-10-01" }],
      now,
    )[0].oi,
    null,
  );
});
test("excluded Alpaca adapter makes no network request even with configured credentials", async () => {
  const old = globalThis.fetch;
  const oldKey = process.env.ALPACA_PAPER_API_KEY,
    oldSecret = process.env.ALPACA_PAPER_API_SECRET;
  process.env.ALPACA_PAPER_API_KEY = "synthetic-key";
  process.env.ALPACA_PAPER_API_SECRET = "synthetic-secret";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("Excluded source contacted");
  };
  try {
    await assert.rejects(
      alpacaOptions("APP", null),
      /disabled|EODHD|SentiSense/i,
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = old;
    if (oldKey === undefined) delete process.env.ALPACA_PAPER_API_KEY;
    else process.env.ALPACA_PAPER_API_KEY = oldKey;
    if (oldSecret === undefined) delete process.env.ALPACA_PAPER_API_SECRET;
    else process.env.ALPACA_PAPER_API_SECRET = oldSecret;
  }
});
