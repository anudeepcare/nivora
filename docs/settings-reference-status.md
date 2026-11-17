# Settings reference implementation status

Reference inspected: published Figma Settings component and CSS, 17 November 2026. This is not rendered-browser parity acceptance.

Implemented:
- Full-width stacked preference composition, reference heading and research-experience choice cards.
- Research glance/deep/swing cards use the existing persisted detail/horizon preferences.
- Five signal visibility preferences use the account-backed workspace document, sanitized `hiddenSignals` values and existing account isolation/save/error handling. They change research presentation, not API entitlements, alerts or access permissions. All signals show by default.
- Existing theme, text size, reduced motion, spacing, research style, horizon, chart range, watchlist order and concentration-threshold controls retained.
- Account security, sign-out, plan, support and analytics controls retained.

Still pending, visibly disabled:
- Notification policies for thesis changes, Pace confirmation, earnings preparation, filings and estimate revisions. Existing `/api/alerts` supports reading alert history, running checks and marking events read; it does not implement these category-specific delivery cadence controls. No delivery or subscription is represented as active.
- Notification cadence remains pending as described above; no automatic email/push scheduling is activated.

Additional implemented guardrails:
- Cash reserve percentage is persisted per account and checked in PositionExplorer and ContributionCompare for cash-funded hypothetical additions. The review calculates the reserved portion and available recorded cash, and flags proposed spend above that amount.
- Maximum loss percentage is persisted per account and compared with OptionsDesk modeled maximum loss for the displayed one-contract-per-leg strategy. It does not treat Bear-case scenarios as guaranteed maximum loss.
- Both checks fail closed with incomplete/non-stale USD portfolio pricing and clearly describe themselves as reviews, not order restrictions or broker buying power. Defaults remain off rather than copying demo limits.

Remaining visual gaps:
- Reference-only accent palette choices and some control composition differ from existing working appearance controls.
- Browser-level responsive interaction, screenshot matching and live authenticated persistence have not been verified in this environment.

Validation: targeted settings and workspace-document tests cover card mappings, supported signal-key sanitization, preview write lock, account navigation/sign-out and unavailable-delivery controls. Full integrated suite remains the coordinator's responsibility.
