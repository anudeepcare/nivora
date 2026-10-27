# AURYN · Action, mobile and website release

Built October 27, 2026 on feat/approved-mockup, continuing baseline 8066ab25a8df68a307cd02fc2039710d60fc82cb. This is a full source release. Production has not been pushed or deployed.

## Shipped behavior
- One decision calculation exposes new-purchase and existing-holder guidance. Watchlists do not imply ownership. Research, Home, Watchlist, Portfolio, Compare and Discover use the same underlying action.
- AURYN Pace leads with an actionable phrase, such as Buy gradually or Hold · pause additions. Confirmed P1–P4 appears as the contribution level only when additions are supported. Forming and confirmed raw readings remain dated in expandable detail. P0 pauses purchases/additions. Missing history leaves useful financial guidance available.
- An additional funded-growth path checks comparable revenue growth, margin progress, cash/net debt, dilution and operating/investment runway. Current and prior source conflicts prevent qualification. Relevant failed requirements are explained in next conditions and the compact decision-rule checklist. Thresholds are disclosed heuristics, not performance claims.
- Cash and debt carry point-in-time labels; market multiples show the supplied valid update date or explicitly unavailable date. Relevant header measures have semantic colour; narrow screens show four first with the rest one tap away. Long names wrap fully. Search dialogs fit content with internal scrolling when needed.
- Public About and Pace guides, route-specific SEO/canonical/social metadata, structured organization/site data, real robots.txt and sitemap.xml, noindex for private/preview pages, and a real HTTP404 for invalid product routes.
- support@auryninvest.com appears on public/help/account/support surfaces and is the default notification/reply destination. Existing delivery guards remain intact. Cryptographic request IDs work even when randomUUID is unavailable in a browser.
- Optional GA4 is disabled without an ID and does not load before consent. Allowlisted events contain coarse routes/outcomes/timing buckets; no ticker/query/holding/contact values. Preferences support decline/revocation. Activation requires actual GA configuration and disabling Enhanced Measurement, as documented in WEBSITE_ACTIVATION_20261027.md.

## Verification
- 787/787 automated tests passed, zero skipped or failed.
- TypeScript and optimized production build passed; 34 static pages generated.
- All nine built API verification scripts passed. Provider, identity, billing and database transports are synthetic in these tests; no live trade, payment or support email was sent.
- Fresh independent review found three important issues (growth conflicts, missing-history workspace guard, missing growth-blocker explanations). All fixed; reviewer reran 32 focused checks and original reproductions successfully.
- Consent lifecycle tests verify no script before acceptance, one coarse page event per transition, sanitization, revocation and unconfigured/preview isolation.
- Browser QA: Research, Home, Portfolio, Watchlist, Compare, Discover, Settings at 360px and 1280px; no horizontal page overflow. Research also checked at 390px, 430px and 768px, including a temporary synthetic long company name, removed afterwards.
- Search at360px: type Apple, keyboard-select AAPL, navigate, open Settings and verify Back returns to AAPL. Search height tightened after visual check. Settings exposes Back and Sign out at first level (sign out correctly disabled in preview).
- Public home, login and pricing checked at360px; Support and Pace guide visually checked at360px, About at1280px. Privacy preference opened and declined in the browser; no live analytics configured.
- Browser same-origin endpoint checks verified all12 public pages HTTP200 with canonical metadata; login/research/portfolio/settings noindex without canonical; robots text/plain; sitemap application/xml; social image200 image/png; invalid route404 noindex. Social image independently rendered as a1200×630 PNG and visually inspected.
- Temporary QA iframe, preview environment file and altered frame header removed. Original DENY frame protection restored. Synthetic fixture name restored. No credentials or production settings changed.

## Release boundaries
No universal ticker-coverage or profitable-return guarantee is claimed. Existing source recovery and reliability tests remain in the full archive. This release does not independently validate every live provider observation. GA4 property, Search Console verification and mail-domain DNS activation require the real owner configuration; see the activation guide. Physical-device/virtual-keyboard acceptance and production deployment parity remain deployment checks, not claims inferred from browser viewport testing.
