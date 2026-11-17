# Connected product: the approved fifteen points

This release improves the existing product rather than creating fifteen extra dashboards. Each dataset has one primary home; concise Overview summaries can link to the full detail.

| # | Product point | Primary home and delivery |
|---|---|---|
| 1 | One opening assessment | Overview: separate Business quality, Valuation and Entry conditions; a weak chart cannot become the business verdict. Current-price failures explicitly request a refresh. |
| 2 | What changes the assessment | Overview: measured threshold, current value and saved alert action. Alert checks are requested or administrator scheduled, not continuous by default. |
| 3 | Meaningful changes | Home: holdings/watchlist news and scheduled events. Session changes only reflect reports actually opened; no invented background digest. |
| 4 | Defensible cases | Valuation: conditional bear/base/bull, common scale, dated horizon and assumptions. Consensus remains separate. Unsupported cases stay unavailable. |
| 5 | Appropriate business models | Valuation: existing sector classification and eligibility guards distinguish banks, insurance, REITs, infrastructure, frontier companies, operating companies and crypto. Classification is not a completed specialist valuation. |
| 6 | Understand the business | Financials: business description, classified research drivers and on-demand product/geographic disclosures moved out of Advanced. Disclosed segments can overlap; no fabricated shares, moat or customer dependency. |
| 7 | Expectations in price | Valuation: existing reverse cash-flow growth/return workbench, with explicit assumptions and eligibility. Negative/missing cash flow does not produce an implied intrinsic value. |
| 8 | Monthly accumulation | Overview: compact confirmed versus forming 0×–4×. Technicals: rule/history study. Original price-based rules; no proprietary competitor algorithm, promised returns or automatic position size. |
| 9 | Shared portfolio risk | Portfolio: supplied sector/crypto/cash group weights, classification coverage, unclassified assets and optional uniform-shock calculation. No extra provider requests or guessed factor sensitivities. |
| 10 | Earnings workflow | News: preparation, actual EPS versus estimates and future expectations together. Removed earnings tables from Financials; Home events now open News. Dates and EPS basis limitations remain visible. |
| 11 | Grounded AI | Thesis: Explain, Missing evidence, Strengthen and Challenge now send distinct allowlisted intents. Optional original SEC excerpt retrieval with strict host/date/size/redirect checks; claim source IDs and excerpts are shown. No automatic paid generations. |
| 12 | Useful discovery | Research landing: optional, lazily mounted saved screen; at most twelve selected companies, explicit requested/returned/matching coverage. Main navigation remains unchanged. |
| 13 | Small decision record | Thesis: collapsed optional record; current breached evidence and link to threshold alerts. Free-text thesis interpretation and continuous checking are not claimed. |
| 14 | Advanced depth | Advanced: existing risk desk, relative benchmark/peer context, position planning and historical-condition study. Revenue segments now belong to Financials. Licensed options, proprietary order flow and validated strategy backtests are not included. |
| 15 | Trust layer | Existing period/currency/provenance, reconciliation, quote-age checks, cache, shared budget/lease controls remain in place. New exposure calculations exclude older, missing or non-USD prices. |

## Configuration

- Existing shared market guard activation is documented in TRUST_AND_COST_CONTROLS.md. It still requires its database migration and server configuration; this ZIP does not apply migrations remotely.
- AI requires the existing confirmed account, provider/model configuration and account budget migration.
- Optional SEC excerpt retrieval: set `AURYN_AI_FILINGS_ENABLED=true` and a valid `SEC_USER_AGENT` identifying the application and contact. Only the latest eligible, server-supplied SEC HTML filing is inspected, at most two MB and three excerpts. Missing, inaccessible or larger documents yield financial-observation-only analysis. Not all covered companies have eligible SEC filings.
- Filings are cached per warm worker for six hours; this is not a distributed document index. A selected excerpt is not a complete filing review. Citation validation checks supplied IDs and response shape, not semantic truth; verify AI claims against the source.
- No new subscription is required for these additions. Existing vendor entitlements, AI usage and hosting costs still apply.

## Deliberate limits

This does not establish an investing edge, copy competitor proprietary calculations, provide licensed options data, implement every specialist valuation, infer undocumented moats, automatically interpret thesis text, or guarantee complete company coverage. Portfolio classification uses supplied quote metadata and research already opened in this account session; unclassified positions are not silently assigned a sector. Uniform stress is an assumption, not a forecast or correlation model.

The PWA status-bar/safe-area/keyboard implementation is preserved. Physical iPhone installation, deployed credentials, AI generation and real provider entitlements require deployment acceptance; local tests are not a substitute for those checks.
