# Settings reference implementation status

Reference inspected: published Figma Settings component and CSS, 17 November 2026. This is not rendered-browser parity acceptance.

Implemented:
- Full-width stacked preference composition, reference heading and research-experience choice cards.
- Research glance/deep/swing cards use the existing persisted detail/horizon preferences.
- Five signal visibility preferences use the account-backed workspace document, sanitized `hiddenSignals` values and existing account isolation/save/error handling. They change research presentation, not API entitlements, alerts or access permissions. All signals show by default.
- Existing theme, text size, reduced motion, spacing, research style, horizon, chart range, watchlist order and concentration-threshold controls retained.
- Account security, sign-out, plan, support and analytics controls retained.

Notification support and remaining gaps:
- Settings offers setup shortcuts for existing Pace, earnings and filing in-app rules. Explicit creation is required. Existing `/api/alerts` supports reading history, running checks and marking events read. General rule checks are manual unless the owner-scoped `/api/jobs` integration is separately configured.
- Thesis monitoring separately produces in-app events through `lib/thesis-monitor.ts` and the guarded SQL publisher for opted-in notes; the committed cron configuration targets that thesis worker only. Deployed operation has not been verified.
- Category-specific delivery cadence, estimate-revision alerts, and email/push delivery remain unavailable. No such delivery or subscription is represented as active.

Additional implemented guardrails:
- Cash reserve percentage is persisted per account and checked in PositionExplorer and ContributionCompare for cash-funded hypothetical additions. The review calculates the reserved portion and available recorded cash, and flags proposed spend above that amount.
- Maximum loss percentage is persisted per account and compared with OptionsDesk modeled maximum loss for the displayed one-contract-per-leg strategy. It does not treat Bear-case scenarios as guaranteed maximum loss.
- Both checks fail closed with incomplete/non-stale USD portfolio pricing and clearly describe themselves as reviews, not order restrictions or broker buying power. Defaults remain off rather than copying demo limits.

Remaining visual gaps:
- Reference-only accent palette choices and some control composition differ from existing working appearance controls.
- Browser-level responsive interaction, screenshot matching and live authenticated persistence have not been verified in this environment.

Validation: targeted settings and workspace-document tests cover card mappings, supported signal-key sanitization, preview write lock, account navigation/sign-out and unavailable-delivery controls. Full integrated suite remains the coordinator's responsibility.

## Compact settings review
Removed the rendered research preset cards because they duplicated independent depth/horizon controls. Research style, horizon, depth, chart range, watchlist order, overview cards, appearance/accessibility and account controls remain available. All three portfolio limits now have one Decision Policy owner; the nested workspace preference concentration control is suppressed only on Settings. Signals are first, arranged in two columns on desktop and one on mobile, with inline accessible information hints. Direct section anchors and a top-level Price alerts link reduce scrolling. The notification section has supported in-app setup links and an explicit no-email/push notice, not fake disabled category switches. No live account writes or deployment were performed in this refinement. Component tests, typecheck and lint verify source behavior; rendered desktop/mobile visual QA remains pending.

## Supported notification setup (17 November)
Settings now links to three existing opt-in in-app rule types: exact confirmed monthly Pace zone, earnings approaching, and new filings. The Alerts builder preselects only these allowlisted types; navigation does not save or enable anything. The user must choose a company/condition and explicitly create the rule through the existing authenticated, account-scoped documents API. Preview navigation remains under /preview and writes stay blocked. This is not category subscription or email/push delivery.

Delivery/cadence remains an actual backend gap: /api/jobs checks only AURYN_ALERT_JOB_USER_ID when configured, while vercel.json schedules only /api/jobs/theses. No category-specific email/push consent/preferences store, external delivery queue, unsubscribe handling, estimate-revision alert producer, or email/push alert worker exists. Thesis in-app alerts are already supported separately: the thesis queue and source-guard migrations define auryn_publish_thesis_alert, which inserts deduplicated events only for an explicitly monitored note with matching revision and an active worker lease. The scheduled thesis endpoint is distinct from the owner-scoped general alert checks. This source-level support does not verify that migrations or scheduled execution are active in a deployed environment. Support-email retry is not an alert transport. No new cron, provider send, account write, migration, or deployment was performed. Existing events retain user/rule/event uniqueness and account-scoped RLS. A complete delivery feature needs those backend pieces and explicit operational configuration; persisted cadence controls alone would misrepresent functionality.
