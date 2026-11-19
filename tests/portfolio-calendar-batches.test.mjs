import test from "node:test";
import assert from "node:assert/strict";
import { loadPortfolioCalendar } from "../lib/portfolio-calendar.ts";
test("calendar covers every selected stock with sequential capped batches", async () => {
  const symbols = Array.from({ length: 73 }, (_, i) => `S${i}`);
  const sizes = [];
  let active = 0;
  const r = await loadPortfolioCalendar(symbols, async (batch) => {
    assert.equal(++active, 1);
    sizes.push(batch.length);
    await Promise.resolve();
    active--;
    return {
      events: [],
      issues: [],
      followed: batch.length,
      eventsReady: true,
    };
  });
  assert.deepEqual(sizes, [30, 30, 13]);
  assert.equal(r.followed, 73);
  assert.equal(r.eventsReady, true);
});
test("failed or partial batches stop further calls and never claim complete coverage", async () => {
  for (const failure of ["throw", "partial"]) {
    let calls = 0;
    const r = await loadPortfolioCalendar(
      Array.from({ length: 91 }, (_, i) => `S${i}`),
      async (b) => {
        calls++;
        if (calls === 2) {
          if (failure === "throw") throw Error("rate limit");
          return {
            events: [],
            issues: ["scheduled events unavailable"],
            followed: 0,
            eventsReady: false,
          };
        }
        return {
          events: [
            { symbol: "S0", date: "2026-11-20", kind: "earnings", detail: "" },
          ],
          issues: [],
          followed: b.length,
          eventsReady: true,
        };
      },
    );
    assert.equal(calls, 2);
    assert.equal(r.followed, 30);
    assert.equal(r.eventsReady, false);
    assert.match(r.issues.join(" "), /30 of 91/);
    assert.equal(r.events.length, 1);
  }
});
