# Visible Pace and accurate earnings states

This correction supersedes the Pace-disclosure design in ACTION_WEB_RELEASE_20261027.md. It preserves the approved app and the existing accumulation formula.

## Changes

- AURYN Pace is visible without opening “Price readings & dates.” Both available periods show their P level, accumulation name and date; the confirmed reason is visible on the research card. Overall Buy/Add/Wait/Hold/Reduce guidance remains alongside the price reading and does not overwrite it. Home and portfolio summaries retain a named confirmed Pace.
- Strategy Lab previously used the legacy monthly-v1 policy. It now uses the active monthly-v5 calculation and the same settled-price and execution convention as the main evaluation tool. The strategy comparison and price-history tool identify their model. No monthly-v5 thresholds were changed.
- Home distinguishes reported results, scheduled-today reports and future earnings. Every company on the featured earnings date has its own visible status and research link. Calendar navigation goes to the full event list. Reported zero/loss EPS is preserved; passing the scheduled hour alone never becomes proof of release.
- Reported events leave upcoming portfolio earnings exposure and approaching alerts. A lagging calendar cannot overwrite a known reported EPS with a blank. US dates use the exchange day, including after UTC midnight.
- Home and mounted Portfolio calendars refresh while visible and on focus return. Server earnings caches are five minutes; an earnings-specific cache namespace invalidates legacy six-hour shared entries, and earnings bypass Next's extra fetch cache. Source delays still cannot be eliminated by the client.
- The desktop company-metrics toggle no longer occupies an extra grid position. On mobile it expands four visible metrics to all available header metrics. Long company names no longer form a large sticky overlay covering the research content. Pace text contrast and hierarchy are tightened.
- Public risk language uses AURYN Pace branding. The accompanying launch review records unresolved performance evidence, licensing, privacy operations and regulatory questions.

## Verification

- `npm test`: **799 passed, 0 failed, 0 skipped**.
- `npm run typecheck`: passed.
- `npm run build`: passed; 34 static pages generated.
- `npm run test:api`: all nine scripts passed. These use controlled transports/databases; no live payment or email was sent.
- `scripts/validate-pace-integrity.mjs`: five synthetic regimes at 10 and 50 bps passed timing and cash-accounting invariants. Existing historical report hashes do not match the current policy; this is recorded explicitly and is not an outperformance result.
- Independent final review: 34 focused tests passed with no important remaining findings. Reviewer also checked 18 equity/crypto settlement and cost scenarios against the evaluator.
- Browser QA used explicitly labelled temporary synthetic fixtures: forming P4/confirmed P2, eight header metrics, long company names, and mixed reported/pending same-day earnings. At 1280px desktop there were eight metric cells and no toggle. At 390px and 360px mobile, the toggle showed four/eight cells correctly, and document width equalled scroll width. Research, Home and Watchlist retained visible Pace/status content; Pace help and the earnings calendar anchor worked.
- Temporary QA fixtures, HTML harness, preview environment and frame-header changes were removed. Original frame protection is restored; demo data was not changed in the delivered source. `git diff --check` passed.

Logs: `pace-earnings-validation/`. Broader previous functionality and its validation are retained in the full source. These checks do not certify live feed coverage, identical production snapshots, investment performance or legal compliance.

## Handoff

Production is unchanged. No push, deployment, provider-contract acceptance, DNS change, analytics activation, account creation or external message was performed. Use [Pace verification and launch decisions](PACE_TRUST_AND_LAUNCH_20261027.md) and [website activation](WEBSITE_ACTIVATION_20261027.md) before commercial launch. Support contact remains support@auryninvest.com.
