import test from "node:test";
import assert from "node:assert/strict";
import {
  listedExpiries,
  leapsExpiry,
  displayedContracts,
} from "../lib/options-presentation.ts";
test("expiry choices come from listed contracts and long-term selection advances beyond front expiry", () => {
  const dates = listedExpiries([
    { expiry: "2026-10-23" },
    { expiry: "2028-01-21" },
    { expiry: "2026-10-23" },
  ]);
  assert.deepEqual(dates, ["2026-10-23", "2028-01-21"]);
  assert.equal(
    leapsExpiry(dates, Date.parse("2026-10-23T18:00Z")),
    "2028-01-21",
  );
  assert.equal(
    leapsExpiry(["2026-10-30"], Date.parse("2026-10-23T18:00Z")),
    null,
  );
});
test("chain does not silently discard contracts without open interest unless liquidity-only is requested", () => {
  const c = [
    { type: "call", oi: null },
    { type: "put", oi: 200 },
  ];
  assert.equal(
    displayedContracts(c, "all", false, (x) => x.oi > 100).length,
    2,
  );
  assert.equal(displayedContracts(c, "all", true, (x) => x.oi > 100).length, 1);
  assert.equal(displayedContracts(c, "call", false, () => false).length, 1);
});
test("raw latest expiry snapshot keeps nonstandard records visible without enabling their analytics", async () => {
  const { contractSnapshotRows } = await import(
    "../lib/options-presentation.ts"
  );
  const rows = [
    {
      id: "old",
      expiry: "2026-12-18",
      observed: "2026-11-16",
      standard: false,
    },
    {
      id: "new",
      expiry: "2026-12-18",
      observed: "2026-11-17",
      standard: false,
    },
    { id: "other", expiry: "2027-01-15", observed: "2026-11-18" },
  ];
  assert.deepEqual(contractSnapshotRows(rows, "2026-12-18"), [rows[1]]);
});
test("refreshed expiry replaces removed contracts, empty response clears scope, other expiries preserved", async () => {
  const { replaceChainSnapshot } = await import(
    "../lib/options-presentation.ts"
  );
  const old = [
      { id: "old", expiry: "2026-12-18" },
      { id: "kept", expiry: "2027-01-15" },
    ],
    fresh = [{ id: "new", expiry: "2026-12-18" }];
  assert.deepEqual(replaceChainSnapshot(old, fresh, "2026-12-18"), [
    old[1],
    fresh[0],
  ]);
  assert.deepEqual(replaceChainSnapshot(old, [], "2026-12-18"), [old[1]]);
  assert.deepEqual(replaceChainSnapshot(old, [], null), []);
  assert.equal(old.length, 2);
});
test("options quote basis preserves supplied timestamp and never creates midnight for date-only observations", async () => {
  const { optionsObservationTime } = await import(
    "../lib/options-presentation.ts"
  );
  assert.equal(
    optionsObservationTime("2026-11-17T15:42:31-05:00"),
    "2026-11-17 20:42:31 UTC",
  );
  assert.equal(
    optionsObservationTime("2026-11-17"),
    "2026-11-17 · time not supplied",
  );
  for (const value of [null, "bad", "2026-02-30", "2026-11-17T15:42:31"])
    assert.equal(
      optionsObservationTime(value),
      "Observation time not supplied",
    );
});
