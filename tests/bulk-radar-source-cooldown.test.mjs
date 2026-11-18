import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const migration =
  "supabase/migrations/20261118110617_auryn_bulk_radar_source_cooldown.sql";
const scope = "a".repeat(64),
  other = "b".repeat(64),
  day = "2026-11-17";
async function setup() {
  const d = new PGlite();
  await d.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;",
  );
  await d.exec(fs.readFileSync(migration, "utf8"));
  return d;
}
async function read(d, s = scope, date = day) {
  return (
    await d.query(
      "select auryn_bulk_radar_source_cooldown($1,$2::date) result",
      [s, date],
    )
  ).rows[0].result;
}
async function pause(d, seconds) {
  return d.query(
    "select auryn_bulk_radar_source_pause($1,$2::date,clock_timestamp()+($3*interval '1 second'))",
    [scope, day, seconds],
  );
}
test("durable credential/session cooldown is monotonic and expires without blocking other scopes", async () => {
  const d = await setup();
  try {
    assert.equal(await read(d), null);
    await pause(d, 600);
    const first = await read(d);
    await pause(d, 30);
    assert.deepEqual(await read(d), first);
    assert.equal(await read(d, other), null);
    assert.equal(await read(d, scope, "2026-11-16"), null);
    await d.exec(
      "update auryn_bulk_radar_source set retry_at=clock_timestamp()-interval '1 second'",
    );
    assert.equal(await read(d), null);
  } finally {
    await d.close();
  }
});
test("roles cannot inspect or mutate source state; invalid or excessive cooldown fails", async () => {
  const d = await setup();
  try {
    await assert.rejects(read(d, "private-key"));
    await assert.rejects(pause(d, 90000));
    await assert.rejects(pause(d, -1));
    for (const role of ["anon", "authenticated"]) {
      await d.exec("set role " + role);
      await assert.rejects(read(d), /permission denied/);
      await assert.rejects(pause(d, 60), /permission denied/);
      await assert.rejects(
        d.query("select * from auryn_bulk_radar_source"),
        /permission denied/,
      );
      await d.exec("reset role");
    }
    await d.exec("set role service_role");
    await pause(d, 60);
    assert.ok(await read(d));
  } finally {
    await d.close();
  }
});
test("bounded explicit retention removes expired only, not active cooldown", async () => {
  const d = await setup();
  try {
    await pause(d, 60);
    assert.equal(
      (await d.query("select auryn_bulk_radar_source_prune() n")).rows[0].n,
      0,
    );
    await d.exec(
      "update auryn_bulk_radar_source set retry_at=clock_timestamp()-interval '1 day'",
    );
    assert.equal(
      (await d.query("select auryn_bulk_radar_source_prune() n")).rows[0].n,
      1,
    );
  } finally {
    await d.close();
  }
});
