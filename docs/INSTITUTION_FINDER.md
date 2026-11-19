# Institution finder and bounded holdings pages

Uses the documented institutional `/institutions` name search and `/institution/{CIK}` holdings pages. Finder is explicit-open beside the existing activist drill-down. New endpoint `/api/institution-directory` requires authenticated advanced market access, rejects sample-only deployments, reserves research access and applies user/provider request limits.

Each user action requests at most 50 rows, with offsets 0–1000; no automatic pagination. Finder later pages pin the returned quarter. Profile later pages verify CIK and the originally served latestReportDate; the upstream profile does not accept historical reportDate, so a changed quarter stops rather than mixing pages. Same-quarter filings can amend or reorder between requests; no immutable or complete snapshot claim. Preview holdings are labeled and cannot page. History uses the existing bounded eight-quarter endpoint unchanged.

Fixed upstream host, 12-second timeout, redirects rejected, 2 MB streamed response cap, five-minute transport cache. Only closed display fields projected; unavailable numbers are not zeros; dates/CIKs/page counts and weights validated. No proprietary score passthrough, no model/recommendation changes. Live schema, key entitlement, and rendered layout not verified.

Official contract: https://sentisense.ai/docs/api/institutional-flows/
