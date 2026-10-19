# Connected Research Implementation Plan

**Goal:** Connect the approved fifteen product improvements while giving each dataset one primary home.
**Architecture:** Reuse current calculation, provider, alert and account layers. Add focused pure selectors for opening assessments and portfolio exposures; load specialist context only on request. Preserve the PWA shell.
**Tech Stack:** Existing Next.js, React, TypeScript, Supabase and provider adapters.
**Spec:** User-approved fifteen-point proposal, mapped in docs/CONNECTED_PRODUCT.md.

## Constraints
- No new paid providers, automatic AI spending, navigation tabs, imports or download controls.
- No fabricated intrinsic values, moats, fund flows, options or sector exposures.
- Preserve safe-area and keyboard handling; CSS additions scoped to new components.

## Review focus
- Stale quotes never support current entry assessments.
- Missing sector data remains unclassified; no inference from ticker names.
- Negative or missing cash flow does not support reverse DCF.
- Partial discovery failures disclose actual coverage.
- Filing claims require source passages, not just a link to a numeric dataset.

## Tasks
- [x] Test opening assessment independence and unsupported evidence, then implement selectors and connect DecisionWorkspace.
- [x] Give business profile and segment disclosures a Financials home; consolidate earnings checkpoints under News.
- [x] Add explicit on-demand discovery within Research; add cached-classification exposure and explicit stress assumptions in Portfolio.
- [x] Connect compact notes to current evidence alerts; preserve observed-change feed.
- [x] Make AI prompt intent explicit while retaining source/quota validation; add bounded original SEC passages and document retrieval limits.
- [x] Run full verification and API fixture suite, review coverage, package one ZIP.
