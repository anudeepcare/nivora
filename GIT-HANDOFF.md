# AURYN 1.0.0 — complete workspace source candidate

Copy the contents of the AURYN folder into the existing application repository root. Keep existing environment settings; avoid nesting one AURYN folder inside another. No source push or production deployment was performed.

## Included in this revision

- Reworked public product page and aligned, padded sign-in/signup/recovery screens with responsive styling.
- One Home earnings view with dated actual EPS/estimates/pending status, compact reminders and loaded-company breadth/rotation.
- Expanded compact supported stock-header metrics; clearer historical scenarios; grouped technical reference levels and more compact targets/options layouts.
- Existing Pace policy, sector/currency/date guards, financial statements, portfolio/settings/watchlist and research tools retained.
- Exposure map, device history, saved-symbol comparisons and exports, plus signed server-captured account checkpoints, discrete replay and cross-device view presets with save-conflict checks.
- Exposure approach/cross/change alert backend with fresh signed baselines, spot-rebased change comparisons, concurrency protection and retryable deduplicated events in the existing alert center.
- Modelled vanna heatmap with editable assumptions, optional bounded historical options trade tape, and a simulated long-options cash ledger with explicit device/account saves.
- Optional same-provider AI capacity fallback remains server configured; all source/access/budget validation remains enforced.

## Setup

The existing documents, observations and alert-event database migrations must already be installed. This revision does not introduce a new schema migration or change account privileges.

Configure `AURYN_MARKET_SNAPSHOT_SIGNING_KEY` as a stable server-only secret of at least 32 characters for account history and exposure-alert baselines. Existing service-role key or a sufficiently long cron secret is a fallback. Key rotation invalidates previous signatures. Never add a `NEXT_PUBLIC_` prefix.

Trade tape is disabled by default. Enable `AURYN_OPTIONS_FLOW_ENABLED=true` only with existing options access, valid Alpaca credentials, appropriate subscription and confirmed display rights. The adapter fetches one bounded historical page with optional 15-second polling; it is not a streaming feed.

Existing alert check endpoints/owner cron perform exposure checks. First check establishes a baseline; this does not create continuous multi-tenant workers or email/SMS delivery. The simulation is not broker execution, and it does not invent expiration settlement prices.

Read [coverage and boundaries](docs/verification/2026-11-05-workspace-coverage.md) for the complete area-by-area mapping. Full market-wide flow, dark-pool tape, licensed minute backfill, proprietary classifications, and other unsupported datasets are not claimed.

## Source completeness

Application, lockfile, fixtures/tests, scripts, existing SQL migrations, deployment guidance and exact per-file SHA256 manifest are included. Generated output, dependencies, private environment files, screenshots and prototypes are excluded. ZIP size does not imply faster provider response.

## Verification

Automated results are recorded below. Tests use synthetic transport; they are not live-provider acceptance. Browser preview timed out, so new screenshot, installed-iPhone/PWA and real-account cross-device visual/interaction acceptance remain pending. No claim of visual certification is made.

### Automated results

- Full automated suite: **1,046 passed, 0 failed, 0 skipped**.
- Final options layout render regression: **3 passed** after collapsing extra statistics.
- Strict TypeScript check and final production build passed; 34 static pages generated and dynamic API routes retained.
- All nine API regression scripts passed with mocked/synthetic transport; no live payment or trade executed.
- Independent reviews addressed checkpoint identity/freshness, compact rule-bound baseline storage, concurrent saves, event retries, source contract identity, replay selection and focused keyboard controls.
- Source archive CRC and per-file manifest are checked by `scripts/package-source.py`; private environment files/dependencies/generated output are excluded.

Visual acceptance remains pending because the browser preview service timed out. Review desktop/mobile/PWA screenshots and real-account cross-device behavior before production promotion.
