# V9.6.3 Decision + Scenario Audit

The V9.6.3 audit is diagnostic only. It is designed to answer two production questions before V9.7 calibration:

1. Is one new-money action (especially WAIT) dominating the real universe because of a specific gate or veto?
2. Are Bear/Base/Bull scenarios independently informative, or is Base mechanically clustering around current price?

## Input
Provide a JSON array of captured production decision rows. Supported fields include:

`symbol`, `snapshotId`, `newMoneyAction`, `ownerAction`, `longTermAction`, `opportunityScore`, `entryQuality`, `evidenceQuality`, `decisionScore`, `hardVetoReasons`, `policyReasons`, `closestPath`, `distanceToBuy`, `currentPrice`, `bearValue`, `baseValue`, `bullValue`.

Missing fields are counted rather than converted to bearish zeroes.

## Run
```bash
npm run audit:v963-decisions -- --input decision-audit-input.json --output decision-scenario-audit.json
```

## Interpretation
`WATCH` in `decisionDispersion` or `scenario.independence` is a diagnostic flag, not an automatic release failure and not a reason to manufacture more BUY calls. Review dominant blockers, contradiction rows, closest-to-upgrade rows and scenario anchoring before changing policy.
