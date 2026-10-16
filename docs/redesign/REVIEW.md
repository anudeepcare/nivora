# Independent review and fixes

A separate review of the rebuilt source identified and checked:

- Chart range change could retain a prior nonempty series after an empty response. Clear on change, empty and failure.
- Portfolio balance API converted null/empty inputs to zero. Reject nonnumeric input; regression test added.
- Disabled automated paper execution appeared to be a completed zero-decision run. Explicit disabled/unavailable/error messages now shown.
- Manual cash/position checks needed aggregate broker protection. Manual orders now require broker-enforced no-short and 1× margin configuration; use available buying power and available shares. No settings are changed by the application.
- Lost submission responses could lose request identity. Persist the request per authenticated user, block replacements when outcome is uncertain, and reconcile saved audit status.
- A claim conflict can mean an in-flight submission. API explicitly requires reconciliation and UI retains the same request.

Tests exercise pure risk guards and route behavior with mocked broker/database calls. They are not evidence of a real broker submission. Live broker behavior and the SQL migration remain unverified without deployment access.
