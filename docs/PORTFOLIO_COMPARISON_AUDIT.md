# Portfolio comparison audit and confirmed fixes

Source/test audit only; no production accounts, Mac access, live provider requests, or rendered-browser claims.

## Confirmed defects fixed

1. The comparison component was mounted only in read-only mode on Portfolio. No mounted UI could perform its existing saved-ledger review and explicit completeness confirmation. The saved TransactionWorkspace now exposes that unchanged workflow in an opt-in disclosure. It is not mounted for demo, empty saved ledgers, unsaved imports, or while saving/loading. The label explicitly says comparison uses all saved accounts, not the transaction-table filter. Revision changes remount the workflow. The removed empty Portfolio panel stays removed.
2. Cash-only histories used only inception/end points, omitting intermediate deposits and withdrawals. Their valuation dates now include every actual ledger event, plus inception/end. Regression verifies correct cash, contributions and zero gain at each event, with matched SPY/QQQ points when exact prices exist. No past market price is invented.

The job algorithm version is now `raw-ledger-v2-cash-events`. Earlier saved comparisons require an explicit reviewed rebuild; account transaction records are not deleted or rewritten. Existing expiry/revision/digest/owner checks remain.

## Preserved financial constraints

The account chart is dated ledger equity and net contributions, not a current-holdings backcast. Benchmark balances invest the same net daily deposits and withdrawals in SPY/QQQ at exact adjusted closes, using one whole-window response per ETF. They are hypothetical cash-flow-matched balances, not portfolio time-weighted returns or the indices themselves. USD ETF identity and adjustment basis are checked; unsupported/missing/duplicate prices, cash flows on dates without closes, or withdrawals requiring benchmark borrowing withhold that comparison. One unavailable ETF does not erase the other. No annualized/percentage return is fabricated.

Account evidence requires confirmed complete inception records, reconciled cash/units, raw USD closes, and corroborated split events. Jobs support up to 50 US-listed symbols and inception at most one year ago, through yesterday. Unsupported ledgers and missing evidence fail closed, not partially. Saved jobs expire after 24 hours. These are product limits, not claims of complete broker reconciliation or unlimited history.

## Verification

72 history/benchmark/job/restore/ledger/mobile-source tests pass, including actual SQL owner/revision job guards and mounted UI checks; scoped ESLint and project TypeScript pass. Layout source retains bounded SVG sizing, wrapped mobile controls/readouts, and horizontal scrolling only for wide dated tables. Browser pixel layout and live-provider end-to-end results remain unverified. Independent review is the final slice gate; integrated release testing remains with the release coordinator.
