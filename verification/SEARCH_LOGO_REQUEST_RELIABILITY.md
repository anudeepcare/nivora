# Search, logo and provider-request reliability

CRM search reproduced a failure under EODHD HTTP 403 despite configured Twelve Data. The new compiled-handler regression first failed and now passes: search falls back to configured Twelve Data, returns Salesforce/CRM and retains the result for repeated queries. EODHD equity searches are limited to the US exchange rather than discarding overseas results after an unrestricted query. Search input debounce is 450 ms.

The HIMS/NOW logo-dark class had no corresponding style; added a contrasting background. Twelve Data logo responses without optional symbol metadata can now use a validated provider image URL; explicit symbol mismatches still reject. Unknown-logo failures remain cached on the client for five minutes. No universal logo-coverage guarantee is made.

EODHD fetches now opt into the Next server Data Cache with dataset TTLs rather than forcing no-store. Existing per-process request deduplication remains. Authorization failures get a one-minute process cooldown; framework/provider errors remain surfaced. Cache performance and account quota consumption have NOT been measured live. Responses too large for framework caching or cold/evicted entries can still reach the provider. This is not a hard distributed quota cap. Private account API responses remain private; no account or broker response is shared.

Includes pending evidence-restoration changes documented in EVIDENCE_RESTORATION.md. Verification: 150 tests, typecheck, production build, 60 simulated API checks, clean diff. Public EODHD documentation reviewed; demo key cannot access search and no private API calls were made.

Live project nivora was discovered through the Vercel connector, but production deployment listing failed with HTTP 403 for the connected account scope. CLI fallback is unavailable. Therefore deployed revision, live request counts, phone scroll behaviour, exact visual parity and private provider entitlements remain UNVERIFIED. Previously shipped mobile code is retained; no new claim that the reported installed-iPhone issues are fixed. No deployment or push performed.
