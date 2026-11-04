# Broad build: implementation and acceptance ledger

Approved scope: docs/BROAD_BUILD_SPEC.md. Implementation plan: docs/superpowers/plans/2026-10-18-broad-build.md.

| Area | Implementation | Acceptance / limitation |
|---|---|---|
| Beginner through professional research | Separate business, valuation and timing in DecisionBrief; simple overview plus grouped technicals and professional financial table | Research triage, not a calibrated trading recommendation |
| Financial trends | Annual/quarterly revenue, margin, cash after capex and diluted shares charts; missing points retain gaps | Only returned comparable periods; no invented values |
| Full metrics | Existing financial catalog exposed by group, period, definitions and CSV | Sector exclusions preserved; absent datasets remain unavailable |
| Comparable companies | Up to four user-selected reports, shared cache, sector, scope, basis, dates and currencies; CSV | No invented peer set; no ranking of incompatible periods |
| Earnings | Actual/estimate/surprise history; dated future estimate cards; export | Historical EPS basis/currency not always supplied; this is disclosed |
| Scenarios | Visible bear/base/bull sensitivities with horizon and assumptions; existing currency/ADR/share guards | NOT a new company-specific intrinsic-value model; missing credible inputs still withhold prices |
| DCA | 0–4x, confirmed/forming, twelve-month detail, strongest settled daily reading, equal-budget historical simulation with costs and cash | Original model, not competitor rules; monthly drawdown only; no claimed advantage |
| What changed | Observed reporting-period, same-period revenue and same-period/currency estimate changes; Home session briefing | Session observations only; not persistent historical estimate revisions |
| Home events/news | Holdings/watchlist calendar, safe recent news links, partial failures | Calendar up to 30 symbols; headlines first three; no full-portfolio streaming news |
| Portfolio context | Aggregated concentration, sector/crypto/cash exposure, pricing/stale coverage and observed session change | Classification uses opened reports; unknowns explicit; no deposit-adjusted time-weighted return without transactions |
| Alerts | Existing price/confirmed-zone/filing rules plus earnings-within-1–30-days reminder, deterministic dedup | Manual check or configured owner job; no push/email delivery added; schedules require operator configuration |
| Discover | Existing bounded screening and saved filters; now reuses account research cache | Focused 12-symbol universe, not a market-wide institutional screener |
| Ownership / insiders / filings | Dated ownership and top holder table added to Thesis; existing insider and original filing evidence retained | Delayed reports, not live whale activity |
| AI | Existing opt-in evidence-ID-backed summaries, account allowance and disabled/unconfigured state retained | No paid AI calls made; live generation unverified |
| API coverage | EODHD v1.1/legacy whole-report fallback, Twelve quote/search/enrichment fallbacks, server caches and dataset coverage display | Private tokens/plan entitlement not verified locally; All-in-One is not proof of all Marketplace add-ons |
| Smooth loading / search | Matching-account stale cache while refreshing, 200ms debounce, shared request dedup and bounded scans | No measured production/iPhone frame-rate or latency claim |
| PWA / footer / themes | Prior working-reference document-scroll/safe-area fixes, keyboard dock handling, footer flex layout and scoped responsive grids retained | Physical installed-iPhone acceptance remains required; browser could not reach local preview |

## Independent review and fixes
- Financial trend period controls now survive missing quarterly data. Regression rendered the actual component in that state.
- Concentration combines lots by symbol. Multiple-lot regression passes.
- DCA simulation excludes months missing the expected final market session. Truncated-month regression passes.
- Comparison preserves scope, basis and start/end; comparable status rejects basis/duration/scope mismatches. Exports retain those fields.

## Rulings
- Implement the approved supported research functionality in the existing approved application, not a new visual redesign or wholesale integration replacement. This preserves accounts and avoids adding data cost; a ground-up infrastructure rebuild is outside this repair.
- Retain unavailable numerical valuations rather than invent missing FX, ADR ratios or company funding assumptions. Cost: some companies cannot show defensible numeric cases with current evidence.
- Keep changes session-local until a validated point-in-time snapshot store is designed. Cost: changes do not survive signing out or a fresh page load.
- Do not introduce paid options/gamma/ESG/marketplace datasets or commercial data redistribution. Existing subscription access and licensing need verification first.
- Do not commit the mixed pre-existing working tree or deploy automatically. Deliver a full source archive for the established deployment flow.

## Outstanding acceptance
Installed-iPhone layout and keyboard behaviour; rendered desktop/mobile visual comparisons; private provider entitlement/accuracy probes; authenticated production workflows and broker paper execution. No production-ready or exact-visual-parity claim is made. These are verification/data limits, not hidden finished items.
