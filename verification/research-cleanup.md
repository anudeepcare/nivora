# Research cleanup — November 6, 2026

- Removed the overview portfolio-weight warning and its independent quote subscription. Portfolio pricing remains on the Portfolio page.
- Removed Changes since your last visit from Research.
- Kept the main decision and key risk visible; moved repeated assessment methodology into a collapsed detail.
- Synchronized Research's selected tab with same-company URL changes, fixing the Business evidence link without a full reload.
- Shared streaming quote broadcasts ignore connection-label-only changes to prevent subscribers from feeding the same observation back to each other.
- Removed obsolete unlayered saved-changes CSS.

Validation: 1,078 regression tests passed before the final tab synchronization change; focused quote-feedback and CSS-layer checks passed afterward. Production build and local browser checks are recorded separately. Local preview checks do not establish live production performance or validate real password recovery emails. Production deployment and authenticated live-stream verification remain required.
