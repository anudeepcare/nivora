# Overview analyst headline correction — 12 November 2026

The active Research Overview now gives its Bear/Base/Bull row one consistent meaning: supplied analyst low, consensus and high targets. Previously the row could prefer an intrinsic cash-flow or earnings/revenue model, then fall back to historical price behavior, while another panel separately showed analyst targets. This explained the conflicting and irrelevant-looking numbers relative to the user's reference screenshots.

## Changes
- The Overview headline reads the same current, validated analyst observations as the analyst-target panel.
- Percentage gaps use the shared settled-close reference; a later after-hours quote does not replace it.
- Historical-price ranges, blended analyst/history ranges and intrinsic models no longer substitute for missing analyst headline values.
- Model and historical methods remain separately labelled in the expandable method comparison and valuation tools. The decision engine and Pace policy are unchanged.
- A full analyst range appears once; the duplicate target panel is suppressed. A consensus-only observation remains visible in the existing target panel.
- Missing or stale low/high observations produce a concise incomplete-range message. No targets are synthesized.
- The informational price pillar compares with analyst consensus even when low/high are missing. It does not alter the engine's action or position size.

## Validation
Three new regressions reproduce the previous incorrect model replacement, incomplete-range substitution and stale-target substitution, and pass with the correction. Existing tests were updated where the requested headline semantics intentionally changed. The full suite contains 1,368 passing software tests. See software-checks.json for final build status.

A static renderer exercised the real StockPillars component and stylesheet with complete and incomplete analyst observations. Browser visual inspection could not run because the cloud browser's URL policy rejects local file previews; no end-to-end visual pass is claimed. No CSS layout redesign was made.

This release changes source presentation and selection. It does not supply missing analyst target coverage or establish 100% live parity with DCA Optimizer. It does not activate the research-only Pace candidate from the prior release. Nothing was deployed to production.

## Run
Extract the AURYN directory. With Node 24, run npm ci and npm run verify. Use the existing environment configuration; no database migration is introduced.
