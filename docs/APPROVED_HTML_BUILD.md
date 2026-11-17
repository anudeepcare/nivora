# Approved HTML implementation

Historical implementation record (superseded visually by VISUAL_AND_CRYPTO_REPAIR.md). This revision implemented the then-approved interactive HTML in the existing real-data React application. The reference is `docs/design/approved-interactive.html`. Its sample numbers are not production data.

- Shared light/dark colors, readable typography, four primary routes and compact chart proportions.
- Mobile company identity/save row, separate quote row, safe-area header and bottom navigation clearance.
- Search suggestions with local logos/fallbacks and explicit crypto pairs; foreign-domiciled US ADR support; per-symbol errors in batch prices.
- Research decision signals, evidence brief, financial mini-charts, scenario range and selectable valuation assumptions.
- Technical charts with 0.5/0.618/custom 0.686/0.786 levels and daily/weekly metrics.
- Confirmed/forming 0×–4× DCA zones with no contribution amount and a correctly dated twelve-month chart.
- Portfolio value, actual allocation and editable holdings; removed Purchase impact, Portfolio stress and CSV import UI.
- Light/Dark/System, text-size and motion preferences; all specialist tools remain accessible from Preferences.

The prototype's invented portfolio performance line was replaced with actual allocation because the current app lacks a transaction ledger. We do not present deposits or synthetic price series as investment returns.

AI generation still requires an enabled provider, model/key and account budget; the UI now explains unavailable configuration before generation. No paid AI call or paper order was made. Automatic qualitative moat analysis, product billing and the wider inherited feature gaps remain disclosed in RELEASE_STATUS.md.

Verified: 57 automated tests, 37 built API checks, route types, TypeScript, production build and real read-only provider responses. Independent source review addressed scenario/preset and chart-period errors. Browser visual matching, installed iPhone behavior and deployed authenticated flows remain unverified. This is complete application source for this implementation, not a claim that all historical product promises are production accepted.

Use DEPLOYMENT.md to install in the existing AURYN folder. The exact-source installer backs up old source and generated files; it prevents obsolete files from surviving an unzip overlay.
