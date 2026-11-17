import test from "node:test";
import assert from "node:assert/strict";
import { fetchWithDeadline } from "../lib/request-deadline.ts";
test("a stalled request aborts at its deadline", async () => {
  const stalled = (_url, init) =>
    new Promise((resolve, reject) =>
      init.signal.addEventListener("abort", () => reject(init.signal.reason)),
    );
  await assert.rejects(
    fetchWithDeadline("/api/workspace", {}, 5, stalled),
    /timed out/i,
  );
});
test("caller cancellation is forwarded without waiting for deadline", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Cancelled"));
  const fetcher = async (_url, init) => {
    init.signal.throwIfAborted();
  };
  await assert.rejects(
    fetchWithDeadline(
      "/api/workspace",
      { signal: controller.signal },
      1000,
      fetcher,
    ),
    /Cancelled/,
  );
});
test("successful requests return normally", async () => {
  const response = new Response("{}");
  assert.equal(
    await fetchWithDeadline("/api/workspace", {}, 1000, async () => response),
    response,
  );
});

test("stalled auth promises reject without waiting for a fetch to begin", async () => {
  const { settleWithDeadline } = await import("../lib/request-deadline.ts");
  await assert.rejects(
    settleWithDeadline(new Promise(() => {}), 5, "Session check timed out."),
    /Session check timed out/,
  );
  assert.equal(
    await settleWithDeadline(Promise.resolve("ready"), 1000),
    "ready",
  );
  await assert.rejects(
    settleWithDeadline(Promise.reject(Error("auth failed")), 1000),
    /auth failed/,
  );
});
