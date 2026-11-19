# Resumable account history release prerequisite

Apply `supabase/migrations/202611170001_account_history_jobs.sql` to the intended deployment database before deploying the updated AccountHistory UI. This source delivery does not apply it. The feature requires the existing transaction ledger migration, Supabase service-role configuration and existing shared EODHD market protection. No service-role credential belongs in browser configuration.

The UI now uses `/api/account-history/jobs`. Missing job storage fails closed with a migration-required message; it does not fall back to a partial ten-holding chart. Authenticated owners can read only their jobs; only server service-role code can create evidence, claim work or publish results.

Scope: complete user-confirmed inception ledger, up to 50 historical US-listed USD instruments (including sold holdings), one year and 5,000 transactions. Each request fetches at most two endpoint datasets. Evidence/results expire after 24 hours; interrupted work resumes for the same owner, saved ledger revision, daily window and implementation version. Ledger snapshot equality and revision are checked atomically before publication. No result is published until every mandatory evidence task completes and financial validation succeeds. Invalid evidence produces an unavailable result, never a subset chart.

Browser closing pauses processing; no background worker or recurring schedule is required. Reopen, review the ledger and Build to resume. Transient mandatory-provider failures preserve completed reads and stop the loop. Benchmark errors do not conceal valid actual performance; unavailable comparisons remain disclosed. SPY/QQQ adjusted series are fetched whole-window, never stitched from different adjustments.

After migration in preprod: test an authorized 28-holding complete ledger, refresh during processing, resume, edit the ledger during processing, inspect unavailable price/split cases, and confirm mobile/desktop chart accessibility. Do not use mock fixtures or synthetic numbers as account data. Shared market budget guards must remain enabled; this feature does not alter hosting plan or provider entitlements.
