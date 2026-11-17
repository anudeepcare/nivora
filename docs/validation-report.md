# Validation report — 2026-11-17

- Synthetic model-fixture mode: `synthetic-model-fixtures`
- Synthetic requested/passed/failed/skipped: `512 / 512 / 0 / 0`
- Real-security manifest: `512` unique symbols from the user-provided 2026-11-12 reference snapshot
- Real securities live-validated: `0`
- Actual live provider validation: `not-run`
- Actual live requested/passed/failed: `0 / 0 / 0`
- Parity claim: `false`

The synthetic harness exercises model invariants and is not ticker coverage. The separate real-security manifest is only the intended future live-validation universe. It does **not** establish provider coverage, entitlements, or parity. `artifacts/coverage.json` records all three states separately.

Provider coverage: **not run**. The SentiSense Pro and EODHD All-in-one portal plans were verified read-only, and Vercel metadata confirms both Secret variables exist. Vercel Secret values are intentionally non-retrievable through the connected tool, so this separate executor still has no credential injection path. Active plans are not endpoint-by-endpoint live acceptance.

## Visual QA status

- The local server starts and responds on `127.0.0.1:4173`.
- Cloud-browser surfaces cannot route to the executor's localhost.
- Executor Chromium exits before rendering because process-singleton sockets are denied by the runtime policy, including isolated-profile/no-sandbox attempts.
- Playwright WebKit was downloaded to the tool cache, but the host lacks its required GTK/Graphene/Harfbuzz/Manette/Hyphen/GLES libraries. No screenshot was produced.
- Static responsive CSS and HTTP/UI behavior contracts pass, but they are not visual-browser evidence. Desktop/mobile visual QA therefore remains **not run**, and no Figma fidelity claim is made.

A safe future path is an executor image with Playwright browser dependencies preinstalled, or an authorized browser surface that can reach the local server. Installing system GUI libraries or deploying the app was outside this task's authorization.
