# Research: minimal SentiSense integration seams

Source-only review, 2026-11-16. This maps the checked-in endpoint inventory to **existing** application contracts, not verified remote response schemas. No provider requests, credentials, entitlement changes, UI edits or adapter activation occurred. Account verification is separate.

## Priority mapping

| Dataset / inventory endpoint | Minimal integration boundary | Existing destination | Required evidence before replacement |
| --- | --- | --- | --- |
| `/api/v1/analyst/{ticker}/estimates` | Normalize validated observations into `Research.evidence.estimates` in the server research assembly, preserving unrelated evidence. Current contract is declared in `lib/eodhd-normalize.ts`; it is not a claim the upstream JSON has those fields. | `targetsEstimates` → Analysts annual estimates; `EstimateRevisions`; valuation forecast consumers | Fiscal end, annual/quarter frequency, reporting currency, EPS/revenue units, contributor-count meaning, observed timestamp and ranges. Missing low/high stays null. Do not default currency to listing currency or USD. |
| `/api/v1/analyst/{ticker}/consensus` | Existing `normalizeSentiSenseTargets` → `Research.analystTargets` enrichment in `lib/sentisense-provider.ts` | Overview/Valuation analyst cases and Analysts targets, using existing source selection | Keep low/mean/high analyst opinions distinct from calculated AURYN scenarios. Existing owner-preview contract and protection cannot be assumed to grant public production access. |
| `/api/v1/stocks/fundamentals/periods`, `/api/v1/stocks/fundamentals/history`, `/api/v1/stocks/fundamentals/current` | New validated adapter behind `lib/providers.ts` `fundamentals`/`research`, yielding `Research.facts` only where the complete `Fact` identity/period/unit contract is satisfied | `researchPeriods` → FinancialPicture, FinancialExplorer, tables; downstream valuation and scenario inputs | Match duration vs instant, quarterly vs YTD, GAAP/IFRS/provider basis, shares vs money, source records, reporting currency and statement/filing dates. Missing filing metadata must not be fabricated to satisfy `Fact`; extend an explicit neutral contract if the upstream cannot supply it. Do not map ratios into raw statement facts. |
| `/api/v1/stocks/{ticker}/kpis`, `/api/v1/stocks/{ticker}/kpis/types` | Defer until typed metric definitions and unit/basis mapping are verified; map only genuinely equivalent metrics to an existing financial catalog field | Existing Financials metric selector/detail, no KPI tab | Business KPI is not interchangeable with an accounting metric. Unknown units/periods remain unavailable, not numbers in a familiar label. |
| `/api/v1/documents/ticker/{ticker}`, `/api/v1/documents/stories/ticker/{ticker}` | Provider-neutral news loader at `app/api/news/route.ts`, currently `eodNews`; retain the current `EodNews` item contract only for licensed dated headline/source-link records | `NewsCoverage` → `newsDesk`: existing News & earnings list and full-list dialog | Verified title, publication time, safe publisher URL, identity/relevance and display rights. Stories/clusters/AI narratives must not masquerade as reported news items or duplicate their constituents. Sentiment scale is unverified: leave null until mapped. |
| `/api/v1/stocks/{ticker}/what-changed`, `/api/v1/stocks/{ticker}/earnings-summaries` | Optional later detail adapter, **not** replacement of `evidence.earnings` actual/estimate numeric records | Existing earnings detail dialog, clearly labelled analysis | Summaries are analysis, not audited financial facts. Do not derive actual EPS/revenue or report dates from prose. |

## Keep the screen model small

- No new tabs. Prefer replacing an equivalent validated dataset behind the same domain boundary.
- Keep `/api/research/[symbol]` responsible for coherent research snapshots; optional context must not delay basic company/quote/history availability.
- Fetch news through the existing separate news request, not through every research render. Do not call the 113-endpoint inventory on page load.
- Do not replace the whole `evidence` object with estimates-only content: preserve ownership, fundamentals, earnings and profile sections. Introduce provider-neutral types deliberately rather than inventing EOD-specific metadata for a new source.
- Cache keys need source, security identity, dataset and relevant period/query dimensions. Preserve economic observation timestamps independently from fetch time; cache freshness is not report freshness.
- Handle unauthorized, rate-limited, transport error, valid empty coverage and partial coverage distinctly on the server. Keep currently valid fallback data with truthful freshness/provenance; never turn failure into zero or fabricated consensus. Preserve material missing-state explanations, with operational details internal.

## Replacement test gates

Existing suites to retain (no new remote fixtures were captured here):

1. `sentisense-targets`, `sentisense-provider`, `sentisense-cache`, `sentisense-route`: authorization/expiry, request bounds, denial protection, cache age, symbol/currency/target ordering. New dataset adapters need equivalent tests, not removal of these protections.
2. `targets-estimates`, `estimate-revisions`, `scenario-source-dates`, `scenario-inputs`, `scenario-selection-regression`, `valuation-contract`: annual fiscal dates, stale estimates, missing currency, missing bounds, EPS/revenue counts, analyst-vs-model distinctions and consistent scenario selection.
3. `financial-normalization`, `financial-explorer`, `financial-workspace`: annual/quarter/YTD overlap, instant balances, TTM completeness, mixed currencies, zero vs null, per-share bases, missing facts and raw-source drilldown.
4. `news-desk`, `home-news-refinement`, `public-news-composition`: duplicate URLs/headlines, unrelated symbols, future/invalid dates, malicious URL schemes, empty results and consistent list limits. Add distinct story/analysis fixtures before exposing those content types.
5. Adapter comparison fixtures must include APP/NBIS/IREN plus loss-making, non-USD, sparse-coverage and multiple-share-class companies. Compare old/new values, missingness and timestamps before changing precedence. A few examples cannot establish all-stock coverage or DCA Optimizer equivalence.

New fixture tests required before enabling each dataset: malformed payload rejection; explicit response/schema version; partial record handling; no overwrite by older snapshots; pagination/truncation; 401/403/429/timeouts; no secrets in errors or cached output; no extra request fan-out on tab switching. Licensing/public-display acceptance remains a separate gate from passing numeric tests.
