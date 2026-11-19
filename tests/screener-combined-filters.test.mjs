import test from "node:test";
import assert from "node:assert/strict";
import { screenInput } from "../lib/stock-screener.ts";
import { etfScreenInput } from "../lib/etf-screener.ts";
for (const [name, parse, first, second] of [
  [
    "stock",
    screenInput,
    { field: "ANALYST_TARGET_UPSIDE_PCT", op: "GTE", value: 10 },
    { field: "ANALYST_COUNT", op: "GTE", value: 5 },
  ],
  [
    "ETF",
    etfScreenInput,
    { field: "EXPENSE_RATIO", op: "LTE", value: 0.1 },
    { field: "WEIGHT_COVERED_PCT", op: "GTE", value: 80 },
  ],
])
  test(
    name +
      " supports exactly two validated AND conditions, preserves units and rejects extra nesting",
    () => {
      assert.deepEqual(parse({ ...first, second }), { ...first, second });
      for (const invalid of [
        null,
        [],
        { ...second, second },
        { ...second, op: "OR" },
        { ...second, url: "https://evil" },
        { ...second, value: NaN },
      ])
        assert.equal(parse({ ...first, second: invalid }), null);
      assert.equal(
        parse({ ...first, second: { ...first, value: first.value + 1 } }),
        null,
        "duplicate same-direction condition rejected",
      );
    },
  );
test("same-field range rejects contradictory lower and upper bound but accepts equality", () => {
  assert.equal(
    screenInput({
      field: "PRICE",
      op: "GTE",
      value: 20,
      second: { field: "PRICE", op: "LTE", value: 10 },
    }),
    null,
  );
  assert.ok(
    screenInput({
      field: "PRICE",
      op: "GTE",
      value: 20,
      second: { field: "PRICE", op: "LTE", value: 20 },
    }),
  );
});
import fs from "node:fs";
test("both active screeners expose optional AND condition and disclose applied second filter", () => {
  for (const file of [
    "components/StockScreener.tsx",
    "components/EtfScreener.tsx",
  ]) {
    const s = fs.readFileSync(file, "utf8");
    assert.match(s, /Add another condition/);
    assert.match(s, /result\.screen\.second/);
    assert.match(s, /secondThreshold\.trim\(\)/);
  }
});
