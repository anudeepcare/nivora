# NIVORA V49 — Thesis-First Investment OS

V49 deliberately moves NIVORA away from short-term trading calls and toward 6–36 month investment decision support.

## Core contract
- Company quality does not change because today's price changed.
- Thesis score excludes current price and heavily discounts technical confirmation.
- Price affects valuation/opportunity, not the underlying business thesis.
- A thesis changes only on material evidence: business quality, forward growth/expectations, earnings/revisions, financial health, analyst/institutional/catalyst evidence.
- Missing evidence is neutral/low-confidence, never automatically bearish.

## Three decisions, not one blended number
1. Company — is this a business worth owning?
2. Thesis — are the long-run facts strengthening, intact, mixed, weakening or broken?
3. Opportunity — is current valuation/risk attractive enough for new capital?

## Today
Today is a material-change feed. Ordinary price noise is not enough. It compares the latest persistent thesis with the prior thesis and surfaces only material score/action changes.

## Discover
Discover ranks completed thesis-first research, not the current alphabetical scanner batch. Filters emphasize high conviction, strong businesses, strengthening theses, attractive valuation and risk.

## Memory + audit
Migration `20260830_nivora_v49_thesis_memory_audit.sql` adds thesis history and an immutable-style decision audit table. Material changes are recorded so future versions can calculate 30/90/180/365-day outcomes and calibration without rewriting history.

## Important limitation
V49 is a research architecture, not a proven profit system. Forward performance must be measured before publishing hit-rate or accuracy claims. Automated execution should remain a later phase with explicit risk controls and paper/live validation.
