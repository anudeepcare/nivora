# Coverage and recovery validation — 27 October 2026

## Verified outcome

Provider recovery now checks the completeness and age of the newest comparable operating period before accepting EODHD statements. A single reported value no longer bypasses SEC. The selected financial collection comes entirely from one source. EODHD company identity, ownership and other independent evidence remain available when SEC statements are selected. Successful quotes and history remain usable when statements, profiles or filings fail.

Research has optional per-dataset `coverage` records for quote, history, profile, fundamentals and filings: available, partial, unavailable or not-applicable, with reasons and dates where observed. Missing evidence is a data status, not a negative business conclusion. Crypto corporate statements and filings are explicitly not applicable.

## Exact enabled universe

This implementation supports USD-quoted US listings and USD crypto pairs. It does not enable international trading or claim worldwide coverage.

| Source | Full directories read | Eligible rows |
| --- | --- | --- |
| EODHD | `exchange-symbol-list/US`, `exchange-symbol-list/CC` | USD common and preferred stocks, ETFs, ADR/depositary receipt and REIT rows on enabled US venues; USD crypto pairs |
| Twelve Data | `stocks` and `etf`, country United States; `cryptocurrencies`, quote currency USD | USD equities on the existing supported US exchanges, matching stock types, and USD crypto pairs |

Enabled EODHD venue labels are US, NASDAQ, NYSE, NYSE ARCA, NYSE AMERICAN, AMEX, NYSE MKT, BATS, CBOE, OTCQX, OTCQB, OTCMKTS, OTC, OTCBB, OTCGREY, PINK and NMFQS. Twelve equity validation retains its existing NASDAQ/NYSE/Arca/American/AMEX/MKT/BATS/CBOE venue constraints. OTC USD rows therefore depend on EODHD and are not promised Twelve fallback. Foreign issuers' US ADRs are included when their listing identity and USD price are verified; their financial reporting currency remains unchanged.

Mutual funds, warrants, units, bonds, non-USD prices and native international listings remain outside these directories' eligible application universe. Delisted rows are not requested by this active-instrument audit. Provider directory inclusion does not establish current quotes, historical depth, news, fundamental coverage or subscription entitlement.

Directories are read without a result-count limit and deduplicated by safe US class identity. Search examines the complete eligible universe before limiting displayed results to 12. Exact symbols, company-name tokens, US exchange prefixes, explicit `.US` suffixes and class aliases are supported. Verified provider search remains a fallback for renamed-company aliases absent from the current directory and for incomplete directory discovery. A crypto alias alone no longer manufactures a search result without a provider listing.

Known international suffixes such as `.L`, `.TO`, `.HK` and `.XETRA` are rejected before provider traffic. They are not converted into US class-share dashes. Valid `.A`/`.B` class aliases remain equivalent to `-A`/`-B`. Ambiguous class letters that are also foreign exchange suffixes require explicit US qualification or the US dash spelling. Unknown multi-letter dot suffixes are not presumed US share classes.

## Recovery method and limits

The completeness probe requires revenue, net income, operating income, operating cash flow and capex within one annual or quarterly period with identical start, end, currency and accounting basis. Monetary units must match currency; non-finite, future and malformed periods are excluded. A quarterly period older than 220 days or annual period older than 550 days triggers recovery. These are conservative data-refresh heuristics, not filing deadlines or business-quality scores. They do not imply that generic operating metrics are appropriate for every sector.

SEC collections are compared by current complete coverage, current coverage, metric count and comparable period end; the primary wins ties. Selecting SEC replaces the facts collection wholesale, retaining reported currency, basis, source links and filing dates. There is no cross-provider/currency/period fact splicing. Independent SEC filings can survive even when EODHD remains the better facts collection. Current complete EODHD statements avoid extra SEC requests; this is recovery, not mandatory independent corroboration of every value.

Successful directories are cached for one day; failed/empty directories cannot become a successful day-long catalog. Discovery snapshots retry after one minute. Existing provider dataset caches, quote/history retention limits and request budgets remain in effect. A retry is bounded by those existing cache policies. The new coverage contract does not guarantee that every upstream dataset can be refreshed immediately.

## Repeatable audit

Run from the repository root, with real credentials supplied through the server environment. No credential values are written to the report or console.

```bash
node --experimental-strip-types scripts/audit-market-coverage.mjs --mode=directory --output=verification/coverage-directory.json
node --experimental-strip-types scripts/audit-market-coverage.mjs --mode=full --max-credits=250 --output=verification/coverage-full.json
node --experimental-strip-types scripts/audit-market-coverage.mjs --mode=full --max-credits=250 --resume=verification/coverage-full.json --output=verification/coverage-full.json
```

Use Node's `--env-file` option only with an existing private environment file if desired. The script does not discover or copy secrets. Its default is directory discovery. Full mode tests every eligible directory listing, with no ticker-count cutoff, recording per-feature totals and each listing's results for quote, daily history, profile, fundamentals, filings, estimates, earnings, Pace and news. EODHD filings are checked independently when the base research response lacks them. Estimates/earnings reflect the existing normalized evidence; Pace reflects the actual monthly-v5 implementation. News is tested through EODHD when configured. Intraday, options, transcript, congress and all possible third-party enrichment entitlements are outside this audit's feature set.

The default extra audit ceiling is 250 estimated weighted credits, configurable from 1 to 8,000. Actual adapter budgets and shared protection still apply; none are disabled. EODHD estimates use the existing `eodCallCost`; Twelve profile requests count 10 and supported audit requests count one. HTTP 402/429 and existing budget/allowance denials stop new work. Untested or interrupted rows remain `not-tested`, rather than being mislabeled provider coverage failures. Completed observations preserve their `testedAt` when resumed; start without `--resume` for a fresh pass. Provider failures are observation-time results, not proof of permanent lack of coverage. A large universe may require many allowance windows.

## What ran here

`verification/market-coverage-20261027.json` was generated by the real audit entry point in full mode. EODHD key/token, Twelve key, valid SEC contact identity and Supabase service credentials were absent. No live provider requests were made. Consequently:

| Measure | Result |
| --- | --- |
| Provider discovery complete | No |
| Verified live enabled-universe size | Unknown (`null`) |
| Known live directory listings | 0 retrieved; not evidence of an empty market |
| Live securities/datasets tested | 0 |
| Provider credit estimate / HTTP requests | 0 / 0 |
| Live global or full-universe completeness claim | None |

The controlled tests execute the real adapter graph with only the external HTTP boundary replaced. Added regressions were observed failing before fixes: sparse EOD bypassing SEC, stale complete EOD bypassing newer SEC, loss of independent filings, foreign-suffix collision, exchange qualification, full directory rows beyond search limits, partial dataset status, Twelve-only profile recovery, OTC directory omission, cached empty directories, renamed-company lookup, audit truncation/status accounting and provider-budget interruption. Mixed currency/period comparison and current complete-source behavior are additionally covered.

The latest focused command is recorded in `verification/provider-coverage-tests-20261027.txt`:

```bash
node --experimental-strip-types --test tests/market-coverage.test.mjs tests/market-coverage-audit.test.mjs tests/ticker-resilience.test.mjs tests/provider-routing.test.mjs tests/eodhd.test.mjs
```

It passed 60 tests, with zero failures. `tsc --noEmit` passed. This task did not run a production build, commit or deploy.

An intermediate full `npm test` during parallel integration ran 705 tests: 681 passed and 24 failed outside this provider task. The failures were 21 scenario-pipeline cases across nested-annual/flat-fiscal/flat-relative forms (complete: infrastructure, foreign-software; missing-eps: software, infrastructure, foreign-software; incomplete-nearer: infrastructure, foreign-software), the unreconciled-fundamentals Edge test, and two UI-control SSR tests with `Scale is not defined`. These were reported to the responsible integrators. Final whole-change test/build status belongs in the release verification; this intermediate run is not represented as green.

## Remaining evidence needed

A credentialed run must still establish current directory totals, per-exchange counts, provider entitlements and empirical feature failures for the full discovered universe. Exact live financial inputs for the screenshot tickers were not fetched here. The work does not establish global portfolio currency conversion, overseas exchange calendars, ADR-to-ordinary-share conversion, arbitrary symbol-history mappings, point-in-time delisted coverage or investment performance. International expansion remains gated on those end-to-end identity/currency requirements.

Primary endpoint references checked during implementation:

- EODHD, [Exchanges API and full ticker lists](https://eodhd.com/financial-apis/exchanges-api-list-of-tickers-and-trading-hours): the US code is composite, rows carry actual venues, and the exchange-symbol list is not paginated.
- EODHD, [Supported cryptocurrency pairs](https://eodhd.com/financial-apis/list-supported-crypto-currencies).
- Twelve Data, [Symbol directory guidance](https://support.twelvedata.com/en/articles/5620513-how-to-find-all-available-symbols-at-twelve-data) and [API documentation](https://twelvedata.com/docs).

## Later authenticated connector reconciliation

After the initial server-environment audit, an authenticated Twelve Data connector became available. This is a separate access path: the production repository still has no provider API credentials, so the original full-universe audit remains unverified. `verification/live-market-reconciliation-20261027.json` contains the sanitized connector snapshot and calculations.

All 11 requested representative symbols returned dated USD quotes and matching profiles: MSFT, JPM, O, IREN, CIFR, BE, ZETA, APP, ASTS, BRK.B and QQQ. Quotes were explicitly constrained to their US exchange. The live BRK.B response also matched the application's BRK-B class alias. All 11 passed symbol/exchange/currency checks, positive-price and OHLC consistency checks, preservation of `last_quote_at`, and independent recomputation of percentage change from close and previous close within 0.0001 percentage points. These are dated observations, not a promise of continuous freshness; later normalization correctly marks observations stale as they age.

The connector denied MSFT quarterly income-statement, quarterly cash-flow and statistics probes with an explicit subscription-entitlement message. No financial statement rows were returned. Therefore **zero live statement margins or FCF calculations were reconciled**, and statement dates, reporting currencies and unit scales remain unknown in this snapshot. Other stocks' statement endpoints were not redundantly requested after the capability denial; those per-symbol checks are marked not-tested. QQQ is classified as an ETF rather than assigned corporate operating statements. No subscription change or purchase was attempted.

Company profiles omit a currency field. IREN's profile also reports Australia as issuer country while its quote is NASDAQ/USD. This exposed a real recovery defect: the profile fallback rejected otherwise usable profiles because it required `profile.currency`. The fallback now requires an independently matching same-exchange USD directory listing when profile currency is absent. It never infers trading currency from issuer domicile. Regression tests first reproduced the failure, then verified recovery and rejection of an unmatched or non-USD directory row.

Connector classifications are preserved as supplied, not endorsed: IREN was labeled Financial Services / Capital Markets, and APP Communication Services / Advertising Agencies. Model applicability still requires business context and comparable evidence.

Requests used at most two concurrent calls. The usage tool returned `plan_limit=0`; subsequent profile responses revealed an enforced 55-credit/minute ceiling. Six initial profile attempts were rate-limited and succeeded in later allowance windows. The saved report records those retries. This connector check proves representative identity/quote/profile access only; it does not establish full-universe coverage, production API behavior, statement entitlement, or investment accuracy.

After the connector-driven profile fix, the focused provider command passed **62 tests**, with zero failures, and `tsc --noEmit` passed. The earlier 60-test record above describes the pre-connector stage; `verification/provider-coverage-tests-20261027.txt` now contains the latest 62-test run.
