import test from "node:test";
import assert from "node:assert/strict";
import { createAskDeadline, askModelTimeout } from "../lib/ask-deadline.ts";
test("absolute request budget reserves review and rejects inadequate remainder", () => {
  let now = 0;
  const d = createAskDeadline(undefined, 55000, () => now);
  assert.equal(askModelTimeout(d, "generation"), 18000);
  now = 42000;
  assert.equal(askModelTimeout(d, "generation"), 4500);
  now = 47000;
  assert.throws(() => askModelTimeout(d, "generation"));
  assert.equal(askModelTimeout(d, "review"), 7500);
  d.close();
});
test("deadline aborts request and returns promptly even if a dependency hangs", async () => {
  const d = createAskDeadline(undefined, 10);
  await assert.rejects(
    d.run(() => new Promise(() => {})),
    /deadline/,
  );
  assert.equal(d.signal.aborted, true);
  d.close();
});
