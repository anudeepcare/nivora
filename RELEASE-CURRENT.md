# Current source candidate — November 17, 2026

Version: 1.0.0. Status: implementation review and internal testing.

This document describes the current source handoff, not a production deployment, a guarantee that every paid endpoint is available, or completed desktop/mobile acceptance. Earlier release notes and historical validation results are preserved in `docs/release-notes-nov08-historical.md`; they are not current verification evidence.

## Scope

This pass refines the existing working implementation toward the supplied design. It is not a claim that a new codebase was independently built from zero or that every screen exactly matches Figma. Useful existing research, paid-product groundwork, account controls, and specialist tools are intended to remain accessible. Duplicate presentation is consolidated rather than treated as permission to remove features.

## Implemented in this candidate

- Compact research, Today, comparison, and portfolio presentation. Existing calculations and specialist tools remain separate from visual refinements; no financial accuracy claim follows from a layout change.
- Settings places signal controls first, provides section navigation, and consolidates position concentration, cash reserve, and modeled options-loss preferences into one guardrail section. These are decision-support reviews, not order execution or trading restrictions.
- Saved research-panel visibility is applied without changing provider permissions or subscription entitlements. Research style, horizon, depth, appearance, chart/watchlist defaults, and account controls remain available.
- Support inbox refresh and filter reset, clear external-email reply behavior, and a distinction between provider acceptance and delivery. Retry behavior remains a real resend operation, not a preview action.
- Compact owner handbook and help reading surfaces. Help search trims spaces, reports matches, and can be reset. Owner-only content and authorization remain protected.
- Aligned pricing and footer layout, retained plan and legal links, and concise current What's New notes. Candidate notes do not trigger a published-release announcement.

## Important boundaries

- Account history must not be presented as reconstructed performance from today's holdings. The implemented ledger workflow requires supported complete records and dated evidence; missing evidence must remain unavailable rather than invented. Holdings gains/losses and current allocation are different measures.
- Price timestamps, missing datasets, and provider coverage still matter. A successful refresh does not prove a new market observation or universal endpoint entitlement.
- Additional notification delivery is not active. Existing in-app alert setup must not be described as email/push delivery.
- Analyst targets, conditional valuation scenarios, historical ranges, and Pace answer different questions. No reference-provider parity, future-return accuracy, or new independent validation is claimed here.
- Paid-product groundwork has not been declared production-ready merely because its controls exist. Live provider access, supported datasets, billing, communications, and sensitive account actions require their own verification.

## Verification status

Focused settings, guardrail, help, admin/support, access, and release-note tests have been run during implementation. TypeScript and ESLint have also been run on the working tree. Exact final integrated test totals belong to the final build report because other changes can still occur before packaging.

Still pending as acceptance criteria: end-to-end live-data checks, the complete screen/interaction inventory against the supplied reference, desktop/mobile/installed-app review, independent financial/reference reconciliation, and confirmation of complete paid-plan endpoint coverage. Do not label the application fully verified on the basis of unit tests alone.

## Delivery

This work does not deploy the application, send support messages, purchase services, or change live account data. Deployment and environment configuration are separate from the source handoff. Do not apply historical SQL or migration instructions solely because they appear in archived notes; use the current setup documentation and verify the intended environment first.
