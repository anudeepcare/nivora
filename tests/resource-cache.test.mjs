import test from "node:test";
import assert from "node:assert/strict";
import * as c from "../lib/resource-cache.ts";
test("concurrent consumers and repeated tab mounts share one request per account cache", async () => {
  const cache = new Map();
  let count = 0;
  const read = async () => {
    count++;
    return { symbol: "APP" };
  };
  const [a, b] = await Promise.all([
    c.readResource(cache, "research/APP", 60000, read),
    c.readResource(cache, "research/APP", 60000, read),
  ]);
  assert.equal(count, 1);
  assert.deepEqual(a, b);
  await c.readResource(cache, "research/APP", 60000, read);
  assert.equal(count, 1);
  await c.readResource(new Map(), "research/APP", 60000, read);
  assert.equal(count, 2);
});
test("a rejected request can be retried and never poisons the cache", async () => {
  const cache = new Map();
  await assert.rejects(
    c.readResource(cache, "x", 60000, async () => {
      throw Error("offline");
    }),
  );
  assert.equal(await c.readResource(cache, "x", 60000, async () => 42), 42);
});
