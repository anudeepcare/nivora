# AURYN V9.3.4.2 — Price Truth + Fast Load Hotfix

## Milestone
Restore trustworthy price identity across regular and extended sessions while reducing cold ticker latency without weakening Market Truth or completed-bar decision stability.

## Production defects fixed
- Twelve Data modern split extended-hours quote responses no longer treat `previous_close` as the current regular-session close after the bell.
- `extended_price` and `extended_timestamp` are consumed when present; legacy `is_extended_hours` quote responses remain supported.
- MU/NBIS/SKHY carry explicit NASDAQ/USD provider identity hints.
- Core analysis is daily/weekly-first; a slow 4H request cannot hold the first decision render hostage.
- 15M/1H/4H tactical context remains progressive and cannot silently rewrite confirmed daily/weekly structure.
- Optional benchmark and Market Truth work on the analysis route have bounded first-render deadlines.
- Twelve Data live quote timeout is capped at 2.2 seconds so the primary price header cannot wait 4.5 seconds on one provider.
- The live audit includes MU/NBIS/SKHY price-identity sentinels and detects a current regular close that disagrees with the same-session completed daily anchor.

## Acceptance gate
- `npm run test:v9342`
- `npm run test:engine`
- `npm run gate:v934`
- After deployment, `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:30`

V9.3.4.2 remains CODE_READY_LIVE_VALIDATION_REQUIRED until the deployed live audit passes. No code-only result advances the roadmap.
