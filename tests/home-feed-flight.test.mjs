import test from "node:test";
import assert from "node:assert/strict";
import {
  acquireHomeFeed,
  invalidateHomeFeed,
} from "../lib/home-feed-flight.ts";
test("shared feed keeps other consumer alive; last release aborts and suppresses cache write", async () => {
  const cache = new Map();
  let signal,
    resolve,
    calls = 0;
  const read = (s) => {
    calls++;
    signal = s;
    return new Promise((r) => (resolve = r));
  };
  const a = acquireHomeFeed(cache, "K", 300000, read),
    b = acquireHomeFeed(cache, "K", 300000, read);
  await Promise.resolve();
  assert.equal(calls, 1);
  a.release();
  assert.equal(signal.aborted, false);
  b.release();
  assert.equal(signal.aborted, true);
  resolve("late");
  await a.promise;
  assert.equal(cache.has("K"), false);
  const next = acquireHomeFeed(cache, "K", 300000, async () => "new");
  assert.equal(await next.promise, "new");
  next.release();
  assert.equal(cache.get("K").value, "new");
});
test("cache hit reuses timestamp and explicit refresh cannot let old request overwrite new result", async () => {
  const cache = new Map([["K", { at: Date.now(), value: "cached" }]]);
  let calls = 0;
  const hit = acquireHomeFeed(cache, "K", 300000, async () => {
    calls++;
    return "bad";
  });
  assert.equal(await hit.promise, "cached");
  assert.equal(calls, 0);
  hit.release();
  invalidateHomeFeed(cache, "K");
  let resolve;
  const old = acquireHomeFeed(
    cache,
    "K",
    300000,
    () => new Promise((r) => (resolve = r)),
  );
  await Promise.resolve();
  invalidateHomeFeed(cache, "K");
  const fresh = acquireHomeFeed(cache, "K", 300000, async () => "fresh");
  await fresh.promise;
  resolve("obsolete");
  await old.promise;
  assert.equal(cache.get("K").value, "fresh");
  old.release();
  fresh.release();
});
test("failed requests clear shared flight so retry can succeed", async () => {
  const cache = new Map();
  const a = acquireHomeFeed(cache, "K", 1, async () => {
    throw Error("fail");
  });
  await assert.rejects(a.promise, /fail/);
  a.release();
  const b = acquireHomeFeed(cache, "K", 1, async () => 42);
  assert.equal(await b.promise, 42);
  b.release();
});
