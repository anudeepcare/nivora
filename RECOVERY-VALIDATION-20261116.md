# Preprod QA candidate, not final acceptance

Recovered persisted Nov16 source with restored forming-Pace display patch.

Passed locally: 1,849 tests (0 failures), lint, Prettier, TypeScript, Next production build. Forming provisional Pace remains visible but cannot authorize increased buying.

Deploy to preprod only. Use existing SentiSense Pro research and EODHD live-price configuration. No Twelve Data. Do not apply Supabase migrations or deploy production from this candidate.

Remote preprod remains20a395fd000ac8c685141ddd00d1bf7cc1ae221e: connector write returned403 and no commit/ref was updated. Authenticated live API checks and mobile/desktop visual acceptance are still required after deployment.
