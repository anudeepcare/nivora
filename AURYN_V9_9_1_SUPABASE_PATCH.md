# AURYN V9.9.1 Supabase Patch

After deploying V9.9.1, run:

`supabase/migrations/20260912100000_auryn_v991_validation_integrity.sql`

This intentionally:
- deletes the 8 invalid NULL-decision Shadow CIO observations and their outcomes,
- marks the original V9.9 smoke run as FAIL/superseded,
- cancels its remaining jobs,
- deactivates the alphabetical cohort so V9.9.1 rebuilds the validation universe.

It does **not** delete the run itself. The failed run remains as an audit record of why the observations were excluded.
