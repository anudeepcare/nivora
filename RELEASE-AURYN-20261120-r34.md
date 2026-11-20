# Auryn r34 · Public and workspace layout

Builds on the r33 layout. It does not alter provider configuration, price models, accounts, or database migrations.

- Compact sign-in and password recovery. The sign-in fields and main actions now precede optional session details rather than sitting beside a long promotional column. Short or zoomed viewports can still scroll normally.
- Corrected headline contrast on the navy Home hero in light and dark themes. Reworked the lower walkthrough, Pace progression, direct research links and footer.
- Refined Help and public document navigation. A return URL alone does not imply sign-in. Redesigned the public evidence page and local Portfolio Check tool without changing the publication gate or making any user data persistent.
- Applied shared spacing across Research lenses, clarified the Scenarios consensus panel, and aligned Indicator and Ownership figures. No values, calculations, access rules or capabilities were changed.
- Reworked the narrow desktop workspace menu, phone keyboard/dock clearance, shared footer, mobile Compare and Discover fields, Settings identity and preference alignment, and supporting Admin and Help views.
- Updated the optional loopback-only fixture browser harness to check all Research lenses, the sign-in button fit, and more routes. It requires Playwright and a supported browser; production keeps fixture paths disabled.

Preprod remains owner-deployed. An unauthenticated HTTP smoke test is not equivalent to an authenticated device click-through.
