# Market-wide analyst action discovery

Official reference: https://sentisense.ai/docs/api/analyst-ratings/

This on-demand disclosure sits below the existing per-ticker Analyst actions view. It adds cross-market discovery, not another consensus panel. Default filters are upgrades, downgrades and coverage initiations; an explicit All mode includes reiterations and other actions. Existing named-analyst history and per-ticker evidence are unchanged.

Requests are fixed to `/analyst/activity`, using 7/30/90-day lookbacks, limit 50, and manual offsets through 1,000. Changes mode sends the documented actionTypes filter. Response rows retain ticker, publishing firm, action date and original rating terms. Invalid, future, out-of-window or filter-mismatched rows are counted and withheld. The app validates date-only records against a New York calendar boundary; the provider timezone is not specified. No named analyst is invented from firm attribution.

The first 50 rows may be complete on free keys even with `isPreview: false`; this is not proof of paid entitlement. A later-page preview or PRO_REQUIRED fallback is withheld, with return-to-first-page recovery, rather than presented as a new page. Total count describes the provider's filtered window, not the displayed page. Live additions can shift page boundaries despite the provider's deterministic ordering.

Market-wide targets are deliberately not displayed or compared because this endpoint does not apply the per-ticker split checks. Users can open the ticker research for dated target evidence. Published ratings remain attributed opinions, not this application's recommendations or an inferred consensus distribution.

Authenticated non-sample account access with analysts permission, existing user/adapter limits, research reservation, and shared SentiSense transport protection precede provider access. Fixed host/path, 12-second timeout, 2 MB streamed-response cap, no redirects and no-store transport apply. Client reuse is five minutes. No new environment variable or migration. No deployment or live entitlement/browser verification.

Tests cover projection, filtered requests, preview boundary, range/date/identity rejection and actual private route→shared guard→provider transport→render. Full integrated regression remains the release coordinator's gate.
