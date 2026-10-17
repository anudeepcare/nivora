-- Override broad Supabase default grants for the new AURYN product tables.
revoke all on public.auryn_documents,public.auryn_observations,public.auryn_alert_events,public.auryn_paper_plans,public.auryn_paper_runs,public.auryn_paper_lock from public,anon,authenticated;
grant select,insert,update,delete on public.auryn_documents,public.auryn_alert_events to authenticated;
grant select,insert on public.auryn_observations to authenticated;
grant select on public.auryn_paper_plans,public.auryn_paper_runs to authenticated;
grant all on public.auryn_documents,public.auryn_observations,public.auryn_alert_events,public.auryn_paper_plans,public.auryn_paper_runs,public.auryn_paper_lock to service_role;
revoke all on all tables in schema auryn_product_private from public,anon,authenticated;
alter table auryn_product_private.provider_minutes enable row level security;
alter table auryn_product_private.position_imports enable row level security;
notify pgrst, 'reload schema';

