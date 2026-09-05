# AURYN V2 — Mobile-First Decision Architecture

## Product architecture
- Zero-scroll decision cockpit: quote identity, long-term conviction, new-money action, owner action, entry/reassess plan and compact evidence pillars appear before deep research.
- Scrolling is for evidence: legacy market context, charting and deep research remain available below the decision.
- Qualification thresholds are presented as minimums/points-to-clear instead of ambiguous `score / threshold` notation.

## Data integrity
- Closed-market quote disagreement guard: when the provider quote materially conflicts with the verified regular close, AURYN uses the regular close for the closed-market decision view and surfaces an integrity warning.
- Stable internal NIVORA engine APIs remain unchanged; AURYN is the product/brand layer.

## Brand and public surfaces
- Removed visible NIVORA/V61 product remnants from current public/application surfaces.
- Methodology rewritten around AURYN's current decision model rather than stale release-version language.
- Legal/auth surfaces use the AURYN logo system.
- Brand semantics use graphite/ivory/stone/bronze; constructive states use bronze rather than legacy green branding.

## Search
- Header search is now the real market search component, not a decorative link.
- Research search remains the large discovery entry point; mobile keeps search through the Research destination rather than squeezing a desktop search box into the header.

## Metric help
- Replaced prominent circled info glyphs with a low-attention baseline `?` help affordance.
- Existing portal explanation keeps score guide, why-it-matters and contributing evidence where available.

## Portfolio
- Removed the old `View allocation & risk` accordion.
- Added Overview / Performance / Allocation / Risk / Decisions / Holdings navigation.
- Existing command center retains value, cost basis, unrealized P/L, benchmark context, cash, concentration, capital priorities and visual intelligence.
- Mobile period controls and section navigation are horizontally contained and scroll safely.

## Monitor
- Alerts are presented as the Monitor workspace, with compact icon deletion and a path for decision-aware triggers.

## Mobile
- Explicit overflow protection, safe-area bottom navigation, compact stock decision composition, swipeable evidence pillars, scroll-safe period/tab controls and bottom-sheet metric explanations.

## Verification
- AURYN V2 product-contract tests pass.
- Brand/engine API boundary test passes.
- Engine TypeScript compile passes.
- The legacy full test suite has 13 failures: several are pre-existing missing GitHub workflow contract files and several intentionally assert the retired circled-info/legacy UI presentation. These are documented rather than hidden.
- Full Next.js production build could not be run in this container because dependency installation timed out; deploy/Vercel remains the authoritative full build check.
