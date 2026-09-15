# AURYN V9.9.9.37 — Automation Reliability + Investor Structure UX

## GitHub Actions
Audited every workflow in the V36 source tree.

KEEP
- AURYN V9.9.7 Autonomous Market Cycle — known-good scheduled orchestrator.
- AURYN SEC 13F Sync — independent quarterly institutional-data ingestion.

FIX
- AURYN Calibration Maturation — standardized around AURYN_BASE_URL + CRON_SECRET. The API now prefers CRON_SECRET before the legacy TRADING_LAB_CRON_SECRET, preventing an old Vercel legacy secret from overriding the credential used by the working Market Cycle.
- AURYN Portfolio Learning Snapshot — replaced obsolete AURYN_PRODUCTION_URL/TRADING_LAB_CRON_SECRET workflow contract with AURYN_BASE_URL/CRON_SECRET.

REMOVE
- AURYN V9.3.4 Market Intelligence Reliability
- AURYN V9.3.5 Reliability
- AURYN Market Scanner
- AURYN Paper Trading Runner
These were already disabled in GitHub and superseded by the current autonomous/canonical infrastructure.

Surviving workflow set: 4 files.

## Weekly structure UX
Internal wave engine terminology remains unchanged, but investor UI translates it:
- UNCONFIRMED/CANDIDATE -> Possible new uptrend
- IMPULSE_CANDIDATE -> Uptrend developing
- confirmed -> Uptrend confirmed
- ambiguous -> Trend unclear
- bearish/down -> Downtrend risk increasing

The explanation is built from actual Weekly HMA, 50-WMA, volume participation and confluence evidence. “What confirms this?” expands the methodology without cluttering the normal view.

## Verification
V37 tests pass plus the complete V36/V35/V34/V33/V32/V31.1 and legacy regression chain.
