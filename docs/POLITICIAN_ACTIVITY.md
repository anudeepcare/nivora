# Market-wide congressional activity

Official contract: https://sentisense.ai/docs/api/politicians/

A closed-by-default disclosure in the existing Public officials research view requests market-wide activity only when opened. It supplements, and does not replace, ticker disclosures, the member finder, or existing EODHD official filing links.

Fixed source endpoint: `/politicians/activity?lookbackDays=30|90|365&limit=50&offset=...`. Offsets are manual multiples of 50 through 1,000. The source total describes the requested disclosure window, not the rendered page or complete lifetime history. Preview accepts at most five records and disables paging; a preview received on a later page is withheld with return-to-first-page recovery. No undocumented URLs, filters, or inferred totals are used.

Display preserves provider ordering and distinguishes actual transaction dates from disclosure dates. Missing disclosure dates use explicitly labeled transaction-date fallback. Valid dates must fall within the requested Eastern-day window by disclosure/fallback date; transactions may be older when recently disclosed. Invalid dates, identities, or contradictory numeric ranges are omitted with a count. Amounts remain raw reported USD ranges with optional endpoints; no midpoint or exact transaction amount is derived. Reported owner, asset type, and safe filed option metadata are retained. No sentiment, investment return, motive, wrongdoing, or directional recommendation is inferred. Reported chamber does not certify current officeholder status.

Private account authentication, sample-deployment exclusion and advanced feature gate precede quotas and provider access. User and provider rate limits, research reservation, fixed host, 12-second timeout, 2 MB cap, no redirects, and no-store transport apply. Client reuse is five minutes. Pagination can shift with new filings and corrections, so no immutable complete snapshot is promised. No new credentials, migrations, or deployment.

Test-first schema and actual route→transport→projection→render tests cover identity/date/range/preview constraints and safe transport. Live provider entitlement, deployed behavior, and browser layout remain unverified.
