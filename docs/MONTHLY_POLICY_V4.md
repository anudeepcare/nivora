# Monthly v4 — comparison and rules, 23 October 2026

This is AURYN's original, calibrated price-condition model. It is not the private DCA Optimizer formula, a company valuation, a return forecast or an automatic trading instruction. Multipliers describe a baseline contribution; they are not leverage.

## Observed comparison

Authenticated visible DCA Optimizer Monthly / Standard pages were inspected for 13 stocks, using settled observations through 22 October 2026. September confirmed and October forming readings are compared separately. Current v3 matched 19 of 26 readings; production v4 matches 26 of 26.

| Stock | Reference confirmed / forming | AURYN v3 | AURYN v4 |
|---|---|---|---|
| IREN | 2 / 4 | 1 / 2 | 2 / 4 |
| APP | 4 / 4 | 3 / 3 | 4 / 4 |
| ASTS | 2 / 4 | 3 / 4 | 2 / 4 |
| MSFT | 1 / 1 | 1 / 1 | 1 / 1 |
| NU | 2 / 1 | 2 / 1 | 2 / 1 |
| HIMS | 1 / 1 | 1 / 1 | 1 / 1 |
| SAP | 1 / 1 | 1 / 1 | 1 / 1 |
| NBIS | 1 / 1 | 1 / 3 | 1 / 1 |
| CIFR | 2 / 4 | 2 / 4 | 2 / 4 |
| META | 1 / 1 | 1 / 1 | 1 / 1 |
| NVDA | 1 / 1 | 1 / 1 | 1 / 1 |
| NOW | 1 / 1 | 1 / 1 | 1 / 1 |
| BE | 1 / 1 | 1 / 2 | 1 / 1 |

The first eight stocks and the supplied IREN historical screenshots were used to calibrate the model. The last five were inspected afterward without retuning. This small additional sample is mostly baseline readings, all on one market date; it does not establish broad or future parity. Production replay also matches all 26 supplied IREN months, August 2024–September 2026, including strong/light trim categories. That history is calibration evidence, not independent validation. See `verification/monthly-v4-reference-audit.json` for dates, prices, individual readings and simulated outcomes. Raw licensed histories and authenticated screenshots are not bundled.

## Rules

Eligibility retains 24 consecutive completed prior months, valid settled closes, market-session continuity and stale-period guards from v3. The signal uses the preceding 12 completed monthly closes, excluding the observation being assessed:

- Anchor = arithmetic average of those closes.
- Spread = larger of their sample standard deviation and 10% of the anchor.
- 2x requires at least 10% below anchor and 0.5 spread units below it.
- 3x requires at least 25% below anchor and 1.35 spread units below it.
- 4x requires at least 40% below anchor and 1.5 spread units below it.
- Otherwise 1x, unless the upper extension guard applies: v3's robust-trend pause, or price at least three times the cycle anchor and two spreads above it.
- Strong extension review retains v3's strong guard or requires the cycle-extension guard plus three spreads and a 50% rise versus the preceding monthly close. Other extension reviews are light. Both are 0x contribution conditions; neither specifies how much to sell.

There are no ticker exceptions. These cutoffs are empirically calibrated choices, not a published financial law. The cycle anchor avoids treating an extrapolated growth trend as the only reference for a pullback; it can still misclassify structural business deterioration. Fundamental quality and financing risk remain separate.

Forming readings can change until month-end. Confirmed readings use completed final sessions. Settlement guards and missing-history behaviour remain intact. Unavailable history is never turned into 0x. Monthly UI, Overview, Technicals and the monthly evaluator now share v4; prior v3 stays available in source and via the evaluator's optional policy parameter.

## Limits and return study

The equal-budget historical study used 100 model units deposited monthly, carried-cash-only increased purchases, next-period observed opening prices and 10 basis points purchase costs. Of 12 eligible stocks, v4 finished ahead of fixed monthly purchases in 3, behind in 2 and equal in 7. NBIS lacked the required execution history. ASTS and BE performed worse than both fixed purchases and v3. Dividends, cash interest, taxes, survivorship and all execution frictions are not fully modeled. This is a retrospectively calibrated, selected sample; no superior investment performance is established.

Weekly v1 is unchanged and uses a different horizon and model. IREN weekly still differs: reference confirmed/forming 4/4 versus AURYN 3/3. This build does not claim weekly parity, universal competitor equivalence, all-feature completion or installed-iPhone visual acceptance. ValueSnapshot valuation and DCA Optimizer price zones are distinct comparisons; matching these monthly zones does not validate price targets.
