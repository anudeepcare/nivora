# Research credibility, retention and visual refinement

## Working additions
- Overview financial metrics use one continuous band; Financials no longer repeats the same four tiles and starts with actual financial trends. Summary risk and answer areas are more compact.
- Bear/base/bull cases share one linear scale with the current quote. Values outside the scenario range remain outside it. Scenario numbers and assumptions are unchanged by presentation.
- Login/registration uses a compact product walkthrough rather than three tall marketing cards; mobile keeps the account flow prominent.
- Overview metric source/basis details distinguish reported, calculated, estimated, conflicting and unavailable evidence. Reported is not independently verified. Same-period conflicting observations are not labelled verified. This is not a comprehensive independent filing audit.
- Saved observations persist on this device under account-scoped keys. Baseline, new reporting periods, changed screening scores, review flags and filing links can be compared on later visits. No fabricated historical baseline; clearing browser storage removes these observations. It is not cross-device or continuous monitoring.
- Interest coverage, stock-pay/revenue, current ratio and operating-margin alerts can be created in Alerts. First successful check establishes a measurement baseline; later safe-to-breached crossings create deduplicated in-app events. Missing inputs do not overwrite it. Currency/basis changes re-establish a baseline; backwards periods are ignored. State uses the existing RLS-protected documents store; no schema migration or production write was performed here.
- Scheduled checking retains the existing explicitly configured single alert-owner job. This release does not implement commercial all-customer fanout, email, SMS or push delivery. Alert thresholds do not authorize trades.
- Cash runway distinguishes historical operating burn from cash use after reinvestment. Working capital, cash/debt, receivable days, inventory days, payable days, cash cycle, share-count change, SBC/revenue and capex/revenue appear where inputs support them. Sector/period guards apply. No missing maturity or convertible schedule is invented.
- Earnings preparation shows actual current flags and checkpoints; existing reported-versus-estimated EPS history remains separate.
- Value exposes optional company comparison and selected-cohort medians. Three same-sector, currency/date-aligned companies are required for a median. This is not an industry population median.
- Thesis exposes optional private thesis/pre-mortem notes and a printable company brief. Existing server storage handles notes; local printing excludes notes and portfolio details. This is not a new immutable decision/outcome journal.
- Portfolio evidence summary labels reviewed versus unreviewed stock holdings using already-loaded reports. It avoids a purported whole-portfolio score from partial coverage and does not trigger a research request per holding.
- Public methodology includes arithmetic worked examples and a dated change log.

## What remains outside this package
The complete requested commercial platform is not finished. The following are retained requirements, not features represented as live:
- Stripe checkout, webhook entitlement lifecycle, customer cancellation portal and free/Pro quotas: need activated provider installation and end-to-end billing tests.
- Commercial data distribution rights, permitted exports/public sample reports/ticker SEO, redistribution/attribution review and legal review.
- Continuous cross-device changes, all-customer scheduled alert processing, delivery consent/SMTP, weekly email and push.
- Full-industry peer medians and screener, historical point-in-time score backtests/calibration.
- Full filing-text semantic changes, expanded cited conversational AI, verified moat/management evidence, specialist sector valuation and maturity/convertible parsing.
- Immutable dated decision logs/outcome reviews and behavioural coaching.
- Brokerage OAuth import, teams/advisor collaboration, B2B APIs, extension, affiliate programme and educational course.
- Full browser-rendered/pixel comparison, native installed-iPhone acceptance and live paid-provider/account correctness audit.

## Checks and deployment
See verification/research-retention-final-verify.log and research-retention-final-api.log for the latest automated results. Documentation is not a substitute for the remaining external and operational tests. No push, deployment, live order, user email or production database mutation is performed.

## Latest requested cleanup
Baseline and no-change notices are invisible. Actual detected changes appear on Overview only. Comparison/selected-peer controls have been removed from Value at the user’s request. Summary-specific CSS rules were consolidated and rewritten with blue/teal/violet decision accents, amber/red risk context, compact spacing and formatted dates. PWA shell remains unchanged.

## Appearance and settings refinement
Four saved accent choices (AURYN Blue, Ocean, Iris and Rose), light/dark/system appearance, comfortable/compact spacing, existing text size and reduced motion are available in Settings. Accent does not overwrite positive/negative risk colors. Desktop research uses a wider bounded content area and a tighter company header. Compact spacing reduces gaps without reducing text size or main touch targets. Settings keeps research preferences collapsed, legal links compact, and password editing closed until requested. Preferences are local to this device; no account sync is claimed. Installed-PWA status surface and safe-area shell remain intact.
Latest automated checks: 219 tests, TypeScript, production build; no rendered-browser or physical-device acceptance claimed.

## Account, News and entry-page refinement — October 19
- Removed the optional personal thesis/pre-mortem record and print/PDF brief entry from Thesis, plus its redundant trailing period stamp. Financial data retains period context in its own sections.
- Account uses two aligned desktop columns, one mobile column, compact appearance settings and a separate password disclosure. Settings navigation actions now have consistent full-width icon alignment.
- News separates earnings preparation, events and transactions with restrained color accents. Missing transaction quantities say “Quantity not supplied” rather than an orphan dash plus shares.
- Sign-in and registration introduce the business/value/timing proposition with clearer product copy. No testimonial, return claim or unimplemented paid-plan promise added.
- PWA metadata, safe-area rules and status surface are preserved. No physical iPhone acceptance or live authentication verification was performed for this patch.
