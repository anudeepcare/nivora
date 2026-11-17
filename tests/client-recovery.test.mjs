import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { settleWithDeadline } from "../lib/request-deadline.ts";
function setup(statuses, mode = "normal") {
  let requests = 0,
    refreshes = 0;
  const exports = {};
  const auth = {
    getSession: () =>
      mode === "session-stall"
        ? new Promise(() => {})
        : Promise.resolve({ data: { session: { access_token: "old" } } }),
    refreshSession: async () => {
      refreshes++;
      if (mode === "refresh-stall") return new Promise(() => {});
      await new Promise((r) => setTimeout(r, 5));
      return { data: { session: { access_token: "new" } } };
    },
  };
  const code = ts.transpileModule(fs.readFileSync("lib/client.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = {
    exports,
    process: {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test",
      },
    },
    require: (name) =>
      name.includes("request-deadline")
        ? {
            settleWithDeadline: (task) => settleWithDeadline(task, 20),
            fetchWithDeadline: (url, options) => context.fetch(url, options),
          }
        : name === "@supabase/ssr"
          ? { createBrowserClient: () => ({ auth }) }
          : name.includes("customer-language")
            ? { customerText: (x) => x }
            : {},
    fetch: async (url, options) => {
      requests++;
      const status = statuses(options.headers.Authorization);
      return {
        status,
        ok: status === 200,
        json: async () =>
          mode === "body-stall"
            ? new Promise(() => {})
            : status === 200
              ? { ok: true }
              : { error: "Unavailable" },
      };
    },
  };
  vm.runInNewContext(code, context);
  return { api: exports.api, counts: () => ({ requests, refreshes }) };
}
test("concurrent expired-token requests share one refresh and retry with the new token", async () => {
  const x = setup((token) => (token === "Bearer old" ? 401 : 200));
  const result = await Promise.all([x.api("workspace"), x.api("access")]);
  assert.ok(result.every((r) => r.ok));
  assert.deepEqual(x.counts(), { requests: 4, refreshes: 1 });
});
test("authorization retry is bounded when refreshed credentials are also rejected", async () => {
  const x = setup(() => 401);
  await assert.rejects(x.api("workspace"), (e) => e.status === 401);
  assert.deepEqual(x.counts(), { requests: 2, refreshes: 1 });
});
test("non-auth failures are not retried, including mutations", async () => {
  const x = setup(() => 503);
  await assert.rejects(
    x.api("workspace", { action: "save" }),
    (e) => e.status === 503,
  );
  assert.deepEqual(x.counts(), { requests: 1, refreshes: 0 });
});

test("session and refresh stalls end with errors rather than unbounded spinners", async () => {
  const before = setup(() => 200, "session-stall");
  await assert.rejects(before.api("workspace"), /timed out/);
  assert.deepEqual(before.counts(), { requests: 0, refreshes: 0 });
  const refresh = setup(() => 401, "refresh-stall");
  await assert.rejects(refresh.api("workspace"), /timed out/);
  assert.deepEqual(refresh.counts(), { requests: 1, refreshes: 1 });
  await assert.rejects(refresh.api("workspace"), /timed out/);
  assert.equal(refresh.counts().refreshes, 2);
});

test("a stalled successful JSON body exits with a retryable error", async () => {
  const x = setup(() => 200, "body-stall");
  await assert.rejects(
    x.api("workspace"),
    (e) => e.status === 502 && /could not be read/.test(e.message),
  );
});
