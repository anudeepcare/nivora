# Repository and live-service follow-up — 15 October 2026

Repository inspected: https://github.com/anudeepcare/nivora, main commit `1534d2ca838c0137a1df8e5d1c971a6fcf3dbca6`.

GitHub reports Vercel success for this commit. This is evidence about the existing repository deployment, not evidence that the source in this ZIP has been deployed. The current deployment and rebuilt source differ.

## Confirmed and corrected

- Restored the four repository workflows missing from the earlier ZIP: market scanner, paper runner, V9.3.4 reliability and V9.3.5 reliability. The historical test aggregate improved from 645/86 to 649/82 before subsequent UI corrections. No old assertions were changed to obtain that result.
- A live canonical AAPL response reported research state `STALE_VERIFIED` with September research against an October quote. The portfolio/watchlist/monitor now suppress current calls and thesis scores from research that is not `READY`, and explain that analysis needs refreshing.
- Restored model action-ladder and promotion-blocker evidence from the existing model-health API in the calibration page.
- Independent source reviews identified additional price-level gating and operational-visibility gaps. Their reports and the fixes are included alongside this report.

## Live observations and limits

- `https://getauryn.vercel.app` returned HTTP 200.
- `/api/quote/AAPL` returned a last-available after-hours observation, with execution explicitly unverified. Twelve Data returned HTTP 403 for extended-hours intraday data because the configured subscription does not include it. The application must retain a labeled fallback; this cannot be solved by pretending the feed is live.
- `/api/canonical?symbols=AAPL` returned an official-close research anchor with execution blocked, alongside stale stored research.
- `/api/model-health` returned `UNPROVEN`, zero exact-engine matured observations and explicit promotion blockers. This is an evidence state, not proof that predictions are accurate.
- GitHub run https://github.com/anudeepcare/nivora/actions/runs/38815735431 succeeded as a process, but its logs reported 12 processed out of 40 attempted jobs, stale-data failures and a still-running final research batch. A green workflow status does not mean all research jobs succeeded.
- The connected `nivora` Supabase project has the expected profiles, portfolio, watchlist and alert columns. RLS is enabled on those tables and policies constrain rows by `auth.uid()`. This was a read-only schema/policy inspection, not a two-user authentication/CRUD test. The manual paper-order audit table was absent.

No GitHub branch was pushed, Vercel deployment changed, database migration applied, provider subscription changed, or paper order submitted during this follow-up. The local environment still has no vendor/broker/service-role secrets. Existing production secret values cannot be read through the GitHub connector.

## Final local result

Production build PASS. Current behavioral suite: 447 passed, zero failed. Historical aggregate: 650 passed, 81 failed; retained exact source/file/copy assertions are audited separately. Follow-up browser checks: 10 affected pages/widths and 44 research tabs/themes/widths, no runtime errors or horizontal overflow. The code changes have not been pushed or deployed.
