import { optionsPositioning } from "../lib/options-positioning.ts";
import test from "node:test";
import assert from "node:assert/strict";
test("positioning preserves genuine zero and missing metrics without inferring direction", async () => {
  const { optionsPositioning } = await import("../lib/options-positioning.ts");
  const p = optionsPositioning({
    asOf: "2026-11-16",
    latest: { callVol: 0, putVol: 200, atmIv: 0.42, pcVol: null },
    sentiment: 0.99,
  });
  assert.equal(p.callShare, 0);
  assert.equal(p.metrics.atmIv, 42);
  assert.equal(p.metrics.pcVol, null);
  assert.equal(
    optionsPositioning({ latest: { callVol: 0, putVol: 0 } }).callShare,
    null,
  );
  assert.equal(
    optionsPositioning({ latest: { callVol: "10", putVol: 20 } }).callShare,
    null,
  );
  assert.doesNotMatch(JSON.stringify(p), /sentiment|bullish/);
});
test("reported-contract map keeps only actual dated unambiguous contracts, never fills strikes", async () => {
  const { optionsPositioning } = await import("../lib/options-positioning.ts");
  const one = {
    contract: "ABC",
    expiry: "2026-12-18",
    type: "call",
    strike: 100,
    volume: 80,
    oi: null,
  };
  const p = optionsPositioning({
    unusual: [
      one,
      { ...one, contract: "XYZ", strike: 120, volume: 0 },
      { ...one, contract: "bad", expiry: "2026-02-30" },
    ],
  });
  assert.equal(p.contracts.length, 2);
  assert.equal(p.contracts[0].oi, null);
  assert.equal(p.contracts[1].volume, 0);
  assert.equal(p.omitted, 1);
  assert.equal(optionsPositioning({ unusual: [one, one] }).contracts.length, 0);
  assert.equal(
    optionsPositioning({ unusual: [{ ...one, type: "bullish" }] }).contracts
      .length,
    0,
  );
});
test("overview renders metric units and subset disclaimer, never a synthetic chain for empty data", async () => {
  const fs = await import("node:fs");
  const React = await import("react");
  const jsx = await import("react/jsx-runtime");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ts = (await import("typescript")).default;
  const icons = await import("lucide-react");
  const logic = await import("../lib/options-positioning.ts");
  const format = await import("../lib/format.ts");
  const source = ts.transpileModule(
    fs.readFileSync("components/OptionsPositioningOverview.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name === "react") return React;
      if (name === "lucide-react") return icons;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/options-positioning") return logic;
      if (name === "@/lib/format") return format;
      if (name.endsWith(".module.css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const render = (data) =>
    renderToStaticMarkup(React.createElement(mod.exports.default, { data }));
  const html = render({
    asOf: "2026-11-16",
    latest: { atmIv: 0.42, callVol: 100, putVol: 300, pcVol: 3 },
    unusual: [
      {
        contract: "TEST",
        expiry: "2026-12-18",
        type: "call",
        strike: 100,
        volume: 80,
        oi: 20,
      },
    ],
  });
  assert.match(html, /42%/);
  assert.match(html, /Calls 25.0%, puts 75.0%/);
  assert.match(html, /not a full option chain/);
  assert.match(html, /Contract activity list/);
  const empty = render({});
  assert.match(empty, /No dated, unambiguous contract observations/);
  assert.doesNotMatch(empty, /role="img"|Contract activity list/);
});
test("open-interest walls preserve dated strike evidence, not synthetic gamma", async () => {
  const { optionsPositioning } = await import("../lib/options-positioning.ts");
  const p = optionsPositioning({
    oiWalls: {
      expiry: "2026-12-18",
      maxPain: 100,
      callWalls: [
        { strike: 110, oi: 30 },
        { strike: 0, oi: 20 },
      ],
      putWalls: [
        { strike: 90, oi: 0 },
        { strike: 80, oi: -1 },
      ],
      totalCallOi: 200,
      totalPutOi: 100,
    },
  });
  assert.deepEqual(p.walls.rows, [
    { strike: 90, oi: 0, side: "Put" },
    { strike: 110, oi: 30, side: "Call" },
  ]);
  assert.equal(p.walls.expiry, "2026-12-18");
  assert.equal(p.walls.maxPain, 100);
  assert.equal(
    optionsPositioning({
      oiWalls: { expiry: "invalid", callWalls: [{ strike: 10, oi: 1 }] },
    }).walls.rows.length,
    0,
  );
  assert.doesNotMatch(JSON.stringify(p), /gamma|gex|conviction/i);
});

test("large print summary reads root aggregate fields, keeps zero distinct and does not borrow dates", () => {
  assert.deepEqual(optionsPositioning({ largePrintCount: 0 }).prints, {
    count: 0,
    percentile: null,
  });
  assert.deepEqual(
    optionsPositioning({
      largePrintCount: 4,
      largestPrintPctl: 88,
      asOf: "2026-11-18",
    }).prints,
    { count: 4, percentile: 88 },
  );
  assert.deepEqual(
    optionsPositioning({ latest: { largePrintCount: 9, largestPrintPctl: 99 } })
      .prints,
    { count: null, percentile: null },
  );
  for (const value of [
    -1,
    1.5,
    [4],
    true,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.equal(
      optionsPositioning({ largePrintCount: value }).prints.count,
      null,
    );
  for (const value of [-1, 101, [88], true, Infinity])
    assert.equal(
      optionsPositioning({ largestPrintPctl: value }).prints.percentile,
      null,
    );
  assert.equal(
    optionsPositioning({ largestPrintPctl: 0 }).prints.percentile,
    0,
  );
  assert.equal(
    optionsPositioning({ largePrintCount: 0, largestPrintPctl: 88 }).prints
      .percentile,
    null,
  );
});
