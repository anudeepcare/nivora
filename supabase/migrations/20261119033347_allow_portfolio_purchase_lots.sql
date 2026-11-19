-- Each purchase is a separately editable UUID-backed lot. Legacy installations
-- may still have this standalone unique index from the one-row-per-ticker model.
-- Remove only that index; retain every row, the UUID primary key, owner lookup
-- index, grants and row-level security. No replacement lookup is needed because
-- workspace queries filter by user_id and auryn_positions_owner already exists.
-- No CASCADE: unexpected dependent constraints must stop this migration.
DROP INDEX IF EXISTS public.portfolio_positions_user_account_symbol_uidx;
