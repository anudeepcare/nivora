# AURYN Edge Implementation Plan

Goal: implement the user-approved compact research design, preserving production and existing research depth.
Architecture: derive a deterministic decision from the existing evidence brief; separate provisional price policy from the confirmed contribution reading. Reuse validated chart, scenario and financial calculations. Scope new styling to Edge surfaces.
Tech stack: Next.js, React, TypeScript, existing market adapters.
Spec: approved conversation and selected desktop/mobile mockup, October 25.

## Global constraints
- No production push or merge. Isolated auryn-edge-preprod-20261025 branch.
- Illustrative mock numbers must never become production data.
- Missing valuation is not a cheap valuation. Consensus is not intrinsic value.
- No revenue breakdown UI or its lazy requests.
- Preserve financial depth and account access, no new paid vendors.

## Review focus
Missing/zero/NaN inputs, stale quotes, crypto/specialist models, severe funding risk, confirmed versus forming Pace.

## Tasks
- [x] 1. Deterministic Edge policy with tests for risk, unsupported valuation, provisional signals and price freshness; derive evidence adapter from researchBrief.
- [x] 2. Approved Overview composition, metric explanations, confirmed Pace, existing accurate scenario scale; remove revenue breakdown and requests.
- [x] 3. Refine landing, account and Home consistently without changing authentication behavior.
- [x] 4. Support form and authenticated/public request handling, storage and notification configuration; don't claim sent before durable save.
- [x] 5. Data/model audit and regression checks; preserve supported specialist models, disclose unresolved vendor coverage.
- [x] 6. Production build, unit/API checks, desktop/mobile screenshots; package complete source with honest verification report.

Execution: inline to limit repeated context and cost. User approved build; no repeated approval required for local implementation. External services and live email not mutated during development.

## Review and verification ledger
- Baseline: 504 tests passed before changes.
- Independent review found three important issues: overly broad improving-business wording, exhausted notification retry recovery, and retry timeout budget. All were corrected and covered by regression tests.
- Additional browser diagnosis found malformed-locale chart initialization, scenario SVG-title hydration mismatch, and an inline preview resource render loop. Corrected and covered by the browser and regression checks.
- Current unit/database/component suite: 532 passing. Production compile and API checks pass; final viewport results recorded in verification.
- Live provider comparisons, physical iPhone acceptance and live email remain explicitly unverified; see release boundaries. No external changes were made.
