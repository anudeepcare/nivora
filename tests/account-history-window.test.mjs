import test from "node:test";
import assert from "node:assert/strict";
test("six-month window uses calendar months and clamps month-end without creating observations", async () => {
  const { accountHistoryWindow } = await import(
    "../lib/account-history-window.ts"
  );
  const w = accountHistoryWindow(
    ["2026-05-01", "2026-08-01", "2026-11-18"],
    "6M",
  );
  assert.equal(w.requestedStart, "2026-05-18");
  assert.equal(w.cutoff, Date.parse("2026-05-18"));
  assert.equal(w.actualStart, "2026-08-01");
  assert.equal(w.actualEnd, "2026-11-18");
  assert.equal(w.shortHistory, false);
  assert.equal(
    accountHistoryWindow(["2026-08-31"], "6M").requestedStart,
    "2026-02-28",
  );
});
test("three months of evidence never become six months or a synthetic return", async () => {
  const { accountHistoryWindow } = await import(
    "../lib/account-history-window.ts"
  );
  const dates = ["2026-08-18", "2026-11-18"];
  const w = accountHistoryWindow(dates, "6M");
  assert.equal(w.shortHistory, true);
  assert.equal(w.actualStart, "2026-08-18");
  assert.deepEqual(dates, ["2026-08-18", "2026-11-18"]);
  assert.equal("returnPct" in w, false);
  assert.equal(accountHistoryWindow([], "6M").actualEnd, null);
});

test("portfolio ranges use calendar months and clamp leap or short months", async () => {
  const { accountHistoryWindow } = await import(
    "../lib/account-history-window.ts"
  );
  assert.equal(
    accountHistoryWindow(["2024-02-29"], "2Y").requestedStart,
    "2022-02-28",
  );
  assert.equal(
    accountHistoryWindow(["2026-03-31"], "1M").requestedStart,
    "2026-02-28",
  );
  assert.equal(
    accountHistoryWindow(["2025-02-28"], "1Y").requestedStart,
    "2024-02-28",
  );
});
