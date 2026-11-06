import test from "node:test";
import assert from "node:assert/strict";
import {
  newSimulationLedger,
  openSimulation,
  closeSimulation,
  simulationSummary,
  cleanSimulationLedger,
  simulationQuoteIssue,
} from "../lib/options-simulation.ts";
const now = Date.parse("2026-11-05T15:00:00Z");
const contract = {
  id: "AAPL261218C00200000",
  type: "call",
  strike: 200,
  expiry: "2026-12-18",
  observed: "2026-11-05",
  bid: 4,
  ask: 5,
  oi: 100,
  volume: 10,
  iv: 0.3,
  delta: 0.5,
  gamma: 0.01,
  theta: -0.02,
  vega: 0.1,
  multiplier: 100,
  standard: true,
};
const open = (quantity = 2, c = contract) =>
  openSimulation(
    newSimulationLedger(),
    { contract: c, symbol: "AAPL", quantity, notes: "Thesis" },
    now,
  );
test("simulation starts with cash and opens fully paid standard long options at ask", () => {
  const x = open();
  assert.equal(x.cash, 99000);
  assert.equal(x.positions[0].entryPremium, 5);
  assert.equal(x.positions[0].remaining, 2);
  assert.deepEqual(x.positions[0].contract, contract);
  assert.equal(newSimulationLedger().cash, 100000);
});
test("partial exits use matching current bid and realize only closed quantity", () => {
  let x = open();
  x = closeSimulation(
    x,
    x.positions[0].id,
    1,
    { ...contract, bid: 7, ask: 8 },
    now,
  );
  assert.equal(x.cash, 99700);
  assert.equal(x.positions[0].remaining, 1);
  let s = simulationSummary(x, [{ ...contract, bid: 6, ask: 7 }], now);
  assert.equal(s.realized, 200);
  assert.equal(s.marked, 100);
  assert.equal(s.winRate, null);
  assert.equal(s.equity, 100300);
  x = closeSimulation(
    x,
    x.positions[0].id,
    1,
    { ...contract, bid: 3, ask: 4 },
    now,
  );
  s = simulationSummary(x, [], now);
  assert.equal(s.realized, 0);
  assert.equal(s.marked, 0);
  assert.equal(s.winRate, 0);
  assert.equal(s.closedPositions, 1);
});
test("stale, future, malformed, mismatched and expired quotes cannot transact or create marks", () => {
  for (const patch of [
    { observed: "2026-11-01" },
    { observed: "2026-11-06" },
    { observed: "2026-02-30" },
    { observed: "2026-11-05T16:00:00Z" },
    { standard: false },
    { multiplier: 10 },
    { ask: 3, bid: 4 },
    { expiry: "2026-11-04" },
  ])
    assert.throws(() => open(1, { ...contract, ...patch }));
  const x = open();
  assert.throws(() =>
    closeSimulation(x, x.positions[0].id, 1, { ...contract, id: "other" }, now),
  );
  const s = simulationSummary(
    x,
    [{ ...contract, observed: "2026-11-01" }],
    now,
  );
  assert.equal(s.marked, null);
  assert.equal(s.equity, null);
  assert.equal(s.unpriced, 1);
  assert.equal(
    simulationQuoteIssue({ ...contract, observed: "2026-11-02" }, now),
    null,
  );
});
test("invalid quantities, insufficient cash and oversized notes are rejected without mutating input", () => {
  for (const q of [0, -1, 1.1, 101, NaN]) assert.throws(() => open(q));
  assert.throws(() => open(100, { ...contract, ask: 11, bid: 10 }));
  const x = open();
  assert.throws(() => closeSimulation(x, x.positions[0].id, 3, contract, now));
  assert.equal(x.positions[0].remaining, 2);
  assert.throws(() =>
    openSimulation(
      x,
      { contract, symbol: "AAPL", quantity: 1, notes: "x".repeat(501) },
      now,
    ),
  );
});
test("cleaner round trips bounded snapshots and rejects tampered balances and quantities", () => {
  const x = open();
  assert.deepEqual(cleanSimulationLedger(JSON.parse(JSON.stringify(x))), x);
  for (const change of [
    { cash: 123 },
    { positions: [{ ...x.positions[0], remaining: 100 }] },
    { initialCash: 500000 },
    { version: 2 },
  ])
    assert.equal(cleanSimulationLedger({ ...x, ...change }), null);
  assert.equal(cleanSimulationLedger({}), null);
  assert.equal(cleanSimulationLedger("x".repeat(20001)), null);
});
test("identity fields cannot contradict the OCC contract and saved records cannot be future dated", () => {
  for (const patch of [
    { type: "put" },
    { strike: 201 },
    { expiry: "2026-12-19" },
  ])
    assert.throws(() => open(1, { ...contract, ...patch }));
  const x = open();
  assert.equal(
    cleanSimulationLedger({
      ...x,
      positions: [{ ...x.positions[0], openedAt: "2099-01-01T00:00:00Z" }],
    }),
    null,
  );
});
test("the bounded wallet rejects a sixteenth position and oversized serialized restores", () => {
  let x = newSimulationLedger();
  for (let i = 0; i < 15; i++)
    x = openSimulation(
      x,
      { contract, symbol: "AAPL", quantity: 1, notes: "" },
      now + i,
    );
  assert.throws(
    () =>
      openSimulation(
        x,
        { contract, symbol: "AAPL", quantity: 1, notes: "" },
        now + 16,
      ),
    /limit/,
  );
  assert.equal(x.positions.length, 15);
  assert.equal(
    cleanSimulationLedger({ ...open(), padding: "x".repeat(19000) }),
    null,
  );
});
