# Mobile repairs and dated formula comparison — 5 November 2026

## Mobile work
Unified porcelain light-mode PWA metadata, header and dock. Watchlist now owns its mobile table layout and restores hidden cells. Portfolio cards use a single surface, readable ticker identity and focus accents instead of persistent yellow touch hover. History charts measure container width instead of shrinking a 1,000-unit desktop SVG; an expandable exact-values table supports reading without touching a graph. Footer spacing, dock selection and settings account layout were refined.

Includes earlier desktop/public Home/research Home/search/settings/congressional disclosure fixes. Production build and 887 tests passed. Desktop preview loaded; physical installed iOS visual acceptance remains pending. Not deployed.

## Fresh formula checks
Reran the existing integrity audit against 200 retained provider histories: 199 usable and passing, WBD unavailable, 1,791 checks. This verifies specified OHLC, SMA50/200, Wilder RSI14, Fibonacci, relative volume, future-data exclusion, Pace prefix invariance and completed/forming checks. It does not certify every financial/valuation metric.

## Twenty-ticker DCAOptimizer comparison
Signed in through the secure browser prompt and directly observed 20 Monthly/Standard provisional readings. Updated the retained daily histories with newly retrieved observations through November 4. Computed AURYN at 2026-11-05T00:00:00Z, using only prior completed daily observations. Exact outputs are in twenty-ticker-values.csv and dated-comparison.json; source page observations are retained in reference-observations.json.

- Provisional monthly level agreement: 19/20.
- Same-date closing quotes agree to cents: 19/20.
- SOFI: AURYN P1 versus reference 2X at the same $17.38 close. Full available SOFI history (1,467 observations) leaves the difference unchanged. AURYN October confirmed level is P2. Do not substitute that confirmed level for the forming November reading.
- XOM: provider history close $169.27 versus reference $169.44, difference -$0.17. Both monthly levels are 1. Source quote discrepancy remains unresolved.
- APP: once updated to November 4, AURYN forming P3 agrees with reference 3X; October confirmed P4 is a different period. The earlier P4/P3 observation mixed dates.
- Additional supplied example OSCR: full-history AURYN confirmed P1 (October 30) and forming P1 (November 4); reference provisional 1X and $35.19 agree. The supplied analyst target comparison (36.40/35.19-1)*100 is 3.438476839%, correctly displayed +3.4%. The analyst target source was not independently reconciled.

The 20 tickers are APP, SOFI, NVDA, AAPL, MSFT, AMZN, GOOGL, META, TSLA, PLTR, AMD, COIN, HOOD, JPM, XOM, JNJ, KO, DIS, PYPL, ADBE. This is a convenience sample, not a random or independent validation of every asset.

## Limits
No production formulas or ticker-specific overrides were changed to force agreement. DCAOptimizer states its formula is proprietary. This snapshot cannot establish formula equivalence, historical signal parity, common indicator numerical parity, or investment performance. Its Last confirmed section sometimes describes a prior buy/trim event rather than last month's level, so no 20/20 confirmed comparison is claimed. AURYN P1 Hold wording and reference 1X Add wording are not equivalent recommendations despite the same numeric category.

Most calculations use 501 daily observations; SOFI uses 1,467. Underlying adjusted-history provenance, full-history dependence, all financial statements, analyst estimates, options and intraday data remain separate audit work. Prior comparison JSON files referenced by older docs were absent; those old match claims were not reused.

Reproduce: node --experimental-strip-types scripts/audit-dca-observations.mjs with the retained private daily-history files. Licensed raw histories are excluded from the distributable ZIP.
