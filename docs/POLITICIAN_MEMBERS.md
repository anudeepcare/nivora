# Member discovery and reported history

Contract reference: https://sentisense.ai/docs/api/politicians/

An on-demand disclosure within Ownership → Public officials adds member search and reported history. The existing ticker disclosures and official EODHD filing links are untouched. The directory includes former members and is not a roster of current officeholders. Office status and departure year come from the directory, not a name inference.

Directory requests use documented `q`, `limit=50`, `offset`; interactive paging stops at offset 1,000 and suggests narrowing the search. Member requests use canonical directory slug with `limit=50` and offset. Before every member request, the server verifies exact case-insensitive slug plus Bioguide identity against a fresh fixed-host directory response. Profile and any trade-level identity echoes must agree. Selection-keyed components prevent one member's data being shown under another identity.

Current profile/history envelopes are projected. An undocumented limited-array preview fallback is accepted only when every row positively identifies the selected member; anonymous fallback rows are withheld. Preview beyond the first page is withheld with a return-to-first-page control. Preview disables paging and does not invent a profile or whole-history count. Provider historical totals are distinct from returned page size. Transaction and disclosure dates are separate, missing dates remain unavailable, invalid future/inverted dates fail closed. Amounts remain raw disclosed USD ranges with optional bounds; open-ended ranges are not converted into exact amounts or midpoints. No sentiment score, motive, wrongdoing, return or investment recommendation is inferred. Supplied owner and asset descriptions remain labeled provider fields.

Authenticated non-sample access and advanced feature are required. Directory does not reserve a monthly research request; member history does. Both retain per-user and per-provider rate limits, fixed paths, a 2 MB response cap, a 12-second timeout per upstream request, no redirects and no-store transport. Client reuse is five minutes. No new environment variable or migration. Directory/member verification can require two sequential requests, so up to approximately 24 seconds. This is not an immutable paginated snapshot or complete census.

Tests cover schema/identity/former status, preview, ranges, date distinctions, authorization, transport bounds, and actual route→directory→member→render. Live upstream entitlements and browser layout are not verified.
