# Interrupted-work reconciliation — 7 November 2026

Source baseline: saved version 49, recovered from version 48. Prior chat recovery identified code not included in either ZIP.

| Requested work | Baseline | Recovery action |
| --- | --- | --- |
| Holdings-aware contribution planning | Implemented, 1,156-test baseline passed | Preserve |
| Pace public explanation | Implemented | Preserve |
| CSS/hooks/format cleanup | Implemented | Preserve |
| Real-user validation records | Implemented; actual participants still required | Preserve; do not fabricate sessions |
| Current-policy raw-price backtest replay | Missing | Restore actual monthly-v5 replay, timing checks, P0/P1=0/P2=1/P3=2/P4=4 accounting |
| Prospective publication verification | Missing | Match actual same-stock record, policy, period and publication before execution |
| Account-scoped scheduled thesis checks | Missing | Restore installed leased queue integration, access gates, disabled/revised rule protection |
| Database migrations | ZIP said unapplied | Read-only verification confirms three installed migrations; restore exact queue SQL and document version mapping |

Installed versions: 20261107142000 public record (local equivalent 20261107135009); 20261107143506 request limits (local equivalent 20261107140000); 20261107143633 thesis queue (restored verbatim). Do not reapply equivalent create-table migrations blindly. No database writes in this recovery.

Fresh build/test baseline is recorded in verification/recovery-20261107. Final checks will run after the missing implementations are restored. No live deployment claimed.

## Restored code
- Raw daily-price replay through current monthly-v5, with dates/availability/close/multiple verification. CLI requires replay.
- Same-stock publication verification and a read-only prospective comparison CLI, with actual database receipt lookup before execution, not a caller-supplied publication timestamp.
- Bounded account queue with current access checks, lease/revision-bound atomic alerts, disabled-rule protection, and separate `/api/jobs/theses` endpoint.
- Current policy public record count is zero. This is a working verification/calculation path, not an invented performance series. Audited return data and actual future observations remain necessary.
- No database writes or production deployment in this recovery pass.

## Review fixes
- Fixed opening-mark drawdown omission; two-month 100→200→100 regression now reports a 50% drawdown.
- Added follow-up source-body guard migration: preserved timestamps cannot permit stale scheduled alerts. Lease wall-clock expiry is checked after locking. This new migration remains pending release; the three recovered migrations are already installed.
- Separate protected thesis route preserves the original alert/paper/support job budget.
