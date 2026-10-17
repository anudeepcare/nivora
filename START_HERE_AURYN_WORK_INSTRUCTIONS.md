# Start here — AURYN, 17 October 2026

This archive contains the complete standalone application source, tests, assets, migrations, approved design reference and deployment instructions. It is not proof that every inherited product requirement is production accepted. Read README.md, docs/RELEASE_STATUS.md and docs/DEPLOYMENT.md.

## Latest decisions — preserve these

The user has paid for both Twelve Data and EODHD All-in-One. Use Twelve Data for quotes and intraday charts; EODHD for daily history, financial statements, forecasts, valuation context, ownership, company events, news and filings. Cache and deduplicate requests. Use a labelled, whole-result fallback for price failures. Do not merge two providers' financial periods or splice their chart bars. No additional subscription or paid AI activation is authorized by this data integration.

The user reports configuring EODHD_API_KEY in their deployment. The build environment could not independently access that key: it was absent locally and the Vercel connector returned a scope authorization error. Do not mislabel this as an invalid key or a failed paid subscription. The current build/API tests use fixture transports, and public EODHD demo normalization was checked separately.

The current approved design is docs/design/approved-pwa-20261017.html. Earlier HTML and image references are historical. The live React implementation uses the approved design tokens and five research tabs: Snapshot, Financials, Valuation, Technicals and Thesis. Desktop sidebar and four-item mobile navigation, readable light/dark/system preferences, visible amount-free 0×–4× monthly accumulation context, source dates and clear metric explanations are required. No browser/physical-iPhone comparison has been completed in this environment. Never claim exact visual matching on compilation alone.

Keep the product simple. Preserve AURYN branding. Do not reintroduce the removed portfolio purchase/stress/import panels or private-thesis/snapshot/Compare controls into the primary UI. Charts must not capture normal page scrolling. BTC/USD and ETH/USD must never silently resolve to ETFs. SAP's US quote must not turn EUR financials into USD values. Unknown data stays unknown, not zero or fabricated advice.

The full inherited 104-item scope and evidence notes are in docs/requirements-inherited.json; material remaining scope is in docs/RELEASE_STATUS.md. This release does not validate an investing edge, competitor superiority, universal data coverage or commercial resale rights.

Existing account records remain in Supabase. No database schema change was needed for this provider/UI update. Previously installed migrations are documented in verification/LIVE_SETUP.md; do not blindly rerun them. Never put secrets in source, ZIPs or NEXT_PUBLIC_* variables. Paper scheduling/execution and paid AI remain off by default. The Mac project is the extracted AURYN directory containing package.json, not a nested product directory.
