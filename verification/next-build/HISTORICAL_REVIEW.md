# Historical test inventory

The final complete historical run produced **1,791 tests: 1,475 passed, 316 failed, zero skipped** (`historical-current.log`). The unchanged baseline produced **1,644 tests: 1,344 passed, 300 failed** (`historical-baseline.log`). The current release acceptance gate is separately defined by the repository's existing test policy; it passed 907 tests.

This is **not a green full historical suite**. Do not erase the failing output or claim every test passes. The final comparison has 17 newly incompatible historical assertions and one resolved baseline assertion. The earlier observed margin-of-safety regression was fixed; its current behavioral test passes and it is absent from the final failure set.

| Historical assertions newly incompatible with this upgrade | Current behavior and evidence |
|---|---|
| V5/V6/V7 client payload, V42 snapshot, V61 snapshot dedupe/Today, V59 inline Supabase builder | Shared research now authenticates and recomputes on the server from a symbol, instead of accepting frozen client-authored action/price objects. `canonical-write-boundary`, `canonical-projection-integrity`, `auryn-v934-cross-surface` and retained serializer tests exercise the new boundary. |
| V9.3.1 surface contract and V9.3.4 inline bridge | Current surfaces use a shared adapter and persisted canonical decision; source-string assertions require obsolete component names/inline declarations. `intelligence-dimensions`, `canonical-projection-integrity`, `auryn-v934-decision-bridge` verify current behavior. |
| V8.1 diagnostic broker test | Diagnostics no longer submit unaudited paper orders. `paper-operations`, `paper-runner-route`, `manual-paper-route` and `manual-paper-broker-lifecycle` verify the audited path and policy/market gates. |
| V9.3.7 direct tab setter | A depth/horizon-aware tab handler now wraps the action. Browser research navigation and technical/expanded chart controls are tested directly. |
| V9.9910/11/15 old local financial variables/DCF gate | The source-backed financial model is now shared and validates actual inputs/cross-checks. `financial-assessment-v1` verifies missing-value integrity, independent valuation and margin-of-safety math. |

`historical-comparison.json` lists the exact assertion titles. Many baseline failures concern retired UI/source contracts. They were not all rewritten or established harmless in this build; they remain an explicit maintenance/acceptance limitation. No broad test deletion or disabling was performed to make the current acceptance count green.
