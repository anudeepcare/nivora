# AURYN — proposed next features

These are proposals, not implemented features in version 1.0.0. Finish the visible UX and data consistency baseline before expanding the product.

| Priority | Feature | User value | Data / implementation gate |
|---|---|---|---|
| 1 | Earnings results versus expectations | One compact view: revenue, EPS, guidance, margins and cash generation; clearly scheduled, reported or awaiting confirmation. | Match fiscal period, currency and GAAP/adjusted basis. Licensed estimates/transcripts may be needed. A missing result must not imply a miss. |
| 2 | Explain what changed | “Guidance increased; valuation changed because growth assumptions rose.” Show previous/current values and dated evidence on demand. | Durable comparable snapshots, versioned models, materiality filters. Replace device-only composite-score deltas. |
| 3 | Portfolio risk before adding | Show current and proposed position weight, sector exposure and correlated holdings before an addition. | Reliable holdings and adjusted price history. Label correlations as historical; no guaranteed downside. |
| 4 | Reverse valuation | Show what revenue growth and margin the market price implies, then compare with history and estimates. | Supported valuation model, dilution/debt assumptions, sensitivity ranges and model eligibility. Avoid forcing a DCF on every business. |
| 5 | Personal accumulation plan | Connect P0–P4 to a user's chosen 1×/2×/4× pace and position cap; show when the limit is reached. | Explicit user budget/limits, stable pace policy, no automatic trades or invented contribution amounts. |
| 6 | A better company comparison | Compare 2–4 eligible peers on growth, margins, cash generation, dilution and valuation; explain where each is stronger. | Same periods and accounting definitions, appropriate peer groups, clear missing observations. |
| 7 | Material-change alerts | Notify only for meaningful earnings, guidance, valuation-zone or saved-thesis triggers. Open the exact supporting evidence. | User-selected conditions, deduplication, reliable event ingestion and delivery state. Avoid a news backlog on Home. |
| 8 | Business-specific operating metrics | Track the measures that explain the business: subscription retention, backlog, capacity or unit economics when disclosed. | Company filings, attributable sources, metric definitions and coverage policies; do not fabricate missing measures. |
| 9 | Management promises versus delivery | Compare previously stated guidance and milestones with subsequent reported results. | Licensed/source-accessible transcripts and filings, period alignment, human-reviewable citations. |
| 10 | Evidence-linked research assistant | Ask focused questions about a company or holdings; answers link to exact dated evidence. | Source retrieval and permissions, freshness checks, evaluation for unsupported claims and abstention. Build after the evidence pipeline. |

Recommended sequence: earnings + explain changes, then portfolio risk + reverse valuation, then accumulation and comparison. Existing quote/financial data can support parts of 2–6; transcript, guidance and detailed operating-metric coverage need entitlement and data-quality checks before commitment.

Professional product benchmarks consulted on 2026-11-05: Koyfin documents portfolio-level news/document alerts (https://www.koyfin.com/features/alerts/); Quartr documents earnings calls and searchable source material (https://quartr.com/products/mobile-app). These establish useful workflows, not permission to reuse their data. AURYN's opportunity is to make evidence lead to a clear, portfolio-aware next step.
