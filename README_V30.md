# NIVORA V30 — 9.5 Architecture Release

This release focuses on engine quality rather than adding visible clutter.

## Core upgrades
- Provider registry decouples NIVORA from any single API.
- Evidence-quality framework: fresh/cached/stale/missing/error.
- Regime-aware decision fusion.
- Confidence calibration cannot outrun evidence quality.
- Valuation contribution added to long-horizon decisions.
- Best-expression engine can prefer shares, no leverage, balanced calls, or LEAPS.
- Pro Workspace exposes regime, valuation, data quality, contradictions, attribution and audit evidence.
- Model registry + provider-health database foundation.
- System health endpoint.
- Server-side validation snapshot infrastructure retained and upgraded to V30.
- Server-side rate-limit primitive added for API hardening.

## Important
Architecture quality can be production-grade before premium data is purchased.
Real-time institutional options/flow quality and proven predictive alpha still require
better licensed data and measured out-of-sample results. V30 does not fabricate those claims.

## Supabase
Run both migrations:
- 20260829_nivora_validation.sql
- 20260829_nivora_v30_enterprise.sql

For validation persistence add SUPABASE_SERVICE_ROLE_KEY to Vercel as a server-only secret.
Never prefix it NEXT_PUBLIC_.
