import test from "node:test";
import assert from "node:assert/strict";
import { accountPerformance } from "../lib/account-performance.ts";
const tx = (id, date, type, extra = {}) => ({
  id,
  date,
  type,
  account: "Main",
  symbol: "",
  quantity: 0,
  price: 0,
  amount: 0,
  fee: 0,
  currency: "USD",
  ...extra,
});
const input = () => ({
  completeFromInception: true,
  through: "2026-01-03",
  dates: ["2026-01-01", "2026-01-02", "2026-01-03"],
  transactions: [
    tx("d", "2026-01-01", "deposit", { amount: 1000 }),
    tx("b", "2026-01-01", "buy", { symbol: "APP", quantity: 5, price: 100 }),
    tx("s", "2026-01-02", "split", { symbol: "APP", quantity: 2 }),
    tx("div", "2026-01-03", "dividend", { symbol: "APP", amount: 10 }),
  ],
  prices: [
    {
      symbol: "APP",
      currency: "USD",
      basis: "unadjusted",
      source: "EODHD",
      from: "2026-01-01",
      through: "2026-01-03",
      splitsComplete: true,
      splits: [{ date: "2026-01-02", ratio: 2 }],
      closes: [
        { date: "2026-01-01", close: 100 },
        { date: "2026-01-02", close: 50 },
        { date: "2026-01-03", close: 55 },
      ],
    },
  ],
});
test("actual ledger quantities plus raw prices keep split neutral and include cash dividends", () => {
  const r = accountPerformance(input());
  assert.equal(r.status, "available");
  assert.deepEqual(
    r.points.map((p) => p.equity),
    [1000, 1000, 1060],
  );
  assert.equal(r.points[2].gain, 60);
  assert.equal(r.returnPct, null);
});
test("fails closed for adjusted prices, incomplete inception or unverified splits", () => {
  for (const mutate of [
    (i) => (i.completeFromInception = false),
    (i) => (i.prices[0].basis = "adjusted"),
    (i) => (i.prices[0].splitsComplete = false),
    (i) => i.transactions.splice(2, 1),
    (i) => i.prices[0].closes.pop(),
  ]) {
    const i = input();
    mutate(i);
    assert.equal(accountPerformance(i).status, "unavailable");
  }
});
test("external deposit is not investment gain and sale proceeds remain cash", () => {
  const i = input();
  i.transactions.push(
    tx("d2", "2026-01-03", "deposit", { amount: 200 }),
    tx("sell", "2026-01-03", "sell", {
      symbol: "APP",
      quantity: 5,
      price: 55,
      fee: 1,
    }),
  );
  const r = accountPerformance(i);
  assert.equal(r.status, "available");
  assert.equal(r.points[2].equity, 1259);
  assert.equal(r.points[2].netContributions, 1200);
  assert.equal(r.points[2].gain, 59);
});
test("ambiguous split-day trading and unsupported borrowing fail closed", () => {
  const i = input();
  i.transactions.push(
    tx("buy2", "2026-01-02", "buy", { symbol: "APP", quantity: 1, price: 50 }),
  );
  assert.equal(accountPerformance(i).status, "unavailable");
  const j = input();
  j.transactions[0].amount = 1;
  assert.equal(accountPerformance(j).status, "unavailable");
});
test("each account must record the corroborated split, not just one combined position", () => {
  const i = input();
  i.transactions.push(
    { ...tx("d3", "2026-01-01", "deposit", { amount: 500 }), account: "Other" },
    {
      ...tx("b3", "2026-01-01", "buy", {
        symbol: "APP",
        quantity: 2,
        price: 100,
      }),
      account: "Other",
    },
  );
  assert.equal(accountPerformance(i).status, "unavailable");
});
test("missing close cannot be carried forward and duplicate dates cannot double count", () => {
  const i = input();
  i.prices[0].closes.splice(1, 1);
  assert.equal(accountPerformance(i).status, "unavailable");
  const j = input();
  j.dates.push(j.dates.at(-1));
  assert.equal(accountPerformance(j).status, "unavailable");
});
test("cash-only ledger supports exact equity without invented market evidence", () => {
  const i = input();
  i.prices = [];
  i.transactions = [
    tx("d", "2026-01-01", "deposit", { amount: 500 }),
    tx("f", "2026-01-02", "fee", { amount: 10 }),
    tx("w", "2026-01-03", "withdrawal", { amount: 100 }),
  ];
  const r = accountPerformance(i);
  assert.equal(r.status, "available");
  assert.deepEqual(
    r.points.map((p) => p.equity),
    [500, 490, 390],
  );
  assert.equal(r.points.at(-1).gain, -10);
});
