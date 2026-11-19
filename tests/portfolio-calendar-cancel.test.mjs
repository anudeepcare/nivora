import test from "node:test";
import assert from "node:assert/strict";
const feed = (batch) => ({
  events: [],
  issues: [],
  followed: batch.length,
  eventsReady: true,
});
test("cancel last subscriber aborts current batch and does not request remaining500symbol batches or cache partial work", async () => {
  const { readPortfolioCalendar } = await import(
    "../lib/portfolio-calendar-resource.ts"
  );
  const cache = new Map(),
    a = new AbortController();
  let calls = 0,
    signal;
  const pending = readPortfolioCalendar(
    cache,
    "k",
    Array.from({ length: 500 }, (_, i) => `S${i}`),
    async (batch, s) => {
      calls++;
      signal = s;
      return new Promise(() => {});
    },
    a.signal,
  );
  await new Promise((r) => setTimeout(r, 0));
  a.abort();
  await assert.rejects(pending);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(calls, 1);
  assert.equal(signal.aborted, true);
  assert.equal(cache.size, 0);
});
test("one of two same-account subscribers can leave without aborting shared provider request", async () => {
  const { readPortfolioCalendar } = await import(
    "../lib/portfolio-calendar-resource.ts"
  );
  const cache = new Map(),
    a = new AbortController();
  let finish,
    calls = 0;
  const read = async (batch) => {
    calls++;
    return new Promise((r) => (finish = () => r(feed(batch))));
  };
  const one = readPortfolioCalendar(cache, "k", ["A"], read, a.signal),
    two = readPortfolioCalendar(cache, "k", ["A"], read);
  await new Promise((r) => setTimeout(r, 0));
  a.abort();
  await assert.rejects(one);
  finish();
  assert.equal((await two).followed, 1);
  assert.equal(calls, 1);
  assert.equal(cache.size, 1);
});
test("distinct account caches never share pending calendar or results", async () => {
  const { readPortfolioCalendar } = await import(
    "../lib/portfolio-calendar-resource.ts"
  );
  let calls = 0;
  const read = async (batch) => {
    calls++;
    return feed(batch);
  };
  await Promise.all([
    readPortfolioCalendar(new Map(), "k", ["A"], read),
    readPortfolioCalendar(new Map(), "k", ["A"], read),
  ]);
  assert.equal(calls, 2);
});
test("loader throws cancellation rather than returning cacheable partial evidence", async () => {
  const { loadPortfolioCalendar } = await import(
    "../lib/portfolio-calendar.ts"
  );
  const a = new AbortController();
  let calls = 0;
  await assert.rejects(
    loadPortfolioCalendar(
      Array.from({ length: 60 }, (_, i) => `S${i}`),
      async (batch) => {
        calls++;
        a.abort();
        return feed(batch);
      },
      a.signal,
    ),
  );
  assert.equal(calls, 1);
});
