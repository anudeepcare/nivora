# 1,000-symbol analyst-target evidence audit

Audit date: November 13, 2026. This is an honest audit of evidence available for **1,000 named symbols**, not a completed 1,000-stock bear/base/bull parity test. **The cohort includes ETF-labelled instruments; it is not a verified set of 1,000 eligible common stocks.** Missing observations are not filled with model targets, prices, recommendations, or copied reference values.

## Result

- Current independent reference targets: **2 stocks** (IREN and NBIS).
- Current Auryn preproduction observations: **2 stocks**, both consensus-only with no low/high and no verified unique target-analyst count.
- **998 stocks have no current pair; 2 are partial.** Complete low/consensus/high comparisons: **0/1,000**. Complete-pair agreement is **not available**, not 0%.
- Consensus-only comparisons: **2/1,000**, or **0.2% coverage**. One matches and one differs, so agreement among those two available consensus pairs is **50%**. This is not a 1,000-stock match rate.
- **0 pairs have verified matching target revision dates.** Same-day UI observations are distinguished from a target revision date.
- Strict verification **does not pass**. All evidence-comparison commands intentionally return exit code **1** because the required evidence is incomplete.

## Observed values before the package fixes

All values below are USD, observed November 13 against the November 12 settled close. Neither source supplied a target revision date.

| Stock | Settled close | Reference low | Reference consensus | Reference high | Reference target analysts | Auryn consensus | Auryn low/high | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| IREN | 19.48 | 23.00 | 56.69 | 139.00 | 19 | 56.69 | Absent | Consensus matches; triple unavailable |
| NBIS | 128.64 | 84.00 | 271.20 | 410.00 | 20 | 278.05 | Absent | Consensus differs by +6.85; triple unavailable |

Auryn displayed recommendation totals of 20 and 22. These are **not evidence of 20 or 22 unique target contributors**, so the normalized records leave analysts null. Its dataset update date was November 12; that date does not establish when the targets were revised. The current Auryn UI records are transcribed authenticated UI observations; no screenshot artifact is included. They describe the pre-fix deployed environment, not the newly fixed local build.

Sources: [IREN reference](https://dcaoptimizer.com/app/charts?symbol=IREN), [NBIS reference](https://dcaoptimizer.com/app/ticker/NBIS), [IREN Auryn preproduction](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/IREN), [NBIS Auryn preproduction](https://nivora-git-preprod-anudeeppaleru.vercel.app/research/NBIS?tab=Analysts). Full transcribed observations and limitations are in source-dca-current-ui.json and source-auryn-current-ui.json.

## Archived evidence is kept separate

The old 500-stock report had four screenshot reference fixtures and zero actual provider-feed observations. An additional APP reference triple was found in the saved independent UI observations. The saved NBIS UI observation corroborates that archived NBIS fixture. This yields **five unique archived reference stocks**: NFLX, IREN, NOW, NBIS and APP, still with **zero actual archived feed observations**.

The screenshot fixture close dates were assigned from conversation context. The normalized archive explicitly labels those dates inferred instead of pretending they were verified on the saved source. The independent NBIS and APP UI observations preserve their actual recorded close dates and capture day.

Archived NBIS consensus was 278.05. Current reference consensus is 271.20. Comparing an old reference as current truth would conceal that difference. The stale-control audit rejects both IREN and NBIS because the archived reference closes are November 11 and the current Auryn closes are November 12. Their target revision dates also remain unknown.

The saved alphabetical 1,000-row screener contains Pace labels and settled prices, **not analyst targets**. It is useful as a cohort source but cannot establish target parity. The saved AAPL direct-provider probe contains low 250, average 344.6155 and high 425. It has no target analyst count or verified dated settled close, and is not an observation from Auryn's feed. It is retained separately and cannot become a paired result.

## Cohort selection

Retain every symbol in the earlier 500-stock analyst cohort, then append the first 500 symbols not already present from the saved alphabetical U.S.-stocks screener. The resulting 1,000 unique symbols include IREN, NBIS, NFLX and NOW. This is deterministic and **not random or representative of the full market**. Despite its U.S.-stocks filter label, the source includes ETF-labelled symbols such as ARKB, BTC and CHPY. Instrument types have not been independently revalidated, so this is not proof of 1,000 eligible common stocks. It is not the exact original alphabetical screener cohort, which ended at EFSI and excluded those four control stocks. See cohort-selection.json for the rule and source hashes; cohort-1000.json is the full requested set. The saved broad-market study reports 1,305 stocks but explicitly omits its raw files; the recovered directory contains only its aggregate summary and report, not a per-stock instrument directory. Other saved universe lists contain only 200 or 500 symbols without instrument classifications. None supplies a verified 1,000-common-stock replacement. See cohort-universe-review.json.

## Files and interpretation

- audit-1000.csv: one row per requested stock, with current state, actual/reference values, archived evidence availability, and concrete limitations. Empty values mean unavailable, not zero.
- comparison-current-1000.json: all 1,000 current comparison outcomes.
- comparison-archived-1000.json: the separate archived comparison with five references and no actual feed records.
- comparison-stale-controls.json: demonstrates why old screenshots cannot substitute for current comparisons.
- Each comparison has a .manifest.json containing exact input/output SHA-256 hashes, cohort size, metric definitions, and strictPass=false.
- reference-current.json, actual-current.json, reference-archived.json and actual-archived.json: normalized inputs, with source and date provenance.
- source-provider-probe.json: the saved AAPL probe, excluded from paired Auryn comparisons.
- summary.json: concise machine-readable results.

The comparator distinguishes missing, partial, invalid, date-incomparable, basis-incomparable and fully compared records. Full-triple and consensus comparisons have separate denominators. Its legacy agreement field still means exact matches divided by the whole cohort; do not interpret it as comparable-pair agreement. pairAgreement and each subgroup's agreement are null when there are no pairs.

Same-day observation-only comparisons are useful for showing what two UIs displayed, but strict success additionally requires explicit matching target revision dates for every stock, matching settled-close dates and values, all three valid targets, and matching known target-analyst counts. Dataset freshness and recommendation counts cannot supply these missing facts.

## Reproduce

From the repository root:

```sh
node --experimental-strip-types scripts/compare-analyst.mjs \
  verification/analyst-1000-20261113/cohort-1000.json \
  verification/analyst-1000-20261113/reference-current.json \
  verification/analyst-1000-20261113/actual-current.json \
  verification/analyst-1000-20261113/comparison-current-1000.json

node --experimental-strip-types scripts/compare-analyst.mjs \
  verification/analyst-1000-20261113/cohort-1000.json \
  verification/analyst-1000-20261113/reference-archived.json \
  verification/analyst-1000-20261113/actual-archived.json \
  verification/analyst-1000-20261113/comparison-archived-1000.json

node --experimental-strip-types scripts/compare-analyst.mjs \
  verification/analyst-1000-20261113/cohort-stale-controls.json \
  verification/analyst-1000-20261113/reference-stale-controls.json \
  verification/analyst-1000-20261113/actual-current.json \
  verification/analyst-1000-20261113/comparison-stale-controls.json --expected-count 2
```

Expected exit code: 1 for each. The generic tool requires exactly 1,000 unique symbols by default; --expected-count allows an explicitly declared different scope. The old compare-analyst-500.mjs entry point remains compatible with cohorts of at least 500 but now uses the corrected metrics and strict manifest.

## What remains unverified

A genuine 1,000-stock parity test needs independently licensed, dated reference and Auryn feed snapshots for the same stocks, settled closes, target revisions and currency, including low/mean/high and target-contributor counts. No further provider calls were made because the available quota interpretation was ambiguous. No bulk or systematic reference-site extraction was performed because its current terms prohibit it.

The code fixes in this package improve normalization, provenance and missing-data reporting. They do not manufacture absent feed values, acquire a missing bulk dataset, or prove a deployed build now matches the reference. Software checks and the evidence audit are separate claims.
