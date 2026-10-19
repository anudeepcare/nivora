# Observed IREN reconciliation correction — 2026-10-19

The user supplied the deployed `/api/research/IREN` JSON. The regression fixture retains only company metadata, quote, financial facts and scenario evidence; no account positions, credentials or full price history.

## Reproduced cause

Quote 28.19 USD, 394,058,648 shares, market cap 10,635,642,880 USD. Cash 5,895,591,000 and debt 7,839,600,000, both from the same June 30 annual balance sheet. Supplied EV 20,484,394,388 and EV/revenue 26.5043 do not reconcile with these inputs or trailing revenue 707,006,976. The original function withheld scenarios.

## Correction

When reported EV fields conflict, construct a calculated EV/revenue sensitivity using quote × reported shares + dated net debt. Divide by trailing revenue only when the latest complete reported annual/TTM revenue independently corroborates its unit and denominator within 10%. Listing market cap/share/price reconciliation, currencies, stale quotes, matched cash/debt, positive ordered annual forecast ranges and sector suitability still gate the calculation. No ticker-specific exception was added.

The calculated multiple is price-anchored, not a finding of intrinsic value. It does not independently establish a buy signal. Future capex, funding requirements and dilution beyond the disclosed stresses remain unmodelled. The observed IREN forecasts include a very wide revenue range; resulting sensitivity values must not be presented as validated targets.

## Verification limits

The original function failed the observed-response regression; the corrected function passes it and rejects corrupt share units, uncorroborated revenue units and missing supporting statements. Additional renamed infrastructure fixtures test shared logic, not actual NBIS or TE payloads. ASTS listing conflicts and development-stage framework are not resolved by this change. No claim of universal stock coverage or a deployed fix is made. PWA shell and navigation geometry were not changed.
