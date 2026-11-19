import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const migration =
  "supabase/migrations/20261118102559_auryn_bulk_radar_state.sql";
const scope = "a".repeat(64),
  other = "b".repeat(64);
const snap = (splits = []) => ({
  symbol: "AAPL",
  raw: [
    { date: "2026-11-16", open: 10, high: 11, low: 9, close: 10, volume: 100 },
  ],
  splits,
  historyAcquiredAt: "2026-11-17T00:00:00Z",
  actionsAcquiredAt: "2026-11-17T00:00:00Z",
  observedThrough: "2026-11-16",
  checkedThrough: "2026-11-16",
  policy: "raw-splits-v1",
});
async function setup() {
  const d = new PGlite();
  await d.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;",
  );
  await d.exec(fs.readFileSync(migration, "utf8"));
  return d;
}
async function claim(d, s = scope) {
  return (
    await d.query("select auryn_bulk_radar_claim($1,$2) result", [s, "AAPL"])
  ).rows[0].result;
}
async function publish(d, c, value = snap()) {
  return (
    await d.query(
      "select auryn_bulk_radar_publish($1,$2,$3,$4,$5::jsonb) result",
      [scope, "AAPL", c.token, c.revision, JSON.stringify(value)],
    )
  ).rows[0].result;
}
test("atomic lease prevents duplicate workers and fenced old writes after reclaim", async () => {
  const d = await setup();
  try {
    const a = await claim(d);
    assert.equal(a.revision, 0);
    assert.equal(await claim(d), null);
    await d.exec(
      "update auryn_bulk_radar_state set lease_until=clock_timestamp()-interval '1 second'",
    );
    const b = await claim(d);
    assert.notEqual(a.token, b.token);
    assert.equal(await publish(d, a), false);
    assert.equal(await publish(d, b), true);
    assert.equal(await publish(d, b), false);
  } finally {
    await d.close();
  }
});
test("split correction replaces complete generation, fail preserves good data and retry cooldown", async () => {
  const d = await setup();
  try {
    const a = await claim(d);
    assert.equal(
      await publish(d, a, snap([{ date: "2026-11-16", split: "2/1" }])),
      true,
    );
    const b = await claim(d);
    assert.equal(
      await publish(d, b, snap([{ date: "2026-11-16", split: "4/1" }])),
      true,
    );
    let row = (await d.query("select * from auryn_bulk_radar_state")).rows[0];
    assert.equal(row.revision, 2);
    assert.equal(row.snapshot.raw[0].close, 10);
    assert.equal(row.snapshot.splits[0].split, "4/1");
    const c = await claim(d);
    assert.equal(
      (
        await d.query(
          "select auryn_bulk_radar_fail($1,$2,$3,$4,clock_timestamp()+interval '60 seconds') result",
          [scope, "AAPL", c.token, "provider_unavailable"],
        )
      ).rows[0].result,
      true,
    );
    row = (await d.query("select * from auryn_bulk_radar_state")).rows[0];
    assert.equal(row.revision, 2);
    assert.equal(row.snapshot.splits[0].split, "4/1");
    assert.equal(await claim(d), null);
    assert.ok(await claim(d, other));
  } finally {
    await d.close();
  }
});
test("private state and RPCs are denied to anonymous/authenticated roles; retention preserves active work", async () => {
  const d = await setup();
  try {
    await claim(d);
    for (const role of ["anon", "authenticated"]) {
      await d.exec(`set role ${role}`);
      await assert.rejects(
        d.query("select * from auryn_bulk_radar_state"),
        /permission denied/,
      );
      await assert.rejects(claim(d), /permission denied/);
      await d.exec("reset role");
    }
    await d.exec(
      "update auryn_bulk_radar_state set touched_at=clock_timestamp()-interval '31 days'",
    );
    assert.equal(
      (await d.query("select auryn_bulk_radar_prune() result")).rows[0].result,
      0,
    );
    await d.exec(
      "update auryn_bulk_radar_state set lease_until=clock_timestamp()-interval '1 second'",
    );
    assert.equal(
      (await d.query("select auryn_bulk_radar_prune() result")).rows[0].result,
      1,
    );
  } finally {
    await d.close();
  }
});
test("snapshot identity, bounds and stale expected revision reject atomically", async () => {
  const d = await setup();
  try {
    const c = await claim(d);
    assert.equal(await publish(d, { ...c, revision: 7 }), false);
    await assert.rejects(publish(d, c, { ...snap(), symbol: "MSFT" }));
    await assert.rejects(
      publish(d, c, { ...snap(), raw: Array(161).fill(snap().raw[0]) }),
    );
    assert.equal(await publish(d, c), true);
  } finally {
    await d.close();
  }
});

test("snapshot forbids arbitrary user/secret fields and malformed provenance", async () => {
  const d = await setup();
  try {
    const c = await claim(d);
    await assert.rejects(publish(d, c, { ...snap(), user_id: "private-user" }));
    await assert.rejects(
      publish(d, c, {
        ...snap(),
        raw: [{ ...snap().raw[0], secret: "not permitted" }],
      }),
    );
    await assert.rejects(
      publish(d, c, { ...snap(), actionsAcquiredAt: "invalid" }),
    );
    assert.equal(await publish(d, c), true);
  } finally {
    await d.close();
  }
});
