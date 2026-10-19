# Connected research release — October 19

## Working changes
- Holdings-aware research strip, shown only for held instruments. Combines lots, shows current priced USD weight and observed-gap-down dollar stress. Denominator coverage, quote date and loading/exclusion states are explicit. Uses the existing cached/batched portfolio quote path; no new quote endpoint or per-metric requests.
- Portfolio exposure inclusion now matches headline valuation for stale quotes, invalid quantities/costs and USD cash. Previously the exposure summary could include a stale holding that the headline excluded.
- Shared linear scale for cash-flow sensitivities, dated forecast-multiple scenarios and supplied analyst consensus. Methods remain separate; no fabricated agreement score. Cash-flow central/conservative/optimistic assumptions are distinguished from forecast bear/base/bull. Missing/invalid methods are withheld and quote/horizon caveats remain.
- Removed the redundant radar; retained the labeled screening composite, lens selection and actual evidence. No scoring-rule changes.
- Empty measured counter-case now explicitly lists what to investigate rather than implying no risk.
- Simple/Pro reading-depth labels expose the existing evidence-detail preference; this is not a paid entitlement switch.
- Financial review thresholds can be saved directly as idempotent alert rules through the existing authenticated documents API. Opening Alerts allows manual checks. Financial rules require an initial baseline and later crossing; they do not retroactively announce an existing breach. All-customer continuous scheduling/email/push is not implemented.
- Optional selected-company comparison restored in Advanced, up to six companies including the current one. Same-sector medians require aligned inputs and do not claim industry-wide coverage.
- Optional private decision notes and dated snapshots restored in Thesis. These use existing owner-scoped records and observations. Notes remain editable and are not a transaction-based outcome journal.
- Focused reviewed CSV import in Portfolio, reusing the existing validated/idempotent import endpoint. Users preview records before confirming. Existing holdings are retained; imported rows add positions.
- Public /reliability disclosure explains coverage, corrections and known gaps. It is not a live uptime dashboard or an independently audited service-level report.
- Home already uses HomeUpdates, scoped to held/followed symbols, for supplied news and earnings. This release preserves it.

## Feedback coverage and remaining work
| Requested area | State |
| --- | --- |
| Defensible-decision product promise | Entry-page copy updated; research remains evidence-based |
| Find → understand → decide → track → review | Search, research, planning, watchlists/positions, threshold alerts and editable notes connected; full outcome review pending |
| Saved universe screens | Not implemented; selected-company comparisons are not a screener |
| Position-aware research | Implemented with priced-denominator coverage and gap assumptions |
| Holdings news/earnings | Existing scoped HomeUpdates preserved; data availability varies |
| Simple/Pro | Existing detail setting relabeled; not a universal customizable-layout engine |
| Peer comparisons | User-selected up to six; automatic curated peers/industry ranks pending |
| Product/region segments | Normalized series and entitlement/coverage verification pending |
| Earnings quality | Existing cash conversion, accruals and working-capital calculations remain; anomalies are not independently filing-audited |
| Capital allocation | Existing dilution, SBC, reported buybacks and insider evidence; complete historical attribution pending |
| Earnings workflow | Supplied dates/preparation and reported data; automated before/after expectation archive pending |
| Metric sources | Existing provenance and original filing links; transcript passage retrieval/citations pending |
| AI Q&A, thesis checker, automatic counter-case | Existing requested analysis stays separate; no newly fabricated grounded-AI subsystem or price predictions |
| Thesis to alerts | Numeric financial thresholds can save real rules; arbitrary prose is not parsed into machine conditions |
| Journal/outcome review | Editable private notes and immutable canonical snapshots; transaction-aware realized R/adherence review pending |
| CSV onboarding | Reviewed import implemented; brokerage OAuth and guided 60-second flow pending |
| Export/share | Existing company brief module retained in source; public licensed sharing/complete workbench exports not activated |
| MFA/security | Existing Supabase Auth and owner-scoped APIs preserved; TOTP enrollment/recovery and live security audit pending |
| Reliability | Public release/coverage disclosure; live metrics and incident automation pending |
| Paid plans | Billing, subscription webhooks, quotas and access gates not implemented |
| Legal/commercial licensing | Templates/disclosures exist; legal review and vendor redistribution permissions require external action |
| Historical signal scorecard | Not implemented; no validated performance claims |

## Verification and limits
231 tests, type checks and production build: verification/connected-workspace-verify.log. Fixture API regressions: verification/connected-workspace-api.log. New calculation tests cover total reconciliation and holding exposure. No live Supabase write, paid data entitlement, production deployment, payment or physical iPhone verification was performed. Existing schema/migrations are reused without modification. No trade is submitted.
