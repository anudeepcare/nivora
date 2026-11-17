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
test("view changes expose only the requested account-cached resource immediately", () => {
  const cache = new Map([
    ["research/APP", { at: 1, value: { symbol: "APP" } }],
  ]);
  assert.deepEqual(c.resourceSnapshot(cache, "research/APP"), {
    symbol: "APP",
  });
  assert.equal(c.resourceSnapshot(cache, "research/SAP"), null);
  assert.equal(c.resourceSnapshot(new Map(), "research/APP"), null);
  assert.equal(c.resourceSnapshot(cache, null), null);
});

test('recent cache hits survive bounded LRU eviction', async () => {
  const cache = new Map();
  for(let i=0;i<80;i++) await c.readResource(cache,String(i),60000,async()=>i);
  await c.readResource(cache,'0',60000,async()=>-1);
  await c.readResource(cache,'80',60000,async()=>80);
  assert.equal(cache.has('0'),true);
  assert.equal(cache.has('1'),false);
});
test('refresh invalidates an in-flight write and does not join the old request',async()=>{
  const cache=new Map();let resolve;
  const old=c.readResource(cache,'x',60000,()=>new Promise(r=>resolve=r));
  await Promise.resolve();
  c.invalidateResource(cache,'x');
  assert.equal(await c.readResource(cache,'x',60000,async()=>2),2);
  resolve(1);await old;
  assert.equal(cache.get('x').value,2);
});
test('clearing an account prevents late responses from repopulating its cache',async()=>{
  const cache=new Map();let resolve;
  const old=c.readResource(cache,'private',60000,()=>new Promise(r=>resolve=r));
  await Promise.resolve();c.clearResources(cache);resolve('private');await old;
  assert.equal(cache.size,0);
});
