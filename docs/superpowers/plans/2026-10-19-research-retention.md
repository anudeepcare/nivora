# Research credibility and retention implementation plan

Goal: implement the supplied commercial research feature list incrementally without fabricating evidence or replacing the working shell.
Architecture: pure financial evidence functions, existing authenticated documents/observations/alerts stores, optional research tools. No new dependencies or production writes.
Spec: docs/COMMERCIAL_LAUNCH_PLAN.md and user attachment Pasted text(20261019-001155).txt.

Constraints: preserve PWA shell; per-metric status is reported/calculated/estimated/conflicting, never claim independently verified; do not copy competing proprietary signals; no unlicensed public data or fake testimonials; no recurring charges until configured and tested.

Tasks:
- Add lib/research-integrity.ts for period/currency/unit provenance, runway, dilution, saved observation comparisons and peer-cohort statistics. Test extreme negative margins, mismatched currencies, missing history and tiny peers.
- Persist earlier-view observations on device with account-scoped keys; show first-observation baseline and threshold changes, never manufacture earlier history.
- Extend existing financial alerts using latest comparable reporting period. First check creates baseline, later safe-to-breached crossing creates a deduplicated in-app event. Missing measurements must not clear a known breach.
- Expose comparison and thesis/pre-mortem tools under optional research workspace; add earnings preparation, cash/dilution context, print-friendly brief and source inspection.
- Expand portfolio context from already-loaded reports with coverage labels; do not fetch every holding merely to create an inflated score.
- Verify tests, build and API fixtures. Package exact source with requirement status.

External launch dependencies: activated Stripe and server webhook/entitlement integration; commercial data rights; SMTP/email subscription consent; brokerage OAuth provider; full industry universe and licensed public samples; legal review. Teams/B2B/extensions/educator programme require separate working products, not promotional placeholder buttons.
