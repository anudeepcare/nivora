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
  assert.equal(c.oiObservedAt, "2026-10-22");
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
test("restored Alpaca adapter requires explicit enabled selection and uses only fixed authenticated read hosts", async () => {
  const oldFetch = globalThis.fetch,
    keys = [
      "ALPACA_PAPER_API_KEY",
      "ALPACA_PAPER_API_SECRET",
      "AURYN_OPTIONS_ENABLED",
      "AURYN_OPTIONS_PROVIDER",
    ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  let calls = [];
  try {
    process.env.ALPACA_PAPER_API_KEY = "synthetic-key";
    process.env.ALPACA_PAPER_API_SECRET = "synthetic-secret";
    process.env.AURYN_OPTIONS_ENABLED = "false";
    process.env.AURYN_OPTIONS_PROVIDER = "alpaca";
    globalThis.fetch = async (url, opts) => {
      calls.push([String(url), opts]);
      const u = new URL(url);
      assert.equal(opts.redirect, "error");
      assert.equal(opts.cache, "no-store");
      assert.equal(opts.headers["APCA-API-SECRET-KEY"], "synthetic-secret");
      assert.ok(!u.search.includes("synthetic"));
      return Response.json(
        u.hostname === "data.alpaca.markets"
          ? {
              snapshots: {
                [id]: {
                  ...snap[id],
                  latestQuote: {
                    ...snap[id].latestQuote,
                    t: new Date().toISOString(),
                  },
                },
              },
              next_page_token: null,
            }
          : {
              option_contracts: [
                {
                  symbol: id,
                  size: "100",
                  open_interest: "200",
                  open_interest_date: new Date().toISOString().slice(0, 10),
                },
              ],
              next_page_token: null,
            },
      );
    };
    await assert.rejects(alpacaOptions("APP", null));
    assert.equal(calls.length, 0);
    process.env.AURYN_OPTIONS_ENABLED = "true";
    const result = await alpacaOptions("APP", null);
    assert.equal(result.contracts[0].gamma, 0.02);
    assert.equal(result.contracts[0].volume, null);
    assert.match(result.frequency, /Indicative/);
    assert.equal(calls.length, 2);
    await alpacaOptions("APP", null);
    assert.equal(calls.length, 2);
    process.env.AURYN_OPTIONS_PROVIDER = "eodhd";
    await assert.rejects(alpacaOptions("APP", null));
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = oldFetch;
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});
test("missing deliverables never imply standard sizing; Greek payload cannot overwrite contract identity", () => {
  const [c] = joinAlpacaOptions(
    {
      [id]: {
        ...snap[id],
        greeks: {
          ...snap[id].greeks,
          contract: "MSFT280121C00100000",
          strike: 999,
          tradetime: "2099-01-01",
        },
      },
    },
    [],
    now,
  );
  assert.equal(c.id, id);
  assert.equal(c.strike, 100);
  assert.equal(c.observed, "2026-10-22");
  assert.equal(c.standard, false);
  assert.equal(c.multiplier, 0);
});
test("provider transport errors sanitized and wrong-root rows rejected before cache publication", async () => {
  const keys = [
    "AURYN_OPTIONS_ENABLED",
    "AURYN_OPTIONS_PROVIDER",
    "ALPACA_PAPER_API_KEY",
    "ALPACA_PAPER_API_SECRET",
  ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]])),
    old = globalThis.fetch;
  try {
    process.env.AURYN_OPTIONS_ENABLED = "true";
    process.env.AURYN_OPTIONS_PROVIDER = "alpaca";
    process.env.ALPACA_PAPER_API_KEY = "synthetic-other";
    process.env.ALPACA_PAPER_API_SECRET = "synthetic-secret";
    globalThis.fetch = async () => {
      throw Error("https://secret.private/?token=HIDDEN");
    };
    await assert.rejects(
      alpacaOptions("MSFT", null),
      (e) => !e.message.includes("HIDDEN"),
    );
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ snapshots: snap, next_page_token: null });
    };
    await assert.rejects(alpacaOptions("MSFT", null), /identities/);
    await assert.rejects(alpacaOptions("MSFT", null), /identities/);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = old;
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});
test("only explicit matching ordinary deliverable permits100share sizing; missing/mixed/cash proof withheld", () => {
  const meta = {
    symbol: id,
    underlying_symbol: "APP",
    underlying_asset_id: "asset-synthetic",
    size: "100",
    multiplier: "100",
    deliverables: [
      {
        type: "equity",
        symbol: "APP",
        asset_id: "asset-synthetic",
        amount: "100",
        allocation_percentage: "100",
        delayed_settlement: false,
        settlement_method: "CCC",
        settlement_type: "T+1",
      },
    ],
  };
  assert.equal(joinAlpacaOptions(snap, [meta], now)[0].standard, true);
  for (const change of [
    { multiplier: undefined },
    { deliverables: [] },
    { underlying_asset_id: "wrong" },
    { deliverables: [{ ...meta.deliverables[0], amount: "0" }] },
    { deliverables: [{ ...meta.deliverables[0], type: "cash" }] },
  ])
    assert.equal(
      joinAlpacaOptions(snap, [{ ...meta, ...change }], now)[0].standard,
      false,
    );
});
test("Alpaca numeric leaves reject arrays booleans invalid domains while retaining valid put delta and theta", () => {
  const bad = joinAlpacaOptions(
    {
      [id]: {
        ...snap[id],
        latestQuote: { ...snap[id].latestQuote, bp: true, ap: [11] },
        greeks: { delta: 20, gamma: [0.2], vega: -5, theta: -0.1 },
        impliedVolatility: "0.4",
      },
    },
    [],
    now,
  )[0];
  assert.equal(bad.bid, null);
  assert.equal(bad.ask, null);
  assert.equal(bad.delta, null);
  assert.equal(bad.gamma, null);
  assert.equal(bad.vega, null);
  assert.equal(bad.iv, null);
  assert.equal(bad.theta, -0.1);
  const put = id.replace("C001", "P001");
  const c = joinAlpacaOptions(
    {
      [put]: {
        ...snap[id],
        greeks: { delta: -0.5, gamma: 0.2, theta: -0.1, vega: 0.4 },
      },
    },
    [],
    now,
  )[0];
  assert.equal(c.delta, -0.5);
  assert.equal(c.vega, 0.4);
  assert.equal(
    joinAlpacaOptions(
      { [id]: { ...snap[id], greeks: { delta: -0.5 } } },
      [],
      now,
    )[0].delta,
    null,
  );
});
