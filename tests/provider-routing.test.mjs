import test from "node:test";
import assert from "node:assert/strict";
import {
  preferredMarketSources,
  readPreferred,
} from "../lib/provider-routing.ts";
test("both subscriptions have separate jobs with one fallback, not duplicate requests", async () => {
  const both = { twelve: true, eodhd: true };
  assert.deepEqual(preferredMarketSources("quote", both), ["twelve", "eodhd"]);
  assert.deepEqual(preferredMarketSources("intraday", both), [
    "twelve",
    "eodhd",
  ]);
  assert.deepEqual(preferredMarketSources("daily", both), ["eodhd", "twelve"]);
  assert.deepEqual(
    preferredMarketSources("daily", { twelve: true, eodhd: false }),
    ["twelve"],
  );
  const calls = [];
  const result = await readPreferred(["twelve", "eodhd"], async (p) => {
    calls.push(p);
    return 123;
  });
  assert.deepEqual(calls, ["twelve"]);
  assert.deepEqual(result, { value: 123, provider: "twelve", fallback: false });
});
test("fallback retains its own provenance and complete value; both failures propagate", async () => {
  const calls = [];
  const result = await readPreferred(["twelve", "eodhd"], async (p) => {
    calls.push(p);
    if (p === "twelve") throw Error("Unavailable");
    return [1, 2];
  });
  assert.deepEqual(result, {
    value: [1, 2],
    provider: "eodhd",
    fallback: true,
  });
  assert.deepEqual(calls, ["twelve", "eodhd"]);
  await assert.rejects(
    readPreferred(["twelve", "eodhd"], async () => {
      throw Error("Unavailable");
    }),
    /Unavailable/,
  );
});
