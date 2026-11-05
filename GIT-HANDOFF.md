# Company card correction — November 5, 2026

Removed the rejected colored top strips from Home/Research company cards and summary metrics. Company cards use a visible logo-accent gradient (30% to 18%) across the rounded surface with a soft shadow and no outline or top stripe. Gain/loss colors remain on data and charts. Public/auth, layout, calculations and the removed Watchlist panels are unchanged.

Validation for this scoped CSS-only correction: Next CSS Modules compilation and archive manifest/CRC checks. Earlier 1,054 tests/build/API results apply to the unchanged functional source; this correction does not claim a new full-suite or browser screenshot run.

# Neutral workspace with meaningful color — November 5, 2026

This revision removes the broad tinted panels that made Portfolio and Research overwhelming. Reading surfaces, metric grids, chart canvases, allocation and controls use theme-neutral surfaces. Compact layouts, real charts, primary actions and icon hierarchy remain. Earlier color-material additions were replaced with the compact component styles instead of repeatedly recoloring the whole app.

Company cards now have a thin identity accent from representative colors sampled from bundled logo assets. Monochrome, unknown and remotely supplied logos use a neutral fallback. These accents do not indicate returns or business quality. Allocation dots/bars also use stable company identity instead of array position.

Company history and Portfolio chart colors follow the displayed first/last historical values: green rising, red falling, neutral flat/missing/invalid. Daily change badges remain independent from historical-window direction. Unrealized return uses its own signed financial value. The Portfolio chart still describes current quantities at historical prices, not actual account performance.

The two Watchlist panels requested for removal are removed: “Price is one part of the story” and “Keep your reason close.” Existing saved note data is not deleted. The watchlist description was adjusted to the remaining prices/events view.

Public landing, pricing and authentication files remain unchanged. The mobile header correction, Research chart-card paging and searchable-picker contrast isolation remain.

Validation: 1,054 full-suite tests passed; 8 final focused checks passed; TypeScript and component CSS Modules checks passed. New direction/logo identity tests were observed failing before the helper existed, then passed. Build/API results are recorded in the final verification report. No new dependencies, schema, paid feeds, trades or deployment. Browser/PWA visual acceptance remains pending.

# Calm app refinement — approved November 5, 2026

This full source replaces alternating bright data-card fills with one subdued sage surface, while retaining real graphs, icon badges, semantic price changes and primary actions. Approved public landing/login files remain byte-identical to the prior mobile-adjusted package. The mobile company-metric correction is retained.

Research now reuses Home company chart cards with four visible companies per page and accessible Previous/Next controls. Every saved company remains reachable. Returning pages reuse cached history; only visible missing series request chart data, sequentially. Missing or stale history remains explicit.

Searchable controls now own a theme-specific foreground/background pair independent of hero text. This corrects the unreadable expiration picker without changing option selection. Decision/evidence captions, portfolio values and supporting grids use paired ink/muted/semantic tokens on matching surfaces.

Validation for this revision: 1,052 tests passed, 0 failed; final TypeScript and all CSS Modules compilation passed. Production/API results follow the final verification report. Color-token contrast calculations: card body 9.55:1, caption 5.09:1, picker light 15.00:1, picker dark 13.35:1. These are checked token pairs, not a whole-app accessibility certification. Browser screenshots/PWA visual acceptance remain pending because the browser service is unavailable.

No new dependencies, schema migrations, paid feeds, trades or production deployment.

## Mobile metric header correction

The company header uses three compact metric columns at 360–600px and two below 360px. About metrics retains a 44px tap target with a smaller label. Desktop layout, all supplied metric values and help content are retained. Price-range facts below charts use their own full-width mobile layout to avoid crowding long currency ranges. Browser screenshot acceptance remains pending.

# Unified Home design extension — November 5, 2026

This full-source revision keeps the approved signed-in Home company cards and extends their lime, mint, sage and charcoal gradients into Research, Options, Portfolio, Watchlist, Settings, comparison charts, history and pricing. Real-chart data and financial calculations are unchanged.

- Public header now owns both its dark background and light foreground, including mobile navigation. This fixes the washed-out header shown in the supplied screenshot.
- Login uses the same charcoal story, lime/mint research cards and a contained readable form; existing authentication routes and validation remain intact.
- Research receives scoped presentation across Financials, case/ownership, Valuation, Technicals, Targets, News/earnings and Advanced. Evidence cards retain dates, missing-value handling and financial signs.
- Options retains the compact map-first controls and semantic heatmap cells, with coordinated headings, metric cards, Vanna, tape, learning and simulation panels.
- Portfolio and Watchlist attach their new scoped visual module; Settings and discovery/radar/inbox share the palette. Tables and form controls remain readable.
- Shared metric cards, decision evidence, position fit, comparison/history and pricing now use the same palette. Gain/loss colors are explicitly paired with bright and charcoal backgrounds.

No new dependencies, schema, provider requests, trading actions or production deployment are introduced by this presentation pass. The source package includes the previously implemented features documented below.

# AURYN 1.0.0 — complete workspace source candidate

Copy the contents of the AURYN folder into the existing application repository root. Keep existing environment settings; avoid nesting one AURYN folder inside another. No source push or production deployment was performed.

## Included in this revision

- Visibly redesigned charcoal/lime public hero with a graphical product preview, mint/citron gradients, icon benefits and working navigation. The public preview is explicitly schematic, not live market data.
- Restored the functional dark comparison hero on signed-in Home. Added four vivid company cards with real dated price-area charts, while retaining the single earnings calendar, reminders and research radar.
- Expanded compact supported stock-header metrics; richer shared-scale shaded sensitivity diagrams; grouped technical reference levels and compact targets/options layouts.
- Existing Pace policy, sector/currency/date guards, financial statements, portfolio/settings/watchlist and research tools retained.
- Map-first exposure workspace with inline controls, readable heatmap values, relevant controls per view, optional diagnostics, device history, saved-symbol comparisons and exports; signed account checkpoints, discrete replay and cross-device presets remain available below the map.
- Exposure approach/cross/change alert backend with fresh signed baselines, spot-rebased change comparisons, concurrency protection and retryable deduplicated events in the existing alert center.
- Modelled vanna heatmap with editable assumptions, optional bounded historical options trade tape, and a simulated long-options cash ledger with explicit device/account saves.
- Optional same-provider AI capacity fallback remains server configured; all source/access/budget validation remains enforced.

## Home chart loading

Home shows at most four followed-company price charts. It reuses supplied/cached history and loads missing one-month series sequentially through the existing authenticated chart API. It does not fan out full research requests. Current-day incomplete observations and stale/future/malformed histories are withheld; dates are visible. Cancellation is owned by the component so a replaced request cannot reuse an aborted pending promise.

The one-company sector map no longer dominates Home; it remains available inside the research radar. Comparison tools, existing earnings, options and portfolio features are retained.

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

- Full automated suite: **1,051 passed, 0 failed, 0 skipped**.
- Final options/exposure render regressions: **7 passed**, including missing-input handling, replay controls and readable inspection.
- Strict TypeScript check and final production build passed; 34 static pages generated and dynamic API routes retained.
- All nine API regression scripts passed with mocked/synthetic transport; no live payment or trade executed.
- Independent reviews addressed checkpoint identity/freshness, compact rule-bound baseline storage, concurrent saves, event retries, source contract identity, replay selection and focused keyboard controls.
- Source archive CRC and per-file manifest are checked by `scripts/package-source.py`; private environment files/dependencies/generated output are excluded.

Visual acceptance remains pending because the browser preview service timed out. Review desktop/mobile/PWA screenshots and real-account cross-device behavior before production promotion.

### Verification-host note

The managed verification filesystem intermittently returned `ENOTEMPTY` while Next deleted its temporary `.next/export` directory, after all static pages had rendered. The final verification build used a temporary external Node preload that adds bounded filesystem `rm` retries. Application source, Next dependencies and runtime behavior were not patched; the host-only helper is excluded from the ZIP.
