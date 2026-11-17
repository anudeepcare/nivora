import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const alice = "00000000-0000-0000-0000-000000000001";
const bob = "00000000-0000-0000-0000-000000000002";
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.user_id',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    insert into auth.users values('${alice}'),('${bob}');
    create table auryn_transaction_ledgers(user_id uuid primary key, revision integer, rows jsonb default '[]');
    insert into auryn_transaction_ledgers (user_id,revision) values('${alice}',1),('${bob}',1);
    grant all on auryn_transaction_ledgers to service_role;`);
  await db.exec(fs.readFileSync("supabase/migrations/202611170001_account_history_jobs.sql", "utf8"));
  const job = (await db.query(`insert into auryn_account_history_jobs(user_id,revision,through,algorithm_version,state,ledger_snapshot)
    values($1,1,'2026-11-16','v1','{}','[]') returning *`, [alice])).rows[0];
  return { db, job };
}
const claim = async (db, job, user = alice, revision = 1) =>
  (await db.query("select * from auryn_claim_account_history($1,$2,$3)", [job.id,user,revision])).rows;
const save = async (db, job, lease, result = null, user = alice, revision = 1) =>
  (await db.query("select auryn_save_account_history($1,$2,$3,$4,$5::jsonb,$6::jsonb) ok", [job.id,user,revision,lease,'{"completed":1}',result === null ? null : JSON.stringify(result)])).rows[0].ok;

test("history jobs reject foreign owners, stale revisions, duplicate claims and replayed publication", async () => {
  const {db,job} = await setup();
  try {
    assert.equal((await claim(db,job,bob)).length,0);
    assert.equal((await claim(db,job,alice,2)).length,0);
    const first = (await claim(db,job))[0];
    assert.ok(first.lease_token);
    assert.equal((await claim(db,job)).length,0);
    assert.equal(await save(db,job,first.lease_token,null,bob),false);
    assert.equal(await save(db,job,bob),false);
    assert.equal(await save(db,job,first.lease_token),true);
    assert.equal(await save(db,job,first.lease_token),false);
    const second = (await claim(db,job))[0];
    assert.notEqual(first.lease_token,second.lease_token);
    assert.deepEqual(second.state,{completed:1});
    assert.equal(await save(db,job,second.lease_token,{status:"available"}),true);
    assert.equal((await claim(db,job)).length,0);
    assert.equal(await save(db,job,second.lease_token),false);
  } finally {await db.close();}
});
test("history jobs reject changes during work, expired jobs and expired leases", async () => {
  const {db,job} = await setup();
  try {
    const first = (await claim(db,job))[0];
    await db.query("update auryn_transaction_ledgers set revision=2 where user_id=$1",[alice]);
    assert.equal(await save(db,job,first.lease_token,{status:"available"}),false);
    assert.equal((await claim(db,job)).length,0);
    await db.query("update auryn_transaction_ledgers set revision=1 where user_id=$1",[alice]);
    await db.exec("update auryn_account_history_jobs set lease_until=now()-interval '1 second'");
    assert.equal(await save(db,job,first.lease_token),false);
    const second = (await claim(db,job))[0];
    assert.notEqual(first.lease_token,second.lease_token);
    assert.equal(await save(db,job,first.lease_token),false);
    await db.exec("update auryn_account_history_jobs set expires_at=now()-interval '1 second'");
    assert.equal(await save(db,job,second.lease_token),false);
    assert.equal((await claim(db,job)).length,0);
  } finally {await db.close();}
});
test("history evidence is service-only writable and RLS hides foreign jobs", async () => {
  const {db,job} = await setup();
  try {
    await db.exec(`set role authenticated; set app.user_id='${bob}';`);
    assert.equal((await db.query("select * from auryn_account_history_jobs")).rows.length,0);
    await db.exec(`set app.user_id='${alice}';`);
    assert.equal((await db.query("select * from auryn_account_history_jobs")).rows.length,1);
    await assert.rejects(claim(db,job),/permission denied/);
    await assert.rejects(save(db,job,alice),/permission denied/);
    await assert.rejects(db.exec("update auryn_account_history_jobs set state='{}'"),/permission denied/);
    await assert.rejects(db.exec("delete from auryn_account_history_jobs"),/permission denied/);
    await db.exec("reset role; set role service_role");
    assert.equal((await claim(db,job)).length,1);
  } finally {await db.close();}
});
test("history jobs reject same-revision ledger mutation before claim and publication", async () => {
  const {db,job} = await setup();
  try {
    await db.query("update auryn_transaction_ledgers set rows='[{\"id\":\"changed\"}]' where user_id=$1",[alice]);
    assert.equal((await claim(db,job)).length,0);
    await db.query("update auryn_transaction_ledgers set rows='[]' where user_id=$1",[alice]);
    const first = (await claim(db,job))[0];
    await db.query("update auryn_transaction_ledgers set rows='[{\"id\":\"changed\"}]' where user_id=$1",[alice]);
    assert.equal(await save(db,job,first.lease_token,{status:"available"}),false);
    assert.equal((await db.query("select result from auryn_account_history_jobs where id=$1",[job.id])).rows[0].result,null);
  } finally {await db.close();}
});
test("history jobs enforce bounded JSON objects and one job per revision/day/version", async () => {
  const {db,job} = await setup();
  try {
    await assert.rejects(db.exec("update auryn_account_history_jobs set state='[]'"),/check constraint/);
    await assert.rejects(db.exec("update auryn_account_history_jobs set result='[]'"),/check constraint/);
    await assert.rejects(db.query("update auryn_account_history_jobs set state=$1::jsonb",[JSON.stringify({oversized:'x'.repeat(4194304)})]),/check constraint/);
    await assert.rejects(db.query("insert into auryn_account_history_jobs(user_id,revision,through,algorithm_version,state,ledger_snapshot) values($1,1,'2026-11-16','v1','{}','[]')",[alice]),/unique constraint/);
    assert.equal(job.revision,1);
  } finally {await db.close();}
});
