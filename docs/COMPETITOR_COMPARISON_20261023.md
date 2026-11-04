# Continuation note

Separate weekly-v1 accumulation, a focused public storefront and corrected Home coverage have now been added. See CONSOLIDATED_PRODUCT_BUILD.md for current scope. The observations and private-signal limitations below remain unchanged.

# Three-platform comparison and AURYN implementation

Observed authenticated web interfaces on 23 October 2026 UTC, using the displayed 22 October US close where specified. These are interface observations, not independently audited company financials. Five companies were inspected across all three products: APP, IREN, ASTS, MSFT and NU. An additional DCA reading was inspected for SAP. AURYN's connected-history audit covers fourteen instruments; raw licensed histories are excluded from this distribution.

## Comparable observations

| Instrument | DCA Optimizer | ValueSnapshot | Versys | AURYN implication |
|---|---|---|---|---|
| APP | $264.28; 4× confirmed September and 4× forming October | DCF $607.60; EPS $497.60 at $264.28 | Fair value $370.05; separate 2028 projection base $584 | Different assumptions and horizons produce different answers. Do not average these as a verified fair value. |
| IREN | $25.51; 2× confirmed, 4× forming | Overview $77.81 labelled analyst consensus. Model comparison displayed DCF $0 and EPS $1,045,495.65 while stating EPS is not applicable | Fair value $320.73 with a P/S growth model; separate 2028 bear/base/bull $18/$63/$106 | A consensus target, growth sensitivity and negative-EPS model are not interchangeable. Funding and capacity must be evaluated. |
| ASTS | $38.77; 2× confirmed, 4× forming | Model comparison displayed DCF $0, EPS −$9.30, with EPS not applicable | Fair value $41.77; 2028 bear/base/bull $33/$33/$68 | Frontier businesses need deployment, monetization and financing assumptions. Zero cash flow is not zero equity value. |
| MSFT | 1× forming; current cap displayed $3.96T. Price was not captured in the same summary observation | At $521.08: DCF $644.40; EPS $986.39; Rule40 36; PEG 1.16 | At $521.08 reference close: fair value $644.65; 2028 base $690 | A mature profitable business can support cash-flow and earnings sensitivities, with their assumptions visible. |
| NU | $14.73; 2× confirmed, 1× forming | DCF $0; EPS $28.04; PEG 0.80. Combined verdict Hold, summary rating Buy | Business rating explicitly adjusted for banks; fair value $26.49; 2028 base $31 | Bank cash flows require a sector-specific lens; no generic operating-company DCF. Displayed recommendation summaries can disagree even within one interface. |
| SAP | $240.59; 1× confirmed and forming | Not inspected in this completed comparison | Not inspected in this completed comparison | Keep ADR/listing, share units and reporting currency distinct. |

DCA Optimizer separates confirmed monthly verdicts, forming readings and intramonth touches. Its rules are private; AURYN cannot verify or reproduce them from these observations. Its chart zones are not business-quality assessments. No counterpart DCA readings were observed in ValueSnapshot's inspected valuation panels or Versys's inspected company panels.

ValueSnapshot's APP DCF workspace visibly used 25% revenue growth, 65.9% FCF margin, 20× terminal FCF, five years and a 10% discount rate. Its own analyst-growth reference was 18.9%. The $607.60 output is conditional on those defaults; it is not an independent ground-truth price. Versys exposed a reference to “Classic DCF (FMP)” in an inspected valuation panel, which establishes use of that calculation, not its complete data stack or commercial costs.

## Adopted product patterns

| Useful pattern | AURYN location / implementation | Status |
|---|---|---|
| Clear business conclusion before detailed evidence | Overview / `DecisionOverview.tsx` | Implemented; live correctness still depends on supplied inputs |
| Company identity, listing and market cap together | Research header / `headerMarketContext` | Implemented; reported cap labelled by observation |
| Revenue, cash generation and dilution over time | Overview mini-charts; Business / `BusinessHistory.tsx` | Implemented using comparable reported annual periods |
| Distinguish analysts from calculated value | Value / `ModelAssessment.tsx`, `ResearchOutlook`, `ValuationLab` | Implemented; unavailable inputs stay unscored |
| Confirmed versus forming accumulation | Overview and Technicals / `researchAccumulation` | One monthly-v3 calculation; not competitor-equivalent |
| Coloured monthly history and dated zone bands | Technicals / `AccumulationDesk.tsx` | Implemented; settled observations only |
| Equal-budget historical comparison | Technicals / `evaluateAccumulation` | Implemented with costs, carried cash and next-observation execution |
| Financial statement depth and period controls | Financials / `FinancialPicture`, `ResearchWorkbench` | Existing implementation preserved and restyled |
| Trend, momentum, volatility and participation groups | Technicals / `TechnicalDashboard` | Existing metrics preserved; unified grouping and numeric styling |
| Analyst distribution and dated opinion | Analysts / `AnalystRatings` | Implemented where supplied; target ranges not invented |
| Events, earnings history and transaction records | News / `EarningsWorkspace`, `CompanyUpdates` | Existing evidence preserved; duplicate preparation panel removed |
| Professional risk workbench | Advanced / `AdvancedResearch`, `ProfessionalContext`, `MarketContext` | Existing functionality preserved; context endpoints load on demand |
| Public explanation before account creation | `/`, `/sample`, `/login` | Why AURYN, illustrative sample and account-mode copy implemented |
| Coherent light/dark/accent experience | `product-surfaces.css`, appearance preferences | Implemented; pixel/device acceptance not established |

## Not claimed or silently activated

- No proprietary competitor algorithm was obtained, cloned or reverse-engineered.
- No claim of superior returns, unique intellectual property or all-ticker model coverage.
- No new paid service, commercial data redistribution permission, billing subscription or external order execution.
- Filing AI, options data, broker connections and notification delivery require their actual configured capabilities and entitlements; this revision does not certify those integrations.
- Payment, legal and authentication interfaces are not evidence that a commercial launch is approved or that all jurisdictions are covered.
- Browser rendering against the local build was unavailable in this environment. Physical installed-iPhone PWA acceptance remains unverified; shell geometry was deliberately preserved.
