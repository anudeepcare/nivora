import test from "node:test";
import assert from "node:assert/strict";
import { startQuotePolling } from "../lib/quote-refresh.ts";

test("visible research continues polling when a formerly healthy stream stops producing renders", () => {
  const events = new EventTarget();
  let callback,
    cleared = false,
    now = 0,
    calls = 0;
  const env = {
    events,
    visible: () => true,
    now: () => now,
    every: (fn) => ((callback = fn), 1),
    cancel: () => {
      cleared = true;
    },
  };
  const stop = startQuotePolling(() => calls++, env);
  for (let i = 0; i < 4; i++) {
    now += 60000;
    callback();
  }
  assert.equal(calls, 4);
  stop();
  now += 60000;
  events.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 4);
  assert.equal(cleared, true);
});
test("hidden pages pause; resume checks immediately; repeated resume events do not burst requests", () => {
  const events = new EventTarget();
  let callback,
    visible = false,
    now = 60000,
    calls = 0;
  const stop = startQuotePolling(() => calls++, {
    events,
    visible: () => visible,
    now: () => now,
    every: (fn) => ((callback = fn), 1),
    cancel: () => {},
  });
  callback();
  assert.equal(calls, 0);
  visible = true;
  events.dispatchEvent(new Event("visibilitychange"));
  events.dispatchEvent(new Event("pageshow"));
  assert.equal(calls, 1);
  now += 60000;
  callback();
  assert.equal(calls, 2);
  stop();
});
