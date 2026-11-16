# AURYN: Pro data integration and presentation reliability

16 November 2026. Source ZIP candidate, not a production-deployed or visually accepted release. Supersedes the earlier clean-rebuild package.

## What changed

- Kept the clean presentation architecture and repaired actual missing style ownership revealed by the latest screenshots. Native-looking buttons, concatenated labels, black cash-flow bars and ungrouped metrics were caused by raw classes whose old global styles had been removed.
- Added scoped owners across investment case/ownership/Ask AURYN, Financials, Technicals, Pace readouts, overview metrics, personal valuation models, Research tools, portfolio balances/exposure/benchmarks/position editor, Settings metadata, Home agenda, feature-access notices and PWA update controls. Existing handlers and financial calculations are preserved.
- Added a reproducible active import/raw-class inventory. This is substantially broader than the earlier module-export audit, but is not proof of rendered layout or contrast.
- Price history can display independently while slower fundamentals and Pace finish. Controlled tests hold fundamentals unresolved and verify that the chart path still completes. Existing history access limits are enforced; no invented partial financial model is displayed.
- Paid SentiSense profile/consensus targets now use a separate authenticated request, so they cannot delay the base research response. Matching fresh observations merge without changing quote, history or financial timestamps. Existing authenticated users may receive targets according to current feature access; no new owner-only gate in paid mode.

## Pro mode setup

The Pro key has been securely configured in Vercel. It is not in this ZIP.

1. Apply the included private cache migration `20261116001606_auryn_preview_target_cache.sql` to the intended database after review. It has NOT been applied by this work. Missing cache RPC deliberately prevents optional upstream requests.
2. Deploy the source through the agreed preprod workflow. Set `AURYN_SENTISENSE_MODE=pro` in the intended hosted environment when rolling out this code. This work has not set that flag or deployed.
3. Paid mode supports Preview and Production-capable code, without automatically promoting production. It ignores old temporary-key expiry configuration and has distinct cache/rate/denial identities. Existing temporary owner-preview behavior remains when Pro mode is absent.

Dedicated target requests have a 20-second end-to-end budget, cancel queued operations and abort started transport. Successful observations cache for one hour. Shared limits are 4 requests/second and 240/minute, below documented 300/minute; there is no trial 24/day cap in paid mode. Denials/uncertain outcomes have a conservative shared cooldown. No uncontrolled retry loop.

## What this does not claim

- Not all 113 documented SentiSense endpoints are active. Paid runtime integration currently covers profile and analyst consensus. An estimates normalizer is contract-tested but not fetched/merged because documented estimates omit an observation timestamp. No fake freshness is assigned.
- Existing price/history/fundamental/news/options providers remain. Long SentiSense histories differ in granularity and adjustment basis; options analytics are not a full contract chain. No EODHD/Twelve subscription has been canceled.
- Pro key/account provisioning was observed, but this code has not fetched live paid payloads: the key remains securely held in Vercel and no new code was deployed. Fixtures do not establish universal stock coverage, exact DCA parity or commercial redistribution rights.
- The chart-first change removes a specific dependency, not every source of delay. Full Pace still requires complete research; no live mobile loading-time benchmark is claimed.
- Fresh browser/device rendering remains unavailable after explicit environment denials. No bypass attempted. No pixel-perfect, zero-bug, iPhone/PWA-device acceptance or production-ready claim is made.

## Verification

Final commands and counts are recorded in `verification/pro-reliability-20261116/INDEX.md` and accompanying logs. Independent review and exact raw-style scope are included under verification. Read these before production promotion.

Extract at repository root, preserve environment configuration, install dependencies and review deployment settings/migrations. `/build-info.json` identifies the packaged source after deployment.
