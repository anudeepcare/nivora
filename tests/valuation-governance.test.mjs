import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("valuation output governance is append-only and override approval is explicit", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
    await db.exec(await readFile(new URL("../supabase/migrations/20261028000000_valuation_observations.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/20261028000100_valuation_outputs_governance.sql", import.meta.url), "utf8"));
    await db.exec("set role service_role");
    await db.query(`insert into public.auryn_valuation_outputs(trace_id,symbol,as_of,model_version,config_hash,status,payload,review_status) values('valuation-governance-1','MSFT','2026-10-28','valuation@1.0.0','sha256:test','ok','{}'::jsonb,'approved')`);
    await db.query(`insert into public.auryn_valuation_outputs(trace_id,symbol,as_of,model_version,config_hash,status,payload) values('valuation-governance-2','MSFT','2026-10-28','valuation@1.0.0','sha256:test','ok','{}'::jsonb)`);
    await db.query(`insert into public.auryn_valuation_reviews(trace_id,reviewer_id,reviewer_role,decision,reason,created_at) values('valuation-governance-1','00000000-0000-0000-0000-000000000002','portfolio_manager','approved','Independent review approved','2026-10-28T00:00:00Z')`);
    await assert.rejects(db.query("update public.auryn_valuation_outputs set status='refused'"));
    await db.query(`insert into public.auryn_valuation_overrides(trace_id,symbol,proposed_by,reason,patch) values('valuation-governance-1','MSFT','00000000-0000-0000-0000-000000000001','Review capital structure disclosure','{}'::jsonb)`);
    await assert.rejects(db.query(`update public.auryn_valuation_overrides set status='approved' where trace_id='valuation-governance-1'`));
    await assert.rejects(db.query(`insert into public.auryn_valuation_overrides(trace_id,symbol,proposed_by,approved_by,approver_role,reason,patch,status) values('valuation-governance-1','MSFT','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','portfolio_manager','Self approval must fail','{}'::jsonb,'approved')`));
    await db.exec("set role authenticated");
    const visible = await db.query("select count(*)::int as n from public.auryn_valuation_outputs");
    assert.equal(Number(visible.rows[0].n), 1);
    await db.exec("set role service_role");
    await db.query(`insert into public.auryn_valuation_reviews(trace_id,reviewer_id,reviewer_role,decision,reason,created_at) values('valuation-governance-1','00000000-0000-0000-0000-000000000002','portfolio_manager','rejected','New evidence requires withdrawal','2026-10-28T00:01:00Z')`);
    await db.exec("set role authenticated");
    const withdrawn = await db.query("select count(*)::int as n from public.auryn_valuation_outputs");
    assert.equal(Number(withdrawn.rows[0].n), 0);
  } finally {
    await db.close();
  }
});
