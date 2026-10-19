# Automatic analyst-target fallback — 2026-10-19

Overview uses an automatic analyst-consensus card when no headline AURYN valuation is supported. Value uses the same component. It is labelled analyst opinion, never intrinsic value, AURYN Bear/Base/Bull or a guaranteed return. It displays consensus, percentage difference from the current quote, quote observation date and target dataset update date. Percentage = (target/current quote − 1) × 100. The comparison is against current quote, not necessarily the latest settled daily close shown by competitors.

No per-stock prices are hardcoded. The uploaded observed IREN fixture supplies 77.8056, displayed as $77.81. An equity/share reconciliation failure does not block the separate analyst opinion. Listing currency must match quote currency; foreign domicile alone does not prohibit a same-currency listing target. Stale quotes, invalid targets or dataset dates older than 120 days remain blocked. A dataset update date is not represented as the date every analyst revised their target.

The current EODHD response supplies consensus only. It does not supply low/high targets, target horizon or a unique target-contributor count. Recommendation vote counts are not substituted for target contributor counts. Missing fields are stated explicitly, not filled from screenshot examples or percentage offsets.

The connected Twelve Data /price_target call was tested and returned an Ultra/Enterprise plan restriction. No upgrade was purchased, no additional paid feed added, and no repeatedly failing production call was introduced. Full Low/Consensus/High functionality remains dependent on a licensed source supplying that range. Current scope is the useful automatic consensus fallback, not a fabricated complete range.

Validation includes an actual uploaded-response replay, currency mismatch rejection, foreign-listing consensus eligibility, and rendered consensus with absence of invented target endpoints. Physical iPhone standalone acceptance and deployed rendering of this change remain unverified. PWA shell geometry was not edited.
