-- Run schema.sql first if this is a fresh project.
-- V4 does not require destructive database changes.
-- This file is intentionally safe to run after the V3 schema.
create index if not exists idx_watchlist_items_user on public.watchlist_items(user_id);
create index if not exists idx_alerts_user_active on public.alerts(user_id,is_active);
create index if not exists idx_analysis_history_user_symbol on public.analysis_history(user_id,symbol,created_at desc);
