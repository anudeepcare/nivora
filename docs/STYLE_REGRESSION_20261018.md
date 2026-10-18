# React integration stylesheet regression

The October 18 screenshot showed default underlined navigation links, a visible skip link, missing page gutters and stacked unstyled feed rows. Investigation found that app/globals.css had been replaced with the static studio foundation. app/layout.tsx already imports that foundation separately. The current React shell uses different selectors and requires the integration sheet.

Restored the integration stylesheet from the local October 17 staging snapshot, retained current components and case/news colour styles, and supplied layouts for newer portfolio-summary, news/events, analyst and financial-trend components. The desktop navigation, brand, page headings and accessible hidden skip link now have their matching integration selectors again.

The installed-PWA default status-bar configuration, opaque mobile header and document scroll ownership remain. The dock is fixed and hidden during keyboard entry. These are code corrections; physical iPhone acceptance remains unverified.

Added tests/style-integration.test.mjs to prevent another foundation copy from replacing integration styles. Verified that the production CSS bundle contains the navigation, heading, feed-grid, portfolio-summary and skip-link selectors. Automated checks are not a replacement for a visual browser review.

This source correction supersedes the earlier unstyled ZIP. No deployment, database write or broker order was performed.
