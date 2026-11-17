# Research workspace audit · 17 October 2026

User direction: review every ValueSnapshot stock tab and implement useful information in AURYN with simple, visual mobile/desktop UX. Implementation is authorized in the conversation. Preserve AURYN branding and prior removals of Compare/private notes; no new subscriptions, paid AI calls, trading activation or production deployment.

## Observed signed-in APP workspace

| Reference tab | Observed value | AURYN treatment |
|---|---|---|
| Overview | Quote, price range, financial grid, small trends, bull/bear explanation | One evidence snapshot, concise assessment, essential metrics and six charts |
| Charts | Annual/quarterly/TTM; category filters, search, chart expansion; profitability/cash flow/balance/valuation | Searchable chart catalogue with accessible detail and exact values; period/currency/source labels |
| Financials | Income, balance and cash-flow statements; historical changes | Expand SEC metric ingestion and expose chart/table views of the same evidence |
| Valuation | DCF/EPS/PEG/Rule of 40; assumptions and model comparison | Keep explicit DCF assumptions; add earnings scenario and dated multiples. Do not treat Rule of 40 as intrinsic value |
| Analyst | Price-target range, revenue/EPS forecasts; page credits Yahoo consensus and FMP forecasts | Existing earnings estimates remain; full consensus requires entitled provider integration; never fill with inferred values |
| Transcripts | Dated calls, full transcript and AI-summary switch | Keep dated SEC disclosures available; licensed transcripts remain a coverage gap |
| Compare | Up to three peers and valuation/growth/quality metrics | User previously removed Compare; do not reintroduce a top-level tab |
| AI Analysis | Existing deep dive/SWOT, summary, business, strengths/risks, valuation assumptions | Shared financial evidence and always-available rule-based financial case; optional configured AI remains separately labeled |
| Snapshot | Compact one-sheet with charts and model values; editable fields and sharing | Overview acts as the one-sheet; do not duplicate it with another tab |
| Projection Studio | Bear/base/bull assumptions, revenue/margin/share/multiple drivers; Pro upgrade gate | Use explicit earnings scenarios and existing specialist models; no hidden paywall bypass or copied model |

Chart categories inspected: Essentials, Profitability, Cash Flow, Balance Sheet, Valuation (catalogue and labels); Segments; Company KPIs. APP's Company KPIs displayed no approved KPIs. Segment coverage needs separate ingestion; companyfacts only covers standardized entity-wide facts. Projection Studio gate was not changed. Existing AI reports were read; no generate/regenerate action was taken.

Observed quality issues are reasons for stronger validation: the AI report described no debt while the statement showed debt; displayed price targets differed between sections; annual and TTM values must not be mixed. These observations do not establish the competitor's internal implementation or all data vendors.

Sources reviewed through UI: https://valuesnapshot.io/stock/APP ; financial trends labeled FMP. SEC companyfacts documentation: https://www.sec.gov/search-filings/edgar-application-programming-interfaces . No competitor text, data or algorithm is shipped in AURYN.

## Design and implementation contract

Architectural extension to the existing research workspace, executed inline to limit cost. Single financial source model feeds all new cards and charts. Charts use readable axes, period labels, negative baselines and direct detail access. Desktop: three columns; narrow mobile: one chart per row. Theme colors derive from existing light/dark tokens. CSS module owns new UI; avoid global override layers.

Expand supported fields: gross profit/cost of revenue, R&D, stock compensation, buybacks, dividends, diluted EPS and weighted shares, equity/current assets/current liabilities and interest expense. Compute margins and ratios only from compatible periods, currency and accounting basis. Preserve zero vs missing, guard stale quotes, ADR units and insufficient history. Do not sum balance-sheet values across quarters or subtract cumulative weighted shares/EPS. Per-metric sources accompany calculations.

Financial bull/bear factors describe observed data and conditional implications, not verified competitive moat or individualized Buy/Sell advice. Business quality and price timing stay separate. Paid AI, universal consensus, transcripts, segment KPIs and production/iPhone acceptance remain explicit limitations.

## Verification contract

Financial tests cover extended ingestion, currency/period boundaries, zero vs missing, quarterly/TTM math, weighted shares, dated ratios and scenario assumptions. Run entire suite, TypeScript, production build and built API checks. Managed environment lacks control-browser; no improvised browser QA and no claim of visual or installed-iPhone acceptance. This limits production readiness despite passing code checks.
