import test from "node:test";
import assert from "node:assert/strict";
import { accountHistory } from "../lib/account-history.ts";
const row = (id, type, extra = {}) => ({
  id,
  type,
  date: "2026-01-01",
  account: "Main",
  symbol: "",
  quantity: 0,
  price: 0,
  amount: 0,
  fee: 0,
  currency: "USD",
  ...extra,
});
const rows = [
  row("deposit", "deposit", { amount: 1000 }),
  row("buy", "buy", { symbol: "APP", quantity: 5, price: 100 }),
];
const now = Date.parse("2026-01-04T12:00:00Z");
const read = async (path) =>
  path.startsWith("fundamentals")
    ? { Code: "APP", CurrencyCode: "USD" }
    : path.startsWith("splits")
      ? []
      : [
          { date: "2026-01-02", close: 110, adjusted_close: 1 },
          { date: "2026-01-03", close: 120, adjusted_close: 1 },
        ];
test("replays saved inception quantities using raw not adjusted prices", async () => {
  const r = await accountHistory(rows, true, read, now);
  assert.equal(r.status, "available");
  assert.equal(r.points.at(-1).equity, 1100);
  assert.equal(r.points.at(-1).gain, 100);
  assert.equal(r.ledgerCompleteness, "user-confirmed");
});
test("requires explicit completeness, currency and full split evidence", async () => {
  await assert.rejects(accountHistory(rows, false, read, now));
  await assert.rejects(
    accountHistory(
      rows,
      true,
      async (p) =>
        p.startsWith("fundamentals")
          ? { Code: "APP", CurrencyCode: "CAD" }
          : read(p),
      now,
    ),
  );
  await assert.rejects(
    accountHistory(
      rows,
      true,
      async (p) => (p.startsWith("splits") ? null : read(p)),
      now,
    ),
  );
});
test("unrecorded split fails closed and leaves no chart points", async () => {
  const r = await accountHistory(
    rows,
    true,
    async (p) =>
      p.startsWith("splits") ? [{ date: "2026-01-02", split: "2/1" }] : read(p),
    now,
  );
  assert.equal(r.status, "unavailable");
  assert.deepEqual(r.points, []);
});
test("caps are explicit and fail before any provider requests, never partial history", async () => {
  let calls = 0;
  const provider = async () => {
    calls++;
    return [];
  };
  const many = [
    rows[0],
    ...Array.from({ length: 11 }, (_, i) =>
      row("b" + i, "buy", { symbol: "A" + i, quantity: 1, price: 1 }),
    ),
  ];
  await assert.rejects(accountHistory(many, true, provider, now), /up to ten/);
  await assert.rejects(
    accountHistory(rows, true, provider, Date.parse("2027-03-01")),
    /one year/,
  );
  assert.equal(calls, 0);
});
test("rejects negative cash after last available price before any provider fanout", async () => {
  let calls = 0;
  const late = [
    ...rows,
    row("withdraw", "withdrawal", { date: "2026-01-03", amount: 5000 }),
  ];
  await assert.rejects(
    accountHistory(
      late,
      true,
      async (p) => {
        calls++;
        return read(p);
      },
      Date.parse("2026-01-05"),
    ),
    /Ledger reconciliation failed on 2026-01-03/,
  );
  assert.equal(calls, 0);
});
test("rejects otherwise valid transactions beyond last valuation rather than omitting activity", async () => {
  const late = [
    ...rows,
    row("deposit2", "deposit", { date: "2026-01-03", amount: 100 }),
  ];
  await assert.rejects(
    accountHistory(
      late,
      true,
      async (p) =>
        p.startsWith("eod/") ? [{ date: "2026-01-02", close: 110 }] : read(p),
      now,
    ),
    /extend beyond the last available valuation/,
  );
});
test("reports requested evidence end separately from actual last priced valuation", async () => {
  const result = await accountHistory(
    rows,
    true,
    read,
    Date.parse("2026-01-05"),
  );
  assert.equal(result.requestedThrough, "2026-01-04");
  assert.equal(result.lastValuationDate, "2026-01-03");
});

test("cash-only history retains every dated cash event rather than only endpoints", async () => {
  const cashRows = [
    row("initial", "deposit", { date: "2026-01-02", amount: 1000 }),
    row("add", "deposit", { date: "2026-01-05", amount: 500 }),
    row("take", "withdrawal", { date: "2026-01-06", amount: 200 }),
  ];
  const result = await accountHistory(
    cashRows,
    true,
    async (path) =>
      path.startsWith("fundamentals/")
        ? {
            Code: path.includes("SPY") ? "SPY" : "QQQ",
            CurrencyCode: "USD",
            Type: "ETF",
          }
        : [
            { date: "2026-01-02", adjusted_close: 100 },
            { date: "2026-01-05", adjusted_close: 110 },
            { date: "2026-01-06", adjusted_close: 120 },
            { date: "2026-01-07", adjusted_close: 121 },
          ],
    Date.parse("2026-01-08T12:00:00Z"),
  );
  assert.deepEqual(
    result.points.map((p) => [p.date, p.equity, p.netContributions, p.gain]),
    [
      ["2026-01-02", 1000, 1000, 0],
      ["2026-01-05", 1500, 1500, 0],
      ["2026-01-06", 1300, 1300, 0],
      ["2026-01-07", 1300, 1300, 0],
    ],
  );
  assert.ok(
    result.benchmarks.every(
      (b) => b.status === "available" && b.points.length === 4,
    ),
  );
});
