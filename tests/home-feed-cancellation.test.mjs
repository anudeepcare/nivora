import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { loadHomeFeed } from "../lib/home-feed.ts";
import * as cacheFns from "../lib/resource-cache.ts";
import * as flightFns from "../lib/home-feed-flight.ts";
function mount(cache, api) {
  const effects = [];
  const js = ts.transpileModule(
    fs.readFileSync("components/useHomeFeed.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const out = {};
  new Function("require", "exports", js)(
    (name) =>
      name === "react"
        ? {
            useState: (initial) => [
              typeof initial === "function" ? initial() : initial,
              () => {},
            ],
            useEffect: (fn) => effects.push(fn),
          }
        : name === "./Session"
          ? { useProduct: () => ({ cache, demo: false }) }
          : name.includes("resource-cache")
            ? cacheFns
            : name.includes("home-feed-flight")
              ? flightFns
              : name === "@/lib/home-feed"
                ? { loadHomeFeed }
                : name === "@/lib/client"
                  ? { api }
                  : { emptyFeed: {} },
    out,
  );
  out.useHomeFeed(Array.from({ length: 500 }, (_, i) => `T${i}`));
  return effects[0]();
}
const settle = () => new Promise((r) => setImmediate(r));
const data = () => ({
  events: [],
  news: [],
  issues: [],
  followed: 30,
  newsFollowed: 30,
  eventsReady: true,
  newsReady: true,
  retrievedAt: new Date().toISOString(),
});
test("actual hook unmount aborts in-flight500symbol work and prevents all remaining batches", async () => {
  const cache = new Map();
  let calls = 0,
    signal,
    release;
  const gate = new Promise((r) => (release = r));
  const cleanup = mount(cache, async (_p, _b, s) => {
    signal = s;
    calls++;
    await gate;
    return data();
  });
  await settle();
  assert.equal(calls, 1);
  cleanup();
  assert.equal(signal.aborted, true);
  release();
  await settle();
  assert.equal(calls, 1);
  assert.equal(cache.size, 0);
});
test("actual hooks share17batches and one unmount cannot abort surviving consumer", async () => {
  const cache = new Map();
  let calls = 0,
    signal,
    release;
  const gate = new Promise((r) => (release = r));
  const api = async (_p, _b, s) => {
    signal = s;
    calls++;
    if (calls === 1) await gate;
    return data();
  };
  const a = mount(cache, api),
    b = mount(cache, api);
  await settle();
  assert.equal(calls, 1);
  a();
  assert.equal(signal.aborted, false);
  release();
  await settle();
  assert.equal(calls, 17);
  assert.equal(cache.size, 1);
  b();
});
