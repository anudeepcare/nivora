import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistoryJob,
  advanceHistoryJob,
} from "../lib/account-history-job.ts";
const now = Date.parse("2026-01-04T12:00:00Z");
const tx = (id, type, extra = {}) => ({
  id,
  type,
  date: "2026-01-01",
  account: "A",
  symbol: "",
  quantity: 0,
  price: 0,
  amount: 0,
  fee: 0,
  currency: "USD",
  ...extra,
});
const symbols = Array.from(
  { length: 28 },
  (_, i) => "T" + String.fromCharCode(65 + (i % 26)) + (i < 26 ? "A" : "B"),
);
const rows = [
  tx("deposit", "deposit", { amount: 100000 }),
  ...symbols.map((symbol, i) =>
    tx("b" + i, "buy", { symbol, quantity: 1, price: 100 }),
  ),
];
const reader = async (path) =>
  path.startsWith("fundamentals/")
    ? {
        Code: path.split("/")[1].split(".")[0],
        CurrencyCode: "USD",
        Type: "ETF",
      }
    : path.startsWith("splits/")
      ? []
      : [
          { date: "2026-01-01", close: 100, adjusted_close: 100 },
          { date: "2026-01-02", close: 101, adjusted_close: 101 },
        ];
test("28 holdings stage in bounded batches, resume with no reads repeated, never publish partial", async () => {
  let state = createHistoryJob(rows, now);
  assert.equal(state.tasks.length, 88);
  let calls = 0,
    result = null;
  for (let step = 0; step < 50 && !result; step++) {
    const before = calls;
    const out = await advanceHistoryJob(
      rows,
      JSON.parse(JSON.stringify(state)),
      async (...args) => {
        calls++;
        return reader(...args);
      },
    );
    assert.ok(calls - before <= 2);
    state = out.state;
    result = out.result;
    if (state.tasks.some((t) => !t.done)) assert.equal(result, null);
  }
  assert.equal(calls, 88);
  assert.equal(result.status, "available");
  assert.equal(result.points.at(-1).equity, 100028);
});
test("reject unsupported scope and bad ledger before any provider reads", () => {
  assert.throws(
    () =>
      createHistoryJob(
        [
          ...rows,
          tx("over", "sell", { symbol: symbols[0], quantity: 2, price: 100 }),
        ],
        now,
      ),
    /reconciliation/,
  );
  assert.throws(
    () => createHistoryJob(rows, Date.parse("2027-02-01")),
    /one year/,
  );
});
test("failed mandatory task stays pending; successful sibling survives retry", async () => {
  const job = createHistoryJob(rows, now);
  const out = await advanceHistoryJob(rows, job, async (path) => {
    if (path.startsWith("eod/")) throw Error("private");
    return reader(path);
  });
  assert.equal(out.result, null);
  assert.equal(out.state.tasks.filter((t) => t.done).length, 1);
  assert.equal(out.retry, true);
  assert.ok(!JSON.stringify(out).includes("private"));
});
test("reject same-revision changed ledger before provider calls", async () => {
  const state = createHistoryJob(rows, now);
  const changed = structuredClone(rows);
  changed[0].amount++;
  await assert.rejects(
    advanceHistoryJob(changed, state, () => assert.fail("no provider work")),
    /does not match/,
  );
});
test("whole-window optional benchmark failure does not suppress valid actual portfolio", async () => {
  let state = createHistoryJob(rows, now),
    result;
  for (let step = 0; step < 50 && !result; step++) {
    const out = await advanceHistoryJob(rows, state, async (path) => {
      if (path.includes("QQQ.")) throw Error("secret");
      return reader(path);
    });
    state = out.state;
    result = out.result;
  }
  assert.equal(result.status, "available");
  assert.equal(
    result.benchmarks.find((b) => b.symbol === "QQQ").status,
    "unavailable",
  );
  assert.ok(!JSON.stringify(result).includes("secret"));
});
test("50 instruments supported but 51 rejected; sold historical instruments remain in manifest", () => {
  const many = [
    rows[0],
    ...Array.from({ length: 50 }, (_, i) =>
      tx("n" + i, "buy", { symbol: "S" + i, quantity: 1, price: 1 }),
    ),
  ];
  assert.equal(createHistoryJob(many, now).tasks.length, 154);
  assert.throws(
    () =>
      createHistoryJob(
        [
          ...many,
          tx("extra", "buy", { symbol: "EXTRA", quantity: 1, price: 1 }),
        ],
        now,
      ),
    /50/,
  );
  const sold = [
    ...rows,
    tx("sold", "sell", { symbol: symbols[0], quantity: 1, price: 100 }),
  ];
  assert.ok(
    createHistoryJob(sold, now).tasks.some(
      (t) => t.path === `eod/${symbols[0]}.US`,
    ),
  );
});
test("invalid final evidence publishes a terminal unavailable result rather than locking and refetching", async () => {
  let state = createHistoryJob(rows, now),
    result;
  for (let step = 0; step < 50 && !result; step++) {
    const out = await advanceHistoryJob(rows, state, async (path) =>
      path === `fundamentals/${symbols[0]}.US`
        ? { Code: "WRONG", CurrencyCode: "USD" }
        : reader(path),
    );
    state = out.state;
    result = out.result;
  }
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.points, []);
  assert.ok(state.tasks.every((t) => t.done));
});
