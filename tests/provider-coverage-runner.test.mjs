import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const path = "scripts/provider-coverage-runner.mjs";
test("inactive provider-only runner exists", () =>
  assert.ok(fs.existsSync(path)));
const api = () => import("../scripts/provider-coverage-runner.mjs");
const manifest = (n = 2) => ({
  version: 1,
  ownerId: "owner",
  runId: "synthetic-run",
  source: "authorized-provider-directory",
  capturedAt: "2026-11-18T00:00:00Z",
  tickers: Array.from({ length: n }, (_, i) => `TEST${i}.US`),
  from: "2026-01-01",
  to: "2026-11-17",
});
function harness({
  owner = "owner",
  quota = true,
  denyReserve = false,
  fail = null,
} = {}) {
  const calls = [],
    saved = [];
  return {
    calls,
    saved,
    deps: {
      authorize: async () => ({ userId: owner, allowed: true }),
      quota: async () => ({
        verified: quota,
        verifiedAt: "2026-11-18T00:00:00Z",
        eodhdRemaining: 10000,
        sentisenseRemaining: 1000,
      }),
      reserve: async (x) => {
        calls.push(["reserve", x]);
        return !denyReserve;
      },
      read: async (x) => {
        calls.push(["read", x]);
        if (fail) throw Error(fail);
        return {
          status: "available",
          providerTicker: x.providerTicker,
          observedAt: "2026-11-17",
          currency: "USD",
          recordCount: 3,
        };
      },
      checkpoint: async (x) => saved.push(structuredClone(x)),
      now: () => "2026-11-18T00:00:00Z",
    },
  };
}
test("exact500 plan costs5500 EOD credits+500Senti calls, no provider traffic", async () => {
  const { coveragePlan } = await api();
  const p = coveragePlan(manifest(500));
  assert.deepEqual(p.cost, { eodhd: 5500, sentisense: 500 });
  assert.equal(p.rows.length, 1500);
  assert.equal(p.concurrency, 1);
});
test("owner and unknown quota deny before reads", async () => {
  const { runCoverage } = await api();
  for (const options of [{ owner: "other" }, { quota: false }]) {
    const h = harness(options);
    await assert.rejects(() => runCoverage(manifest(), h.deps));
    assert.equal(h.calls.length, 0);
  }
});
test("sequential fixed dataset reads reserve cost and checkpoint in-flight first", async () => {
  const { runCoverage } = await api();
  const h = harness();
  const r = await runCoverage(manifest(), h.deps);
  assert.equal(r.complete, true);
  assert.equal(r.rows.length, 6);
  assert.ok(r.rows.every((x) => x.status === "available"));
  assert.ok(h.saved.some((x) => x.rows.some((y) => y.status === "in-flight")));
  assert.equal(h.calls.filter((x) => x[0] === "read").length, 6);
  assert.equal(JSON.stringify(r).includes("secret"), false);
});
test("resume skips completed and ambiguous in-flight outcomes; bound to owner+manifest", async () => {
  const { runCoverage } = await api();
  const h = harness();
  const prior = await runCoverage(manifest(), h.deps);
  const g = harness();
  const resumed = await runCoverage(manifest(), g.deps, prior);
  assert.equal(g.calls.length, 0);
  assert.deepEqual(resumed.rows, prior.rows);
  const changed = manifest();
  changed.tickers[0] = "OTHER.US";
  await assert.rejects(() => runCoverage(changed, g.deps, prior));
  const unfinished = structuredClone(prior);
  unfinished.rows[0].status = "in-flight";
  const x = await runCoverage(manifest(), g.deps, unfinished);
  assert.equal(x.rows[0].status, "unknown-outcome");
  assert.equal(x.complete, false);
});
test("budget reserve denies before acquisition and untested remains distinct", async () => {
  const { runCoverage } = await api();
  const h = harness({ denyReserve: true });
  const r = await runCoverage(manifest(), h.deps);
  assert.equal(r.complete, false);
  assert.equal(r.stopReason, "budget");
  assert.equal(h.calls.filter((x) => x[0] === "read").length, 0);
  assert.ok(r.rows.every((x) => x.status === "not-tested"));
});
test("provider errors sanitized and stop; no retry or fallback", async () => {
  const { runCoverage } = await api();
  const h = harness({ fail: "api_token=SECRET" });
  const r = await runCoverage(manifest(), h.deps);
  assert.equal(h.calls.filter((x) => x[0] === "read").length, 1);
  assert.equal(r.rows[0].status, "unknown-outcome");
  assert.doesNotMatch(JSON.stringify(r), /SECRET|api_token/);
});
test("mismatch or nested transport metadata never becomes available or leaks", async () => {
  const { runCoverage } = await api();
  const h = harness();
  h.deps.read = async () => ({
    status: "available",
    providerTicker: "OTHER.US",
    secret: { value: "SECRET" },
  });
  const r = await runCoverage(manifest(), h.deps);
  assert.equal(r.rows[0].status, "invalid-evidence");
  assert.ok(r.rows.slice(1).every((x) => x.status === "not-tested"));
  assert.doesNotMatch(JSON.stringify(r), /SECRET/);
});
test("invalid/duplicate/provider-unrelated manifest fails before authority calls", async () => {
  const { coveragePlan } = await api();
  for (const alter of [
    (m) => m.tickers.push(m.tickers[0]),
    (m) => (m.source = "DCA"),
    (m) => (m.tickers[0] = "../secret"),
    (m) => (m.to = "2026-02-30"),
  ]) {
    const m = manifest();
    alter(m);
    assert.throws(() => coveragePlan(m));
  }
});
test("stale quota attestations and dependency errors cannot trigger reads or leak credentials", async () => {
  const { runCoverage } = await api();
  const h = harness();
  h.deps.quota = async () => ({
    verified: true,
    verifiedAt: "2026-11-17T00:00:00Z",
    eodhdRemaining: 10000,
    sentisenseRemaining: 1000,
  });
  await assert.rejects(() => runCoverage(manifest(), h.deps));
  assert.equal(h.calls.length, 0);
  h.deps.authorize = async () => {
    throw Error("secret=PRIVATE");
  };
  await assert.rejects(
    () => runCoverage(manifest(), h.deps),
    (e) => !e.message.includes("PRIVATE"),
  );
});
test("checkpoint failure before read prevents spend and transport never overlaps", async () => {
  const { runCoverage } = await api();
  const h = harness();
  h.deps.checkpoint = async () => {
    throw Error("secret=PRIVATE");
  };
  await assert.rejects(
    () => runCoverage(manifest(), h.deps),
    (e) => !e.message.includes("PRIVATE"),
  );
  assert.equal(h.calls.length, 0);
});
test("invalid identity stops further acquisition rather than spending entire manifest", async () => {
  const { runCoverage } = await api();
  const h = harness();
  let reads = 0;
  h.deps.read = async () => {
    reads++;
    return { status: "available", providerTicker: "WRONG.US" };
  };
  const r = await runCoverage(manifest(), h.deps);
  assert.equal(reads, 1);
  assert.equal(r.stopReason, "invalid-evidence");
  assert.equal(r.rows[1].status, "not-tested");
});
test("sequential acquisition never overlaps active reads", async () => {
  const { runCoverage } = await api();
  const h = harness();
  let active = 0,
    max = 0;
  h.deps.read = async (task) => {
    active++;
    max = Math.max(max, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active--;
    return { status: "no-coverage", providerTicker: task.providerTicker };
  };
  await runCoverage(manifest(), h.deps);
  assert.equal(max, 1);
});
