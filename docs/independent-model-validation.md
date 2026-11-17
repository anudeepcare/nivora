# Independent model validation

Date: 2026-11-17. These checks validate Auryn's own open formulas. They do not claim parity with DCA Optimizer or reconstruct any third-party implementation.

## Pace hand calculation

Input: twelve settled monthly closes of `$100`, followed by a current-month price of `$80`, explicit USD currency, as of 2026-11-17.

- 12-month average: `$100`.
- Sample standard deviation: `$0`; minimum spread rule is 10% of average, so spread is `$10`.
- P2: `min(0.90 × 100, 100 − 0.50 × 10) = min(90, 95) = $90`.
- P3: `min(0.75 × 100, 100 − 0.95 × 10, long average) = $75`.
- P4: `min(0.65 × 100, 100 − 1.30 × 10, long average) = $65`.
- `$80` is below P2 but above P3, therefore the independent result is `P2`.

This is encoded as an executable regression in `tests/independent-arithmetic.test.js`.

## Bear/Base/Bull hand calculation

Input: revenue TTM `1000`, operating margin `20%`, net cash `100`, shares `100`, and forward revenue growth `10%`, all USD-consistent.

- Bear assumptions: growth `2%`, margin `15%`, multiple `10`. Price: `((1000 × 1.02 × .15 × 10) + 100) ÷ 100 = $16.30`.
- Base assumptions: growth `10%`, margin `20%`, multiple `14`. Price: `((1000 × 1.10 × .20 × 14) + 100) ÷ 100 = $31.80`.
- Bull assumptions: growth `15%`, margin `24%`, multiple `18`. Price: `((1000 × 1.15 × .24 × 18) + 100) ÷ 100 = $50.68`.

The product exposes these intermediate values and retains separate timestamps for quote, fundamentals, and estimates. A combined scenario timestamp remains unknown when the inputs do not share a verified common as-of time.

## User-provided DCA reference examples

The accessible user-provided snapshot was captured 2026-11-12 and contains display rows such as:

- `AA`: close `$41.04`, `3X DCA`, next displayed level `4X $38.20`.
- `AAL`: close `$14.10`, `1X DCA`, next displayed level `2X $12.67`.
- `A`: close `$176.95`, `1X DCA`, no next level displayed.

Those fields are not numerically comparable to Auryn's independent outputs: the snapshot provides DCA multipliers and a next level, but not the historical monthly closes needed for Pace or the revenue, margin, net-cash, share-count, and forward-estimate inputs required by Bear/Base/Bull. Therefore no numeric parity, error percentage, or inferred mapping is reported. The reference is used only to confirm this semantic gap and the need for a user-approved, input-complete comparison sample.

## Preserved unknowns and exclusions

- Missing input timestamps remain unknown.
- Missing currency does not default to USD.
- Analyst targets never become calculated scenarios.
- Preview, sample-company, mismatched-ticker, future-dated, stale, incomplete, or currency-inconsistent inputs are ineligible.
- Split-like price discontinuities require adjusted-history review.
- Outputs are estimates and educational research evidence, not recommendations or brokerage accounting.
