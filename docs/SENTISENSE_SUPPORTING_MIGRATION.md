# Supporting data migration

Implemented behind `AURYN_MARKET_PROVIDER=sentisense`, with auth and limits retained. Legacy paths remain for rollback, never automatic fallback in this mode.

- News: documented publisher links and sentiment. Original headlines/text are absent from the document endpoint. Links are explicitly labeled as publisher links; distinct links are not collapsed on generic title. This is not headline parity.
- Home events and company earnings: documented earnings calendar with actual/estimated EPS and revenue preserved as nullable numbers. Split calendar has no documented equivalent.
- Insider filings: preserves raw transaction code. Tax withholding is not open-market selling. Rows whose acquisition/disposition direction cannot be established are omitted rather than assigned a fake signed share amount.
- Congressional trades: disclosed/traded dates, chamber, member, amount range. No official filing URL supplied, so UI does not render a fabricated filing link.
- Peers: curated peers, not the previous market-cap matching method. Requires live shape verification; official narrative describes array but not a complete schema.
- SEC filing documents and revenue-segment breakdowns: explicit unavailable responses; no equivalent documented.
- Options: new authenticated `/api/options/[symbol]/summary` for end-of-day aggregates. IV/expected moves are fractions and dates remain visible. This does NOT replace full contract chains or individual trade prints; those return explicit unavailable in sole-source mode, without Alpaca/EOD requests.
- Provider status reports selected provider and configuration only, never claims token validation.

Official contract sources inspected Nov 16 2026:
https://sentisense.ai/docs/api/documents/
https://sentisense.ai/docs/api/calendar/
https://sentisense.ai/docs/api/politicians/
https://sentisense.ai/docs/api/insider-trading/
https://sentisense.ai/docs/api/stocks/
https://sentisense.ai/docs/api/options/

Verification: 6 new normalization tests and existing news/home-feed tests passed (25 total). TypeScript passed at integration checkpoint. Tests use illustrative fixtures, not live Pro observations. Pro live endpoint responses and browser UI interaction remain unverified. No deploy, external subscription change, or credential transmission performed by this worker.

Follow-up: Grow company profile and earnings now route directly to SentiSense in selected mode. Dividends, splits and press-release requests fail with explicit 503 coverage messages before any legacy request. Earnings-soon monitoring uses the SentiSense calendar, not EODHD. Four additional migration tests plus two existing Grow tests passed. Profile country is listing-market country, not headquarters; earnings currency is not inferred from trading currency. Profile/earnings normalizers reject preview, mismatched identity, unsupported datasets and unsafe links while retaining zero/null distinctions.
