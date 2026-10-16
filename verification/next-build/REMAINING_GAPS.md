# Remaining gaps — not a completion certificate

## Implementation gaps

- **B02, 6–12 months:** the kernel accepts independent horizon evidence, but the production adapter does not supply a researched forward estimate. It returns UNASSESSED. Reported historical profitability is not relabeled forward guidance. Completing this requires a dated, comparable forward-evidence producer and a validated horizon policy; the package does not contain that completed integration.
- **H02, exposure intelligence:** concentration arithmetic and honest coverage states work, but sector/theme/shared-risk fields are not fully populated by canonical production data. Correlation/fund look-through are unavailable without aligned return/holdings histories. The package does not deliver a fully populated exposure intelligence system.
- **H04, performance/benchmarks:** assumption stress, manual external-flow attribution and fixed-DCA comparison work. Broad-market/sector benchmark comparison and an account transaction/corporate-action ledger are not supplied. Snapshot position totals must not be represented as complete historical account performance.

## External and data acceptance gates

- **Admin/paper:** server role enforcement and audit/lease/idempotency paths are implemented. The owner's trusted user UUID/allowlist is unresolved; six deployed users were observed without a trusted role. Vercel environment metadata was denied, so production URL/secret/config equivalence is not verified. Three new SQL migrations remain unapplied to the live database. No real paper order lifecycle was exercised. Follow the concrete setup checks in `GIT_AND_VERCEL.md`; do not weaken authorization to make the UI unlock.
- **Company evidence:** source reviews support cited moat, capacity, funding, dilution and milestone/guidance facts. Real IREN/ASTS facts were not populated or reviewed in this build. Specialized capacity/frontier numerical valuation methods remain explicitly unsupported; the approved coverage registry permits an unavailable state instead of a generic DCF.
- **Outcome validation:** the replay/walk-forward evaluator is software infrastructure. No independently frozen point-in-time dataset, delisted-asset universe or unseen-period comparison of the real existing/proposed models was completed. No calibrated win rate, superior return or self-learning claim is justified.
- **Runtime:** deployed auth/email delivery, cross-user live RLS, vendor entitlements/quotas, actual quote freshness, owner settings and paper scheduling need deployment-specific verification. Local fixtures do not prove these.
- **UX:** current Chromium widths and themes were tested. No physical iPhone/Safari or screen-reader audit was performed; the approved references are collages, not pixel-comparison exports for every route/state.

No extra paid provider was added. Full options flow/gamma, real-money automation, a social network and universal valuation coverage remain outside the approved build. Do not remove these disclosures or call an unavailable capability complete to satisfy a checklist.
