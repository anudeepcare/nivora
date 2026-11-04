# Screenshot feedback correction — 23 October 2026

Reviewed all thirteen supplied application/reference screenshots and the approved desktop/iPhone design board. This continuation addresses specific reproduced presentation and calculation faults, not every inherited commercial feature.

## Corrected

- Reported OCF-less-capex per share no longer depends on a fresh market quote. It uses a dated, positive reported current share count and compatible financial/listing currency. Expired share records, foreign-listing ambiguity and non-positive cash flow remain ineligible. Quote-sensitive market multiples keep their existing guards.
- The business header no longer tells customers to “Resolve conflicting inputs” or labels the whole company an “Input conflict.” Conflicting market-cap/share/price observations still withhold affected scenarios. The Value explanation identifies the two amounts and their possible date/share-unit mismatch. These are unresolved source comparisons, not a user-editing task.
- A financial-sector label contradicting the existing infrastructure classification is withheld from the header. This does not claim the upstream profile or logo was corrected. No replacement sector or logo is invented.
- Advanced opens with a dated risk brief: 14-session average true range, historical daily expected shortfall over the worst 5% of observed days, largest absolute opening gap, and closing drawdown context. Every metric states its practical use and limitations. No price forecast or success probability is inferred.
- Risk, Market/Peers, Trade Plan and Historical Study have separate retained work areas. Unopened tools do not mount; navigation buttons do not jump the page through anchor links. Detailed risk measurements are optional; the repeated price-versus-business essay is removed from the initial view.
- Overview follows the supplied reference more closely: compact identity/header, shorter chart area, coloured revenue/margin/cash/share context, sparklines from real comparable annual observations, annual bar charts beside a concise case-review card. Data and headings depend on actual evidence; illustrative scenario prices, cash runway and DCA numbers are not copied.
- Value method diagnostics and the personal operating-scenario builder are optional, rather than large empty boxes in the main flow.
- Duplicate exact content selectors were consolidated within their owning stylesheets. The PWA shell/status surface was not rewritten.
- Fixed an unsafe optional profile access exposed by the new missing-profile regression.

## Verification

387 unit/render/database tests pass. Route type generation, TypeScript and optimized production build pass. All 83 compiled API checks pass. See `verification/feedback-verify.log` and `verification/feedback-api.log`. Tests cover delayed/missing quote behavior, share-age/currency rejection, missing risk history, Advanced initial rendering and removal of customer-facing conflict instructions.

The browser could not render the local build in this environment. These checks do not establish pixel-identical design, physical iPhone acceptance, production latency or correctness of every vendor datum. The screenshot/layout feedback is implemented in source, not visually certified.

## Still unresolved

- DCA Optimizer's private rule does not match AURYN monthly-v3. In the inspected same-date IREN comparison, the competitor showed 2x confirmed/4x forming versus AURYN 1x/2x. APP showed 4x/4x versus AURYN 3x/3x. No multiplier was hardcoded or thresholds fitted to these labels. Exact equivalence is not claimed.
- AURYN has the same $476.85 APP consensus target shown in the supplied reference. The shown comparison percent differs with the reference quote ($264.41 older trade versus $264.28 settled close). This patch does not certify live quote closure synchronization.
- The inspected data snapshot does not supply analyst low/high targets. The competitor's $790 high target or other ranges are not copied into live production data.
- Upstream company-profile/sector/logo correctness, supported sector-specific intrinsic models, full commercial features, and the broader feature wish list remain separate outstanding work. Moving a diagnostic behind a disclosure does not resolve its data conflict.

No live database change, order, paid subscription, merge, push or deployment was performed. No SQL is required for this continuation. Existing Git/Vercel instructions remain in `DEPLOYMENT.md`.
