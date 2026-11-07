import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const alice = "00000000-0000-0000-0000-000000000001",
  bob = "00000000-0000-0000-0000-000000000002";
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role;
 create table auryn_documents(user_id uuid,kind text,key text,body jsonb,updated_at timestamptz default now(),primary key(user_id,kind,key));
 create table auryn_alert_events(user_id uuid,rule_key text,event_key text,symbol text,snapshot_id text,title text,detail text,unique(user_id,rule_key,event_key));`);
  await db.exec(
    fs.readFileSync(
      "supabase/migrations/20261107143633_auryn_thesis_queue.sql",
      "utf8",
    ),
  );
  await db.exec(
    fs.readFileSync(
      "supabase/migrations/20261107150947_auryn_thesis_source_guard.sql",
      "utf8",
    ),
  );
  return db;
}
async function note(db, user, symbol, enabled = true) {
  await db.query(
    `insert into auryn_documents(user_id,kind,key,body) values($1,'note',$2,$3::jsonb)`,
    [user, symbol, JSON.stringify({ monitorEnabled: String(enabled) })],
  );
}
test("SQL queue opt-in, bound, retry fairness, and stale lease ownership", async () => {
  const db = await setup();
  try {
    await note(db, bob, "OFF", false);
    for (const symbol of ["AAA", "BBB", "CCC", "DDD", "EEE"])
      await note(db, alice, symbol);
    await note(db, bob, "FFF");
    const first = (await db.query("select * from auryn_claim_theses(999)"))
      .rows;
    assert.equal(first.length, 4);
    assert.equal(
      (await db.query("select * from auryn_claim_theses(4)")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select * from auryn_claim_theses(4)")).rows.length,
      0,
    );
    const j = first[0];
    assert.equal(
      (
        await db.query("select auryn_finish_thesis($1,$2,$3,false) ok", [
          bob,
          j.symbol,
          j.lease_token,
        ])
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await db.query("select auryn_finish_thesis($1,$2,$3,false) ok", [
          j.user_id,
          j.symbol,
          j.lease_token,
        ])
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (await db.query("select * from auryn_claim_theses(4)")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query("select auryn_finish_thesis($1,$2,$3,true) ok", [
          j.user_id,
          j.symbol,
          j.lease_token,
        ])
      ).rows[0].ok,
      false,
    );
  } finally {
    await db.close();
  }
});
test("SQL atomic publication rejects changed/disabled/foreign jobs and deduplicates", async () => {
  const db = await setup();
  try {
    await note(db, alice, "APP");
    await note(db, bob, "APP");
    const jobs = (await db.query("select * from auryn_claim_theses(4)")).rows;
    const j = jobs.find((x) => x.user_id === alice);
    const revision = (
      await db.query(
        "select updated_at::text from auryn_documents where user_id=$1",
        [alice],
      )
    ).rows[0].updated_at;
    const event = JSON.stringify({
      event_key: "same",
      snapshot_id: "snap",
      title: "review",
      detail: "review",
      source_body: { monitorEnabled: "true" },
    });
    const publish = async (user = alice, rev = revision) =>
      (
        await db.query(
          "select auryn_publish_thesis_alert($1,$2,$3,$4,$5::jsonb) ok",
          [user, "APP", j.lease_token, rev, event],
        )
      ).rows[0].ok;
    assert.equal(await publish(bob), false);
    assert.equal(await publish(alice, "2020-01-01"), false);
    assert.equal(await publish(), true);
    assert.equal(await publish(), true);
    assert.equal(
      (await db.query("select * from auryn_alert_events")).rows.length,
      1,
    );
    await db.query(
      `update auryn_documents set body='{"monitorEnabled":"false"}' where user_id=$1`,
      [alice],
    );
    assert.equal(await publish(), false);
    assert.equal(
      (
        await db.query("select * from auryn_thesis_queue where user_id=$1", [
          alice,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select has_function_privilege('authenticated','auryn_claim_theses(integer)','execute') allowed",
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await db.close();
  }
});

test("SQL publication binds original body even when an edit preserves updated_at", async () => {
  const db = await setup();
  try {
    await note(db, alice, "APP");
    const j = (await db.query("select * from auryn_claim_theses(1)")).rows[0];
    const revision = (
      await db.query("select updated_at::text from auryn_documents")
    ).rows[0].updated_at;
    const event = {
      event_key: "old-rule",
      snapshot_id: "snapshot",
      title: "review",
      detail: "review",
      source_body: { monitorEnabled: "true" },
    };
    const publish = async (e = event) =>
      (
        await db.query(
          "select auryn_publish_thesis_alert($1,$2,$3,$4,$5::jsonb) ok",
          [alice, "APP", j.lease_token, revision, JSON.stringify(e)],
        )
      ).rows[0].ok;
    await db.query(
      `update auryn_documents set body=body||'{"monitorThreshold":"999"}'::jsonb where user_id=$1`,
      [alice],
    );
    assert.equal(await publish(), false);
    assert.equal(await publish({ ...event, source_body: null }), false);
    assert.equal(
      (await db.query("select count(*) n from auryn_alert_events")).rows[0].n,
      0,
    );
  } finally {
    await db.close();
  }
});
